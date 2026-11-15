import { env } from './env.js';

export const aiConfig = {
  model: env.GEMINI_MODEL,
  temperature: 0.7,
  maxOutputTokens: 8192,
  timeoutMs: Math.max(env.AI_TIMEOUT_MS || 180000, 180000),
  maxContextMessages: 30,
  maxContextChars: 160000,
  maxInputChars: 80000,
  maxAssistantOutputChars: 80000,
  concurrencyLimit: 5,
};
