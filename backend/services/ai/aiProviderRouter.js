import { GeminiChatService } from './geminiChat.service.js';
import { NemotronChatService } from './nemotronChat.service.js';
import { GeminiImageService } from './geminiImage.service.js';
import { getGeminiChatKey, getNemotronApiKey, getGeminiImageKey, env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

/**
 * AIProviderRouter: Central decision router for multi-provider AI operations.
 * Enforces strict provider boundaries and routes requests according to selected model and feature.
 */
export class AIProviderRouter {
  /**
   * Routes a chat request to the requested conversational AI provider.
   *
   * @param {Object} params
   * @param {string} params.model - 'gemini' | 'nemotron'
   * @param {Array} params.contents - Bounded dialogue history
   * @param {string} params.systemInstruction - System instruction
   * @returns {Promise<Object>} Provider response
   */
  static async routeChat({ model = 'gemini', contents = [], systemInstruction = '' }) {
    const selected = (model || 'gemini').toLowerCase().trim();

    if (selected === 'nemotron') {
      const nvKey = getNemotronApiKey();
      if (!nvKey) {
        throw new ApiError(
          400,
          'MODEL_UNAVAILABLE',
          'NVIDIA Nemotron 3 Ultra is not available because the API key is not configured. Please select Google Gemini.',
          null,
          false
        );
      }
      logger.info('[AIProviderRouter] Routing chat to NemotronChatService');
      return await NemotronChatService.generateReply({ contents, systemInstruction });
    }

    // Default to Gemini Chat
    const geminiKey = getGeminiChatKey();
    if (!geminiKey) {
      throw new ApiError(
        400,
        'MODEL_UNAVAILABLE',
        'Google Gemini Chat is not available because Gemini API Key 1 is not configured.',
        null,
        false
      );
    }
    logger.info('[AIProviderRouter] Routing chat to GeminiChatService');
    return await GeminiChatService.generateReply({ contents, systemInstruction });
  }

  /**
   * Routes an image generation request exclusively to GeminiImageService.
   *
   * @param {Object} params
   * @param {string} params.prompt - Image description
   * @param {string} params.style - Art style
   * @param {string} params.aspectRatio - '1:1', '16:9', '9:16'
   * @param {string} params.userId - Requesting user ID
   * @returns {Promise<Object>} Image generation result
   */
  static async routeImage({ prompt, style, aspectRatio, userId }) {
    const imageKey = getGeminiImageKey();
    if (!imageKey) {
      throw new ApiError(
        500,
        'IMAGE_PROVIDER_UNAVAILABLE',
        'Gemini Image Generation (Key 2) is not configured in backend environment.',
        null,
        false
      );
    }

    logger.info('[AIProviderRouter] Routing image request to GeminiImageService (Key 2 exclusively)');
    return await GeminiImageService.generateImage({ prompt, style, aspectRatio, userId });
  }

  /**
   * Returns list of configured chat models and their statuses.
   */
  static getModelStatus() {
    return {
      chatModels: [
        {
          id: 'gemini',
          name: 'Google Gemini',
          version: env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
          description: 'Fast, intelligent conversational assistant & coding specialist',
          isDefault: true,
          available: Boolean(getGeminiChatKey()),
        },
        {
          id: 'nemotron',
          name: 'NVIDIA Nemotron 3 Ultra',
          version: env.NVIDIA_NEMOTRON_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b',
          description: 'Flagship 550B reasoning model by NVIDIA for complex problem-solving',
          isDefault: false,
          available: Boolean(getNemotronApiKey()),
        },
      ],
      imageProvider: {
        id: 'gemini-image',
        name: 'Google Gemini Image Studio',
        model: env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
        available: Boolean(getGeminiImageKey()),
      },
    };
  }
}

