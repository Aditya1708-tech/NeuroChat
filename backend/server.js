import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 NeuroChat Backend API listening on ${env.SERVER_URL}`);
    console.log(`📡 Accepting client requests from ${env.CLIENT_URL}`);
    console.log(`🤖 AI Provider: Google Gemini (${env.GEMINI_MODEL})`);
  });
}

startServer();
