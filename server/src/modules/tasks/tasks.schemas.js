const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const projectIdParams = z.object({ projectId: objectId });
const taskIdParams = z.object({ projectId: objectId, taskId: objectId });

const createTaskBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: objectId.optional(),
});

const updateTaskBody = createTaskBody.partial();

const listTasksQuery = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assignedTo: objectId.optional(),
  overdue: z.enum(['true', 'false']).optional(),
});

const assignBody = z.object({
  userId: objectId.nullable(),
});

module.exports = { projectIdParams, taskIdParams, createTaskBody, updateTaskBody, listTasksQuery, assignBody };
