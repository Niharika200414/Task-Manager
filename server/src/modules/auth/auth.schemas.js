const { z } = require('zod');

const signupBody = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
});

const loginBody = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(200),
});

module.exports = { signupBody, loginBody };
