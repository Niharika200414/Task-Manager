const express = require('express');

const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/projects.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/projects/:projectId/tasks', tasksRoutes);

module.exports = router;
