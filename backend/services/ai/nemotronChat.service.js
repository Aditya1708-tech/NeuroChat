import { env, getNemotronApiKey } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

/**
 * NemotronChatService: Dedicated to NVIDIA Nemotron 3 Ultra chat and complex reasoning.
 * Strict Rule: Never accepts or processes image-generation requests.
 */
export class NemotronChatService {
  /**
   * Generates a conversational chat reply using NVIDIA Nemotron 3 Ultra.
   *
   * @param {Object} params
   * @param {Array} params.contents - Bounded conversation history [{ role: 'user'|'model', parts }]
   * @param {string} params.systemInstruction - System instruction string
   * @returns {Promise<Object>} Formatted AI reply
   */
  static async generateReply({ contents = [], systemInstruction = '' }) {
    const apiKey = getNemotronApiKey();
    if (!apiKey) {
      throw new ApiError(
        500,
        'NEMOTRON_KEY_MISSING',
        'NVIDIA Nemotron API key is not configured in backend environment.',
        null,
        false
      );
    }

    // Convert Gemini multi-turn contents format into OpenAI/NVIDIA messages format
    const messages = [];
    if (systemInstruction && systemInstruction.trim()) {
      messages.push({ role: 'system', content: systemInstruction.trim() });
    }

    for (const item of contents) {
      const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
      let textContent = '';

      if (Array.isArray(item.parts)) {
        textContent = item.parts
          .map((p) => {
            if (typeof p === 'string') return p;
            if (p?.text) return p.text;
            if (p?.inlineData) return `[Attached File/Image: ${p.inlineData.mimeType}]`;
            return '';
          })
          .filter(Boolean)
          .join('\n');
      } else if (typeof item.parts === 'string') {
        textContent = item.parts;
      }

      if (textContent.trim()) {
        messages.push({ role, content: textContent.trim() });
      }
    }

    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system')) {
      messages.push({ role: 'user', content: 'Hello' });
    }

    const model = env.NVIDIA_NEMOTRON_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b';
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutMs = env.AI_TIMEOUT_MS || 90000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          top_p: 0.95,
          max_tokens: 8192,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        const status = res.status;
        logger.error(`[NemotronChatService] NVIDIA NIM returned HTTP ${status}: ${errText.slice(0, 200)}`);

        if (status === 401 || status === 403) {
          throw new ApiError(
            502,
            'NEMOTRON_AUTH_ERROR',
            'NVIDIA Nemotron authentication failed. Please check your NVIDIA API key.',
            null,
            false
          );
        }

        if (status === 429) {
          throw new ApiError(
            429,
            'NEMOTRON_RATE_LIMITED',
            'NVIDIA Nemotron is currently rate-limited. Please retry shortly.',
            null,
            true
          );
        }

        throw new ApiError(
          502,
          'NEMOTRON_ERROR',
          `NVIDIA Nemotron error (${status}): ${errText.slice(0, 150)}`,
          null,
          true
        );
      }

      const data = await res.json();
      const messageObj = data.choices?.[0]?.message;
      const text = messageObj?.content || messageObj?.reasoning_content || '';

      if (!text.trim()) {
        throw new ApiError(502, 'AI_EMPTY_RESPONSE', 'NVIDIA Nemotron returned an empty response.', null, true);
      }

      const latencyMs = Date.now() - startTime;
      logger.info(`[NemotronChatService] Generated response in ${latencyMs}ms using ${model}`);

      return {
        provider: 'nemotron',
        model,
        text,
        finishReason: data.choices?.[0]?.finish_reason || 'STOP',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
        },
        latencyMs,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError(
          504,
          'NEMOTRON_TIMEOUT',
          `NVIDIA Nemotron request timed out after ${Math.round(timeoutMs / 1000)}s. Please try again with a shorter prompt.`,
          null,
          true
        );
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        502,
        'NEMOTRON_NETWORK_ERROR',
        `Failed to reach NVIDIA Nemotron API: ${err.message}`,
        null,
        true
      );
    }
  }
}

