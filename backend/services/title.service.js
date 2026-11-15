import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, getGeminiApiKeys } from '../config/env.js';
import { logger } from '../utils/logger.js';

let titlePool = [];

function getTitleClient() {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return null;
  if (titlePool.length !== keys.length) {
    titlePool = keys.map((key) => new GoogleGenerativeAI(key));
  }
  return titlePool[Math.floor(Math.random() * titlePool.length)];
}

/**
 * Generates an automated, intelligent conversation title from the first user prompt.
 * Uses Gemini to extract a 2-5 word concise topic title, with resilient heuristic fallback.
 *
 * @param {string} text - First user message content
 * @returns {Promise<string>} Concise title (e.g., "SSC CGL Syllabus")
 */
export async function generateConversationTitle(text) {
  if (!text || typeof text !== 'string') return 'New chat';

  // 1. Try NVIDIA Nemotron-3 Ultra first for instant intelligent titles
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b',
          messages: [
            {
              role: 'system',
              content:
                'Summarize the core topic of the user message into a short, clear title of 2 to 5 words maximum for a chat sidebar. Do not use quotes, punctuation, prefixes, or filler words. Return ONLY the title.',
            },
            { role: 'user', content: text.slice(0, 300) },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        let title = data.choices?.[0]?.message?.content || '';
        title = title.replace(/["'*`_#.\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (title.length > 0 && title.length <= 60) {
          return title;
        }
      }
    } catch (nvErr) {
      logger.warn('Nemotron title generation failed, falling back to Gemini:', { error: nvErr?.message });
    }
  }

  const client = getTitleClient();
  if (client) {
    try {
      const model = client.getGenerativeModel(
        { model: env.GEMINI_MODEL || 'gemini-3.5-flash-lite' },
        { timeout: 15000 }
      );
      const prompt = `Summarize the core topic of this user message into a short, clear title of 2 to 5 words maximum for a chat sidebar. Do not use quotes, punctuation, prefixes, or conversational filler words. Return ONLY the title.\n\nUser message: ${text.slice(0, 300)}`;

      const res = await model.generateContent(prompt);
      let title = (await res.response.text()) || '';
      title = title.replace(/["'*`_#.\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();

      if (title.length > 0 && title.length <= 60) {
        return title;
      }
    } catch (err) {
      logger.warn('AI title generation failed, falling back to smart heuristic', { error: err.message });
    }
  }

  return fallbackTitle(text);
}

export function fallbackTitle(text) {
  // Strip common greetings and conversational filler
  let cleaned = text
    .replace(/^(hi|hello|hey|hii|please|can you|could you|tell me|i want to know about|help me with|explain to me)\s+/gi, '')
    .replace(/[#*`>_~[\]()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'New chat';

  const chars = Array.from(cleaned);
  if (chars.length > 35) {
    return chars.slice(0, 35).join('').trim() + '…';
  }
  return cleaned;
}
