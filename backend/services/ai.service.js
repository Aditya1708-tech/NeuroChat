import { buildSystemPrompt } from '../config/systemPrompt.js';
import { AIProviderRouter } from './ai/aiProviderRouter.js';

/**
 * Provider-neutral AI service facade
 * Enforces explicit provider routing between Gemini Chat (Key 1) and Nemotron (NVIDIA Key).
 */
export async function generateReply({
  contents,
  replyLanguage = 'auto',
  memoryContext = '',
  recentConversationsContext = '',
  model = 'gemini',
}) {
  const systemInstruction = buildSystemPrompt(replyLanguage, {
    memoryContext,
    recentConversationsContext,
  });

  return await AIProviderRouter.routeChat({
    model,
    contents,
    systemInstruction,
  });
}
