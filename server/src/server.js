const { env } = require('./config/env');
const { connectDb } = require('./db');
const { createApp } = require('./app');

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
