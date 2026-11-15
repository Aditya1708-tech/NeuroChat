import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * NVIDIA NIM Provider: Nemotron-3 Ultra 550B
 * Fast, massive context, and ultra-high-grade reasoning for long documents and code.
 */
export async function callNemotron({ contents = [], systemInstruction = '' }) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || !apiKey.startsWith('nvapi-')) {
    throw new Error('NVIDIA_API_KEY is missing or invalid.');
  }

  // Convert Gemini format to OpenAI/NVIDIA message format
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  for (const item of contents) {
    const role = item.role === 'model' ? 'assistant' : 'user';
    let textContent = '';
    if (Array.isArray(item.parts)) {
      textContent = item.parts.map((p) => (typeof p === 'string' ? p : p.text || '')).join('\n');
    } else if (typeof item.parts === 'string') {
      textContent = item.parts;
    }
    if (textContent.trim()) {
      messages.push({ role, content: textContent });
    }
  }

  const startTime = Date.now();
  const candidateModels = [
    'nvidia/nemotron-3-ultra-550b-a55b',
    'nvidia/nemotron-3.5-lightning-30b-a3b',
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

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
        throw new Error(`NVIDIA NIM HTTP ${res.status}: ${errText.slice(0, 150)}`);
      }

      const data = await res.json();
      const messageObj = data.choices?.[0]?.message;
      const text = messageObj?.content || messageObj?.reasoning_content || '';
      if (!text.trim()) {
        throw new Error('NVIDIA NIM returned empty response');
      }

      const latencyMs = Date.now() - startTime;
      logger.info(`NVIDIA Nemotron (${model}) generated response in ${latencyMs}ms`);

      return {
        text,
        finishReason: data.choices?.[0]?.finish_reason || 'STOP',
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
        },
        latencyMs,
        keyMasked: apiKey.slice(0, 10) + '...',
      };
    } catch (err) {
      lastError = err;
      logger.warn(`Nemotron model ${model} failed, trying next candidate:`, { error: err?.message });
    }
  }

  throw lastError || new Error('All Nemotron models failed');
}
