const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, name: user.name },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtlSeconds }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtRefreshSecret, { expiresIn: `${env.refreshTokenTtlDays}d` });
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/api/auth/refresh',
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

module.exports = { signAccessToken, signRefreshToken, refreshCookieOptions };
