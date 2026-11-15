import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env, getGeminiChatKey, getGeminiImageKey, getNemotronApiKey } from './config/env.js';

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 NeuroChat Backend API listening on ${env.SERVER_URL}`);
    console.log(`📡 Accepting client requests from ${env.CLIENT_URL}`);
    console.log(`💬 Chat Provider 1 (Gemini Key 1): Google Gemini (${env.GEMINI_MODEL}) [${getGeminiChatKey() ? 'Active' : 'Missing'}]`);
    console.log(`🎨 Image Provider 2 (Gemini Key 2): Gemini Image Studio (${env.GEMINI_IMAGE_MODEL}) [${getGeminiImageKey() ? 'Active' : 'Missing'}]`);
    console.log(`⚡ Chat Provider 3 (NVIDIA Key): NVIDIA Nemotron 3 Ultra (${env.NVIDIA_NEMOTRON_MODEL}) [${getNemotronApiKey() ? 'Active' : 'Missing'}]`);
  });
}

startServer();
