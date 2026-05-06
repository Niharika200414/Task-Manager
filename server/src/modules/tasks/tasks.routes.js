const express = require('express');
const Task = require('../../models/Task');
const Membership = require('../../models/Membership');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/asyncHandler');
const { HttpError } = require('../../utils/httpError');
const { requireProjectMember, requireProjectRole } = require('../../middleware/rbac');
const { projectIdParams, taskIdParams, createTaskBody, updateTaskBody, listTasksQuery, assignBody } = require('./tasks.schemas');

const router = express.Router({ mergeParams: true });

function toUserRef(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  };
}

function toTaskPayload(task) {
  const assignee = task.assignedTo && typeof task.assignedTo === 'object' && task.assignedTo._id ? toUserRef(task.assignedTo) : null;
  const creator = task.createdBy && typeof task.createdBy === 'object' && task.createdBy._id ? toUserRef(task.createdBy) : null;

  return {
    _id: String(task._id),
    projectId: String(task.projectId),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    assignedTo: assignee?.id || (task.assignedTo ? String(task.assignedTo) : undefined),
    createdBy: creator?.id || String(task.createdBy),
    assignee,
    creator,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function withTaskRelations(query) {
  return query.populate('assignedTo', 'name email').populate('createdBy', 'name email');
}

router.use(requireAuth);
router.use(validate({ params: projectIdParams }));
router.use(requireProjectMember((req) => req.params.projectId));

async function assertAssigneeIsMember(projectId, userId) {
  if (!userId) return;
  const m = await Membership.findOne({ projectId, userId }).lean();
  if (!m) throw new HttpError(400, 'VALIDATION_ERROR', 'Assignee must be a project member');
}

function canEditTask(req, task) {
  if (req.membership.role === 'ADMIN') return true;
  return String(task.createdBy) === String(req.user.id) || String(task.assignedTo || '') === String(req.user.id);
}

router.post(
  '/',
  validate({ body: createTaskBody }),
  asyncHandler(async (req, res) => {
    if (req.membership.role !== 'ADMIN' && req.body.assignedTo && String(req.body.assignedTo) !== String(req.user.id)) {
      throw new HttpError(403, 'FORBIDDEN', 'Members can only assign tasks to themselves');
    }
    await assertAssigneeIsMember(req.params.projectId, req.body.assignedTo);
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;

    const task = await Task.create({
      projectId: req.params.projectId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status || 'TODO',
      priority: req.body.priority || 'MEDIUM',
      dueDate,
      assignedTo: req.body.assignedTo,
      createdBy: req.user.id,
    });

    const savedTask = await withTaskRelations(Task.findById(task._id)).lean();
    res.status(201).json({ task: toTaskPayload(savedTask) });
  })
);

router.get(
  '/',
  validate({ query: listTasksQuery }),
  asyncHandler(async (req, res) => {
    const q = { projectId: req.params.projectId };
    if (req.query.status) q.status = req.query.status;
    if (req.query.assignedTo) q.assignedTo = req.query.assignedTo;
    if (req.query.overdue === 'true') {
      q.dueDate = { $lt: new Date() };
      q.status = { $ne: 'DONE' };
    }

    const tasks = await withTaskRelations(Task.find(q).sort({ updatedAt: -1 })).lean();
    res.json({ tasks: tasks.map(toTaskPayload) });
  })
);

router.get(
  '/:taskId',
  validate({ params: taskIdParams }),
  asyncHandler(async (req, res) => {
    const task = await withTaskRelations(
      Task.findOne({ _id: req.params.taskId, projectId: req.params.projectId })
    ).lean();
    if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found');
    res.json({ task: toTaskPayload(task) });
  })
);

router.patch(
  '/:taskId',
  validate({ params: taskIdParams, body: updateTaskBody }),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ _id: req.params.taskId, projectId: req.params.projectId });
    if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found');
    if (!canEditTask(req, task)) throw new HttpError(403, 'FORBIDDEN', 'Cannot edit this task');

    if (Object.prototype.hasOwnProperty.call(req.body, 'assignedTo')) {
      if (req.membership.role !== 'ADMIN') {
        throw new HttpError(403, 'FORBIDDEN', 'Only admins can reassign tasks');
      }
      await assertAssigneeIsMember(req.params.projectId, req.body.assignedTo);
      task.assignedTo = req.body.assignedTo;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'dueDate')) {
      task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;
    }

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.priority !== undefined) task.priority = req.body.priority;

    await task.save();
    const savedTask = await withTaskRelations(Task.findById(task._id)).lean();
    res.json({ task: toTaskPayload(savedTask) });
  })
);

router.delete(
  '/:taskId',
  validate({ params: taskIdParams }),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ _id: req.params.taskId, projectId: req.params.projectId }).lean();
    if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found');

    if (req.membership.role !== 'ADMIN' && String(task.createdBy) !== String(req.user.id)) {
      throw new HttpError(403, 'FORBIDDEN', 'Cannot delete this task');
    }

    await Task.deleteOne({ _id: task._id });
    res.status(204).send();
  })
);

router.post(
  '/:taskId/assign',
  validate({ params: taskIdParams, body: assignBody }),
  requireProjectRole(['ADMIN']),
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ _id: req.params.taskId, projectId: req.params.projectId });
    if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found');

    await assertAssigneeIsMember(req.params.projectId, req.body.userId);
    task.assignedTo = req.body.userId || undefined;
    await task.save();
    const savedTask = await withTaskRelations(Task.findById(task._id)).lean();
    res.json({ task: toTaskPayload(savedTask) });
  })
);

module.exports = router;
