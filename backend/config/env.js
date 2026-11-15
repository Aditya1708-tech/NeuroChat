import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SERVER_URL: z.string().default('http://localhost:5000'),
  TRUST_PROXY: z.coerce.number().default(0),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/neurochat'),
  JWT_SECRET: z.string().min(16).default('neurochat_dev_jwt_secret_key_placeholder_min_32_bytes_long_12345'),
  JWT_EXPIRES_SHORT: z.string().default('24h'),
  JWT_EXPIRES_LONG: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().default('your_google_client_id_placeholder.apps.googleusercontent.com'),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Key 1: Gemini Chat Generation
  GEMINI_API_KEY_1: z.string().optional(),
  GEMINI_API_KEY: z.string().default('your_gemini_api_key_placeholder'), // Legacy alias for Key 1
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),

  // Key 2: Gemini Image Generation
  GEMINI_API_KEY_2: z.string().optional(),
  GEMINI_IMAGE_MODEL: z.string().default('gemini-3.1-flash-image'),

  // NVIDIA Nemotron 3 Ultra: Additional Chat Model
  NVIDIA_NEMOTRON_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(), // Legacy alias for Nemotron
  NVIDIA_NEMOTRON_MODEL: z.string().default('nvidia/nemotron-3-ultra-550b-a55b'),

  // Fallback options
  ALLOW_IMAGE_FALLBACK: z.coerce.boolean().default(true),

  AI_TIMEOUT_MS: z.coerce.number().default(180000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

/**
 * Returns Gemini Key 1 exclusively for Text Chat generation.
 * NEVER returns Key 2.
 */
export function getGeminiChatKey() {
  const key = process.env.GEMINI_API_KEY_1 || env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (!key || key.includes('placeholder')) return '';
  return key.trim();
}

/**
 * Returns Gemini Key 2 exclusively for AI Image Generation.
 * NEVER returns Key 1.
 */
export function getGeminiImageKey() {
  const key = process.env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_2;
  if (!key || key.includes('placeholder')) return '';
  return key.trim();
}

/**
 * Returns NVIDIA Nemotron 3 Ultra API Key exclusively for Nemotron Chat.
 */
export function getNemotronApiKey() {
  const key = process.env.NVIDIA_NEMOTRON_API_KEY || env.NVIDIA_NEMOTRON_API_KEY || process.env.NVIDIA_API_KEY || env.NVIDIA_API_KEY;
  if (!key || key.includes('placeholder')) return '';
  return key.trim();
}

/**
 * Backward compatibility: returns valid Gemini Chat keys for legacy helper calls.
 */
export function getGeminiApiKeys() {
  const chatKey = getGeminiChatKey();
  return chatKey ? [chatKey] : [];
}
