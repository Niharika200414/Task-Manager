const express = require('express');
const mongoose = require('mongoose');
const Project = require('../../models/Project');
const Membership = require('../../models/Membership');
const User = require('../../models/User');
const Task = require('../../models/Task');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/asyncHandler');
const { HttpError } = require('../../utils/httpError');
const { requireProjectMember, requireProjectRole } = require('../../middleware/rbac');
const {
  createProjectBody,
  projectIdParams,
  addMemberBody,
  memberParams,
  updateProjectBody,
  updateMemberBody,
} = require('./projects.schemas');

const router = express.Router();

function toProjectPayload(project, extras = {}) {
  return {
    _id: String(project._id),
    name: project.name,
    description: project.description,
    createdBy: String(project.createdBy),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    ...extras,
  };
}

async function getProjectMetrics(projectIds) {
  if (!projectIds.length) return new Map();

  const now = new Date();
  const [taskRows, memberRows] = await Promise.all([
    Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: '$projectId',
          taskCount: { $sum: 1 },
          completedTaskCount: {
            $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] },
          },
          overdueTaskCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'DONE'] },
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          highPriorityTaskCount: {
            $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] },
          },
        },
      },
    ]),
    Membership.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: '$projectId',
          memberCount: { $sum: 1 },
          adminCount: {
            $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const metrics = new Map();

  for (const row of taskRows) {
    metrics.set(String(row._id), {
      taskCount: row.taskCount,
      completedTaskCount: row.completedTaskCount,
      overdueTaskCount: row.overdueTaskCount,
      highPriorityTaskCount: row.highPriorityTaskCount,
    });
  }

  for (const row of memberRows) {
    const key = String(row._id);
    const current = metrics.get(key) || {
      taskCount: 0,
      completedTaskCount: 0,
      overdueTaskCount: 0,
      highPriorityTaskCount: 0,
    };
    current.memberCount = row.memberCount;
    current.adminCount = row.adminCount;
    current.completionRate = current.taskCount
      ? Math.round((current.completedTaskCount / current.taskCount) * 100)
      : 0;
    metrics.set(key, current);
  }

  for (const projectId of projectIds) {
    const key = String(projectId);
    if (!metrics.has(key)) {
      metrics.set(key, {
        taskCount: 0,
        completedTaskCount: 0,
        overdueTaskCount: 0,
        highPriorityTaskCount: 0,
        memberCount: 0,
        adminCount: 0,
        completionRate: 0,
      });
      continue;
    }

    const current = metrics.get(key);
    current.memberCount = current.memberCount || 0;
    current.adminCount = current.adminCount || 0;
    current.completionRate = current.taskCount
      ? Math.round((current.completedTaskCount / current.taskCount) * 100)
      : 0;
  }

  return metrics;
}

router.use(requireAuth);

router.post(
  '/',
  validate({ body: createProjectBody }),
  asyncHandler(async (req, res) => {
    const project = await Project.create({ ...req.body, createdBy: req.user.id });
    await Membership.create({ projectId: project._id, userId: req.user.id, role: 'ADMIN' });
    res.status(201).json({
      project: toProjectPayload(project, {
        myRole: 'ADMIN',
        taskCount: 0,
        completedTaskCount: 0,
        overdueTaskCount: 0,
        highPriorityTaskCount: 0,
        memberCount: 1,
        adminCount: 1,
        completionRate: 0,
      }),
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const memberships = await Membership.find({ userId: req.user.id }).lean();
    const projectIds = memberships.map((m) => m.projectId);
    const projects = await Project.find({ _id: { $in: projectIds } }).sort({ updatedAt: -1 }).lean();
    const metricsByProject = await getProjectMetrics(projectIds);

    const roleByProject = new Map(memberships.map((m) => [String(m.projectId), m.role]));
    res.json({
      projects: projects.map((project) => {
        const metrics = metricsByProject.get(String(project._id));
        return toProjectPayload(project, {
          myRole: roleByProject.get(String(project._id)),
          taskCount: metrics?.taskCount || 0,
          completedTaskCount: metrics?.completedTaskCount || 0,
          overdueTaskCount: metrics?.overdueTaskCount || 0,
          highPriorityTaskCount: metrics?.highPriorityTaskCount || 0,
          memberCount: metrics?.memberCount || 0,
          adminCount: metrics?.adminCount || 0,
          completionRate: metrics?.completionRate || 0,
        });
      }),
    });
  })
);

router.get(
  '/:projectId',
  validate({ params: projectIdParams }),
  requireProjectMember((req) => req.params.projectId),
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId).lean();
    if (!project) throw new HttpError(404, 'NOT_FOUND', 'Project not found');
    const metricsByProject = await getProjectMetrics([project._id]);
    const metrics = metricsByProject.get(String(project._id));
    res.json({
      project: toProjectPayload(project, {
        myRole: req.membership.role,
        taskCount: metrics?.taskCount || 0,
        completedTaskCount: metrics?.completedTaskCount || 0,
        overdueTaskCount: metrics?.overdueTaskCount || 0,
        highPriorityTaskCount: metrics?.highPriorityTaskCount || 0,
        memberCount: metrics?.memberCount || 0,
        adminCount: metrics?.adminCount || 0,
        completionRate: metrics?.completionRate || 0,
      }),
    });
  })
);

