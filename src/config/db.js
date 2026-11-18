// import mongoose from 'mongoose';
// import { env, assertEnv } from './env.js';

// // Cache the connection on `global` so serverless invocations (Vercel) reuse it
// // instead of opening a new connection on every request.
// const cache = global.__mongoose || (global.__mongoose = { conn: null, promise: null });

// export async function connectDB() {
//   if (cache.conn) return cache.conn;

//   assertEnv();

//   if (!cache.promise) {
//     mongoose.set('strictQuery', true);
//     cache.promise = mongoose
//       .connect(env.mongoUri, {
//         serverSelectionTimeoutMS: 8000,
//         bufferCommands: false,
//       })
//       .then((m) => m);
//   }

//   try {
//     cache.conn = await cache.promise;
//   } catch (err) {
//     cache.promise = null;
//     throw err;
//   }
//   return cache.conn;
// }
import mongoose from 'mongoose';
import { env, assertEnv } from './env.js';

// Reuse MongoDB connection across Vercel serverless invocations
const cache = globalThis.__mongoose || (globalThis.__mongoose = {
  conn: null,
  promise: null,
});

export async function connectDB() {
  assertEnv();

  // Return existing connection if available
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  // Reuse existing connection promise
  if (!cache.promise) {
    mongoose.set('strictQuery', true);

    cache.promise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;

    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}