import { buildSystemPrompt } from '../config/systemPrompt.js';
import { callGemini } from './providers/gemini.provider.js';

/**
 * Provider-neutral AI service facade per spec §18.6
 */
export async function generateReply({
  contents,
  replyLanguage = 'auto',
  memoryContext = '',
  recentConversationsContext = '',
}) {
  const systemInstruction = buildSystemPrompt(replyLanguage, {
    memoryContext,
    recentConversationsContext,
  });
  return await callGemini({ contents, systemInstruction });
}
