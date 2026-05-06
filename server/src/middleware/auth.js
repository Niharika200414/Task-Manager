const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { HttpError } = require('../utils/httpError');

function requireAuth(req, _res, next) {
  const auth = req.header('authorization') || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'UNAUTHORIZED', 'Missing access token'));

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch {
    next(new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired access token'));
  }
}

module.exports = { requireAuth };
