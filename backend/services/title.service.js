import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let titleAI = null;

function getTitleClient() {
  if (!titleAI && env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('placeholder')) {
    titleAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return titleAI;
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

  const client = getTitleClient();
  if (client) {
    try {
      const model = client.getGenerativeModel(
        { model: env.GEMINI_MODEL || 'gemini-3.6-flash' },
        { timeout: 8000 }
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

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
