const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { env } = require('./config/env');
const routes = require('./routes');
const { HttpError } = require('./utils/httpError');

function createApp() {
  const app = express();

  function isAllowedOrigin(origin) {
    if (!origin) return true;
    if (env.clientOrigins.includes(origin)) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  }

  app.use(helmet());
  app.use(morgan('dev'));
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new HttpError(403, 'CORS_BLOCKED', `Origin ${origin} is not allowed`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', routes);

  app.use((_req, _res, next) => next(new HttpError(404, 'NOT_FOUND', 'Route not found')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const code = err.code || 'INTERNAL';
    const message = err.message || 'Unexpected error';
    const details = err.details;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: { code, message, details } });
  });

  return app;
}

module.exports = { createApp };
