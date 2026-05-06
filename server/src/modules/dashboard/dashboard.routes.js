const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../../middleware/auth');
const { asyncHandler } = require('../../utils/asyncHandler');
const Membership = require('../../models/Membership');
const Project = require('../../models/Project');
const Task = require('../../models/Task');

const router = express.Router();

function toTaskCard(task, projectNameById) {
  return {
    _id: String(task._id),
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    projectId: String(task.projectId),
    projectName: projectNameById.get(String(task.projectId)) || 'Project',
    updatedAt: task.updatedAt,
  };
}

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const memberships = await Membership.find({ userId: req.user.id }).lean();
    const projectIds = memberships.map((m) => new mongoose.Types.ObjectId(m.projectId));
    const roleByProject = new Map(memberships.map((membership) => [String(membership.projectId), membership.role]));

    if (!projectIds.length) {
      return res.json({
        summary: {
          totalProjects: 0,
          adminProjects: 0,
          memberProjects: 0,
          tasksAssignedToMe: 0,
          completedTasks: 0,
          overdueTasks: 0,
          completionRate: 0,
        },
        myTasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        overdue: [],
        upcoming: [],
        recentProjects: [],
      });
    }

    const now = new Date();
    const [projects, tasks, memberRows] = await Promise.all([
      Project.find({ _id: { $in: projectIds } }).sort({ updatedAt: -1 }).lean(),
      Task.find({ projectId: { $in: projectIds } }).sort({ updatedAt: -1 }).lean(),
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

    const projectNameById = new Map(projects.map((project) => [String(project._id), project.name]));
    const memberCountByProject = new Map(
      memberRows.map((row) => [
        String(row._id),
        {
          memberCount: row.memberCount,
          adminCount: row.adminCount,
        },
      ])
    );

    const assigned = tasks.filter((task) => String(task.assignedTo || '') === String(req.user.id));
    const overdue = assigned
      .filter((task) => task.dueDate && task.dueDate < now && task.status !== 'DONE')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
    const upcoming = assigned
      .filter((task) => task.dueDate && task.dueDate >= now && task.status !== 'DONE')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8);

    const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const t of assigned) byStatus[t.status] = (byStatus[t.status] || 0) + 1;

    const recentProjects = projects.slice(0, 6).map((project) => {
      const projectTasks = tasks.filter((task) => String(task.projectId) === String(project._id));
      const completedTaskCount = projectTasks.filter((task) => task.status === 'DONE').length;
      const overdueTaskCount = projectTasks.filter(
        (task) => task.dueDate && task.dueDate < now && task.status !== 'DONE'
      ).length;
      const nextDueTask = projectTasks
        .filter((task) => task.dueDate && task.status !== 'DONE')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      return {
        _id: String(project._id),
        name: project.name,
        description: project.description,
        myRole: roleByProject.get(String(project._id)),
        taskCount: projectTasks.length,
        completedTaskCount,
        overdueTaskCount,
        memberCount: memberCountByProject.get(String(project._id))?.memberCount || 0,
        completionRate: projectTasks.length ? Math.round((completedTaskCount / projectTasks.length) * 100) : 0,
        nextDueDate: nextDueTask?.dueDate,
      };
    });

    res.json({
      summary: {
        totalProjects: projects.length,
        adminProjects: memberships.filter((membership) => membership.role === 'ADMIN').length,
        memberProjects: memberships.filter((membership) => membership.role === 'MEMBER').length,
        tasksAssignedToMe: assigned.length,
        completedTasks: assigned.filter((task) => task.status === 'DONE').length,
        overdueTasks: overdue.length,
        completionRate: assigned.length ? Math.round((byStatus.DONE / assigned.length) * 100) : 0,
      },
      myTasksByStatus: byStatus,
      overdue: overdue.map((task) => toTaskCard(task, projectNameById)),
      upcoming: upcoming.map((task) => toTaskCard(task, projectNameById)),
      recentProjects,
    });
  })
);

module.exports = router;
