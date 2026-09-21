import { env } from './env.js';

export const aiConfig = {
  model: env.GEMINI_MODEL,
  temperature: 0.7,
  maxOutputTokens: 2048,
  timeoutMs: env.AI_TIMEOUT_MS,
  maxContextMessages: 20,
  maxContextChars: 24000,
  maxInputChars: 4000,
  maxAssistantOutputChars: 20000,
  concurrencyLimit: 5,
};