router.patch(
  '/:projectId',
  validate({ params: projectIdParams, body: updateProjectBody }),
  requireProjectMember((req) => req.params.projectId),
  requireProjectRole(['ADMIN']),
  asyncHandler(async (req, res) => {
    const project = await Project.findByIdAndUpdate(req.params.projectId, req.body, {
      returnDocument: 'after',
    }).lean();
    if (!project) throw new HttpError(404, 'NOT_FOUND', 'Project not found');
    const metricsByProject = await getProjectMetrics([project._id]);
    const metrics = metricsByProject.get(String(project._id));
    res.json({
      project: toProjectPayload(project, {
        myRole: req.membership.role,
        taskCount: metrics?.taskCount || 0,
        completedTaskCount: metrics?.completedTaskCount || 0,
        overdueTaskCount: metrics?.overdueTaskCount || 0,
        highPriorityTaskCount: metrics?.highPriorityTaskCount || 0,
        memberCount: metrics?.memberCount || 0,
        adminCount: metrics?.adminCount || 0,
        completionRate: metrics?.completionRate || 0,
      }),
    });
  })
);

router.delete(
  '/:projectId',
  validate({ params: projectIdParams }),
  requireProjectMember((req) => req.params.projectId),
  requireProjectRole(['ADMIN']),
  asyncHandler(async (req, res) => {
    const projectId = new mongoose.Types.ObjectId(req.params.projectId);
    await Promise.all([
      Project.deleteOne({ _id: projectId }),
      Membership.deleteMany({ projectId }),
      Task.deleteMany({ projectId }),
    ]);
    res.status(204).send();
  })
);

router.get(
  '/:projectId/members',
  validate({ params: projectIdParams }),
  requireProjectMember((req) => req.params.projectId),
  asyncHandler(async (req, res) => {
    const memberships = await Membership.find({ projectId: req.params.projectId })
      .populate('userId', 'name email')
      .lean();
    res.json({
      members: memberships.map((m) => ({
        user: { id: String(m.userId._id), name: m.userId.name, email: m.userId.email },
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  })
);

router.post(
  '/:projectId/members',
  validate({ params: projectIdParams, body: addMemberBody }),
  requireProjectMember((req) => req.params.projectId),
  requireProjectRole(['ADMIN']),
  asyncHandler(async (req, res) => {
    const { email, userId, role } = req.body;
    if (!email && !userId) throw new HttpError(400, 'VALIDATION_ERROR', 'Provide email or userId');

    const user =
      (userId ? await User.findById(userId) : null) ||
      (email ? await User.findOne({ email: email.toLowerCase() }) : null);

    if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
    const existing = await Membership.findOne({ projectId: req.params.projectId, userId: user._id }).lean();
    if (existing) throw new HttpError(409, 'ALREADY_MEMBER', 'User is already a member of this project');

    const membership = await Membership.create({ projectId: req.params.projectId, userId: user._id, role });
    res.status(201).json({
      member: {
        user: { id: String(user._id), name: user.name, email: user.email },
        role: membership.role,
        joinedAt: membership.joinedAt,
      },
    });
  })
);

router.patch(
  '/:projectId/members/:userId',
  validate({ params: memberParams, body: updateMemberBody }),
  requireProjectMember((req) => req.params.projectId),
  requireProjectRole(['ADMIN']),
  asyncHandler(async (req, res) => {
    if (req.params.userId === req.user.id) throw new HttpError(400, 'INVALID', 'Cannot change your own role');

    const [project, targetMembership] = await Promise.all([
      Project.findById(req.params.projectId).select('createdBy').lean(),
      Membership.findOne({ projectId: req.params.projectId, userId: req.params.userId }).lean(),
    ]);

    if (!project) throw new HttpError(404, 'NOT_FOUND', 'Project not found');
    if (!targetMembership) throw new HttpError(404, 'NOT_FOUND', 'Member not found');
    if (String(project.createdBy) === req.params.userId) {
      throw new HttpError(400, 'INVALID', 'Cannot change the project owner role');
    }

    if (targetMembership.role === 'ADMIN' && req.body.role === 'MEMBER') {
      const adminCount = await Membership.countDocuments({ projectId: req.params.projectId, role: 'ADMIN' });
      if (adminCount <= 1) throw new HttpError(400, 'INVALID', 'At least one admin must remain on the project');
    }

    const updated = await Membership.findOneAndUpdate(
      { projectId: req.params.projectId, userId: req.params.userId },
      { role: req.body.role },
      { returnDocument: 'after' }
    )
      .populate('userId', 'name email')
      .lean();
    res.json({ member: updated });
  })
);

router.delete(
  '/:projectId/members/:userId',
  validate({ params: memberParams }),
  requireProjectMember((req) => req.params.projectId),
  requireProjectRole(['ADMIN']),
  asyncHandler(async (req, res) => {
    if (req.params.userId === req.user.id) throw new HttpError(400, 'INVALID', 'Cannot remove yourself');

    const [project, targetMembership] = await Promise.all([
      Project.findById(req.params.projectId).select('createdBy').lean(),
      Membership.findOne({ projectId: req.params.projectId, userId: req.params.userId }).lean(),
    ]);

    if (!project) throw new HttpError(404, 'NOT_FOUND', 'Project not found');
    if (!targetMembership) throw new HttpError(404, 'NOT_FOUND', 'Member not found');
    if (String(project.createdBy) === req.params.userId) {
      throw new HttpError(400, 'INVALID', 'Cannot remove the project owner');
    }
    if (targetMembership.role === 'ADMIN') {
      const adminCount = await Membership.countDocuments({ projectId: req.params.projectId, role: 'ADMIN' });
      if (adminCount <= 1) throw new HttpError(400, 'INVALID', 'At least one admin must remain on the project');
    }

    const deleted = await Membership.deleteOne({ projectId: req.params.projectId, userId: req.params.userId });
    if (deleted.deletedCount === 0) throw new HttpError(404, 'NOT_FOUND', 'Member not found');
    res.status(204).send();
  })
);

module.exports = router;
