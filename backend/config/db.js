import mongoose from 'mongoose';
import { env } from './env.js';

// Disable buffering so offline MongoDB transitions to devStore immediately
mongoose.set('bufferCommands', false);

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Offline: ${error.message}`);
    console.warn(`👉 NeuroChat is active with In-Memory Dev Store. Add your MongoDB Atlas URI in backend/.env for permanent persistence.`);
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

