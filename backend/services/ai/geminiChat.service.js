import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, getGeminiChatKey } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

/**
 * GeminiChatService: Dedicated exclusively to text chat conversations.
 * Strict Rule: Uses ONLY Gemini API Key 1. Never uses Key 2 (which is reserved for images).
 */
export class GeminiChatService {
  /**
   * Generates a conversational chat reply using Google Gemini.
   *
   * @param {Object} params
   * @param {Array} params.contents - Bounded conversation history [{ role: 'user'|'model', parts }]
   * @param {string} params.systemInstruction - Pre-built system instructions and contextual memory
   * @returns {Promise<Object>} Formatted AI reply
   */
  static async generateReply({ contents = [], systemInstruction = '' }) {
    const apiKey = getGeminiChatKey();
    if (!apiKey) {
      throw new ApiError(
        500,
        'GEMINI_KEY_MISSING',
        'Gemini Chat API key (Key 1) is not configured in backend environment.',
        null,
        false
      );
    }

    const candidateModels = [
      env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-3-flash-preview',
    ];

    const ai = new GoogleGenerativeAI(apiKey);
    const startTime = Date.now();
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const modelConfig = {
          model: modelName,
        };
        if (systemInstruction) {
          modelConfig.systemInstruction = systemInstruction;
        }

        const model = ai.getGenerativeModel(modelConfig, {
          timeout: env.AI_TIMEOUT_MS || 60000,
        });

        // Ensure contents contain valid structure
        const sanitizedContents = contents.map((c) => ({
          role: c.role === 'assistant' ? 'model' : c.role || 'user',
          parts: Array.isArray(c.parts) ? c.parts : [{ text: String(c.parts || '') }],
        }));

        const result = await model.generateContent({ contents: sanitizedContents });
        const latencyMs = Date.now() - startTime;
        const response = result.response;

        if (!response) {
          throw new ApiError(502, 'AI_EMPTY_RESPONSE', 'Gemini returned an empty response.', null, true);
        }

        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason || 'STOP';

        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
          throw new ApiError(
            422,
            'AI_BLOCKED',
            "I can't help with that request due to content safety policies. Please try asking differently.",
            null,
            false
          );
        }

        const text = response.text() || '';
        if (!text.trim()) {
          throw new ApiError(502, 'AI_EMPTY_RESPONSE', 'Gemini returned empty text output.', null, true);
        }

        const usage = response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount || 0,
              completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            }
          : { promptTokens: 0, completionTokens: 0 };

        logger.info(`[GeminiChatService] Generated response in ${latencyMs}ms using model ${modelName}`);

        return {
          provider: 'gemini',
          model: modelName,
          text,
          finishReason,
          usage,
          latencyMs,
        };
      } catch (err) {
        lastError = err;

        if (err instanceof ApiError && !err.isTransient) {
          throw err;
        }

        const status = err?.status || err?.statusCode;
        const isQuota = status === 429 || err?.message?.includes('429') || err?.message?.toLowerCase().includes('quota');

        if (isQuota) {
          logger.warn(`[GeminiChatService] Model ${modelName} quota exceeded. Attempting next candidate...`, {
            error: err.message,
          });
          continue;
        }

        logger.warn(`[GeminiChatService] Model ${modelName} error: ${err.message}. Trying next candidate...`);
      }
    }

    const errStatus = lastError?.status || lastError?.statusCode;
    if (errStatus === 429 || lastError?.message?.includes('429')) {
      throw new ApiError(
        429,
        'AI_RATE_LIMITED',
        'Google Gemini is currently busy or rate-limited. Please retry in a moment.',
        null,
        true
      );
    }

    throw new ApiError(
      502,
      'AI_PROVIDER_ERROR',
      `Gemini Chat failed: ${lastError?.message || 'Unknown error'}. Please try again.`,
      null,
      true
    );
  }
}

