const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { env } = require('../../config/env');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { asyncHandler } = require('../../utils/asyncHandler');
const { HttpError } = require('../../utils/httpError');
const { signupBody, loginBody } = require('./auth.schemas');
const { signAccessToken, signRefreshToken, refreshCookieOptions } = require('../../auth/tokens');

const router = express.Router();

router.post(
  '/signup',
  validate({ body: signupBody }),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email }).lean();
    if (existing) throw new HttpError(409, 'EMAIL_IN_USE', 'Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res
      .cookie('refreshToken', refreshToken, refreshCookieOptions())
      .status(201)
      .json({ user: { id: String(user._id), name: user.name, email: user.email }, accessToken });
  })
);

router.post(
  '/login',
  validate({ body: loginBody }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions()).json({
      user: { id: String(user._id), name: user.name, email: user.email },
      accessToken,
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'User not found');

    res.json({
      user: { id: String(user._id), name: user.name, email: user.email },
    });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Missing refresh token');

    let payload;
    try {
      payload = jwt.verify(token, env.jwtRefreshSecret);
    } catch {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid refresh token');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'User not found');

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  })
);

router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' }).status(204).send();
  })
);

module.exports = router;
