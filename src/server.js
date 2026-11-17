// Local / traditional server entry. On Vercel, api/index.js is used instead.
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  await connectDB();
  console.log('MongoDB connected');
  app.listen(env.port, () => console.log(`Nimbus API running on http://localhost:${env.port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
