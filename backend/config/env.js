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
  GEMINI_API_KEY: z.string().default('your_gemini_api_key_placeholder'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  AI_TIMEOUT_MS: z.coerce.number().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
