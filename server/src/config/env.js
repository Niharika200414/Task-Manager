const dotenv = require('dotenv');

dotenv.config();

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: mustGet('MONGODB_URI'),
  jwtAccessSecret: mustGet('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: mustGet('JWT_REFRESH_SECRET'),
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900),
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

module.exports = { env };
