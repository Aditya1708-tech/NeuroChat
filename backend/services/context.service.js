import { aiConfig } from '../config/ai.js';

/**
 * Builds the bounded conversation context window for Gemini per §19.3.
 *
 * @param {Array} history - Chronological array of previous messages ({ role, content })
 * @param {Object} newUserMessage - The newly added user message ({ role: 'user', content: string })
 * @returns {{ contents: Array, truncated: boolean }}
 */
export function buildConversationContext(history = [], newUserMessage) {
  const candidates = [...history, newUserMessage];
  const selected = [];
  let totalChars = 0;
  let count = 0;
  let hitBudgetLimit = false;

  // Step 2 & 3: Walk from newest to oldest within limits
  for (let i = candidates.length - 1; i >= 0; i--) {
    const msg = candidates[i];
    const msgLen = (msg.content || '').length;

    if (
      count + 1 <= aiConfig.maxContextMessages &&
      totalChars + msgLen <= aiConfig.maxContextChars
    ) {
      selected.push(msg);
      totalChars += msgLen;
      count++;
    } else {
      hitBudgetLimit = true;
      break; // Stop at first overflow to preserve contiguous dialogue
    }
  }

  // Step 4: Reverse to chronological order
  selected.reverse();

  // Step 5: If first item is an assistant message, drop it
  while (selected.length > 0 && selected[0].role === 'assistant') {
    selected.shift();
  }

  // Step 6: Merge adjacent text-only messages with same role
  const merged = [];
  for (const msg of selected) {
    if (
      merged.length > 0 &&
      merged[merged.length - 1].role === msg.role &&
      !msg.attachment &&
      !merged[merged.length - 1].attachment
    ) {
      merged[merged.length - 1].content += '\n\n' + (msg.content || '');
    } else {
      merged.push({
        role: msg.role,
        content: msg.content || '',
        attachment: msg.attachment,
      });
    }
  }

  // Step 7: Map roles for Gemini API (user -> "user", assistant -> "model")
  const contents = merged.map((m) => {
    const parts = [];

    // If message includes an attachment, format it as inlineData
    if (m.attachment && m.attachment.dataUrl) {
      const commaIdx = m.attachment.dataUrl.indexOf(',');
      const base64Data = commaIdx !== -1 ? m.attachment.dataUrl.slice(commaIdx + 1) : m.attachment.dataUrl;
      const mimeType = m.attachment.mimeType || 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    if (m.content && m.content.trim()) {
      parts.push({ text: m.content.trim() });
    } else if (parts.length > 0) {
      // Default prompt if user only sent an attachment without text
      parts.push({ text: 'Please analyze this file or image and describe its key information in detail.' });
    }

    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });

  // Step 8: Set truncated flag
  const truncated = hitBudgetLimit || candidates.length > selected.length;

  return { contents, truncated };
}
