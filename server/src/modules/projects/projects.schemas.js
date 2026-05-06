const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const createProjectBody = z.object({
  name: z.string().trim().min(1).max(140),
  description: z.string().trim().max(2000).optional(),
});

const projectIdParams = z.object({
  projectId: objectId,
});

const addMemberBody = z.object({
  email: z.string().trim().email().max(320).optional(),
  userId: objectId.optional(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const memberParams = z.object({
  projectId: objectId,
  userId: objectId,
});

const updateProjectBody = z.object({
  name: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(2000).optional(),
});

const updateMemberBody = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

module.exports = {
  createProjectBody,
  projectIdParams,
  addMemberBody,
  memberParams,
  updateProjectBody,
  updateMemberBody,
};
