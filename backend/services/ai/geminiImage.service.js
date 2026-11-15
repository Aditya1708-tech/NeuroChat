import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { env, getGeminiImageKey } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/generated_images');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * GeminiImageService: Dedicated exclusively to AI Image Generation using Gemini API Key 2.
 * Strict Rule: Never uses Gemini Key 1 or Nemotron for image generation.
 */
export class GeminiImageService {
  /**
   * Enhances a user prompt with artistic style directives.
   */
  static enhancePrompt(prompt, style = 'realistic') {
    const clean = (prompt || '').trim();
    const styleModifiers = {
      realistic: 'photorealistic, ultra high definition 8k photography, natural studio lighting, rich texture, sharp focus',
      cinematic: 'cinematic lighting, 35mm film still, dramatic composition, anamorphic lens flare, color graded, photorealism',
      digital_art: 'vibrant digital art, high detail illustration, concept art, trending on ArtStation, dynamic lighting',
      fantasy: 'epic fantasy illustration, mystical magical atmosphere, ethereal volumetric lighting, intricate details',
      anime: 'modern anime aesthetic, Makoto Shinkai style, vibrant colors, beautiful lighting, clean line art',
      cyberpunk: 'cyberpunk aesthetic, glowing neon lights, holographic reflections, moody atmospheric volumetric smoke',
      minimalist: 'minimalist clean aesthetic, elegant composition, high contrast, studio backdrop, fine art',
    };

    const modifier = styleModifiers[style] || styleModifiers.realistic;
    return `${clean}. ${modifier}`;
  }

  /**
   * Generates an image using Google Gemini (Key 2).
   *
   * @param {Object} params
   * @param {string} params.prompt - User image description
   * @param {string} params.style - Art style preset
   * @param {string} params.aspectRatio - '1:1', '16:9', '9:16'
   * @param {string} params.userId - Authenticated user ID
   * @returns {Promise<Object>} Image metadata and accessible URL
   */
  static async generateImage({ prompt, style = 'realistic', aspectRatio = '1:1', userId }) {
    if (!prompt || !prompt.trim()) {
      throw new ApiError(400, 'PROMPT_REQUIRED', 'Please provide a prompt describing the image to generate.');
    }

    const apiKey = getGeminiImageKey();
    if (!apiKey) {
      throw new ApiError(
        500,
        'GEMINI_IMAGE_KEY_MISSING',
        'Gemini Image Generation API Key (Key 2) is not configured in backend environment.',
        null,
        false
      );
    }

    const enhancedPrompt = this.enhancePrompt(prompt, style);
    const candidateModels = [
      env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
      'gemini-2.5-flash-image',
    ];

    let imageBuffer = null;
    let mimeType = 'image/png';
    let format = 'png';
    let modelUsed = candidateModels[0];
    let billingNotice = null;
    const startTime = Date.now();

    // 1. Attempt direct Gemini Image Generation with Key 2
    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        logger.info(`[GeminiImageService] Requesting image generation from ${modelName} with Key 2...`);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: enhancedPrompt }],
              },
            ],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          const imagePart = parts.find((p) => p.inlineData && p.inlineData.data);

          if (imagePart) {
            mimeType = imagePart.inlineData.mimeType || 'image/png';
            format = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
            imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
            modelUsed = modelName;
            logger.info(`[GeminiImageService] Successfully generated image via ${modelName} in ${Date.now() - startTime}ms`);
            break;
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          const errMsg = errorData?.error?.message || res.statusText;
          const isQuotaFreeTier =
            res.status === 429 &&
            (errMsg.includes('free_tier') || errMsg.includes('Free Tier') || errMsg.includes('limit: 0'));

          if (isQuotaFreeTier) {
            logger.warn(
              `[GeminiImageService] Google Gemini Key 2 is on Free Tier (limit 0 for image models). Billing account required on Google AI Studio: ${errMsg}`
            );
            billingNotice =
              'Google Gemini image models (gemini-3.1-flash-image) require Pay-as-you-go billing enabled in Google AI Studio.';
          } else {
            logger.warn(`[GeminiImageService] Model ${modelName} returned status ${res.status}: ${errMsg}`);
          }
        }
      } catch (err) {
        logger.warn(`[GeminiImageService] Call to ${modelName} failed: ${err.message}`);
      }
    }

    // 2. If Gemini Image quota/billing is not enabled and fallback is allowed:
    if (!imageBuffer) {
      if (env.ALLOW_IMAGE_FALLBACK) {
        logger.info('[GeminiImageService] Utilizing high-resolution creative fallback engine...');
        try {
          let width = 1024;
          let height = 1024;
          if (aspectRatio === '16:9') {
            width = 1280;
            height = 720;
          } else if (aspectRatio === '9:16') {
            width = 720;
            height = 1280;
          }

          // Use clean prompt without problematic query parameters for reliable fallback
          const cleanPrompt = (prompt || enhancedPrompt).slice(0, 300).trim();
          const encoded = encodeURIComponent(cleanPrompt);
          const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}`;

          const fbRes = await fetch(fallbackUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
          });

          if (!fbRes.ok) {
            throw new Error(`Fallback engine HTTP ${fbRes.status}: ${fbRes.statusText}`);
          }

          const ab = await fbRes.arrayBuffer();
          imageBuffer = Buffer.from(ab);
          mimeType = 'image/jpeg';
          format = 'jpg';
          modelUsed = 'creative-image-engine';
        } catch (fbErr) {
          throw new ApiError(
            502,
            'IMAGE_GENERATION_FAILED',
            `Image generation failed: ${fbErr.message}. ${billingNotice || ''}`.trim(),
            null,
            true
          );
        }
      } else {
        throw new ApiError(
          402,
          'GEMINI_BILLING_REQUIRED',
          billingNotice ||
            'Gemini image generation models require a Google Cloud / AI Studio project with pay-as-you-go billing enabled.',
          null,
          false
        );
      }
    }

    // 3. Save binary image file to local storage (never large base64 in MongoDB)
    const imageId = crypto.randomBytes(16).toString('hex');
    const filename = `${imageId}.${format}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(filePath, imageBuffer);

    const relativeUrl = `/api/images/raw/${imageId}`;
    const size = imageBuffer.byteLength;
    const latencyMs = Date.now() - startTime;

    return {
      imageId,
      filename,
      filePath,
      url: relativeUrl,
      prompt: prompt.trim(),
      enhancedPrompt,
      model: modelUsed,
      style,
      aspectRatio,
      mimeType,
      format,
      size,
      latencyMs,
      billingNotice,
    };
  }

  /**
   * Reads an image file from storage by ID.
   */
  static async getImageFile(imageId) {
    if (!imageId || !/^[a-f0-9]{32}$/i.test(imageId)) {
      throw new ApiError(400, 'INVALID_IMAGE_ID', 'Invalid image ID format.');
    }

    const pngPath = path.join(UPLOADS_DIR, `${imageId}.png`);
    const jpgPath = path.join(UPLOADS_DIR, `${imageId}.jpg`);

    if (fs.existsSync(pngPath)) {
      return { filePath: pngPath, mimeType: 'image/png' };
    }
    if (fs.existsSync(jpgPath)) {
      return { filePath: jpgPath, mimeType: 'image/jpeg' };
    }

    throw new ApiError(404, 'IMAGE_NOT_FOUND', 'The requested image was not found.');
  }
}
