import mongoose from 'mongoose';
import { env, assertEnv } from './env.js';

// Cache the connection on `global` so serverless invocations (Vercel) reuse it
// instead of opening a new connection on every request.
const cache = global.__mongoose || (global.__mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;

  assertEnv();

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: 8000,
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
