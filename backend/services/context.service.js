import { aiConfig } from '../config/ai.js';
import { isTextOrCodeFile, getExtension } from '../utils/artifactParser.js';
import { extractPdfContent } from '../utils/pdfExtractor.js';

/**
 * Builds the bounded conversation context window for Gemini per §19.3.
 *
 * @param {Array} history - Chronological array of previous messages ({ role, content })
 * @param {Object} newUserMessage - The newly added user message ({ role: 'user', content: string })
 * @returns {Promise<{ contents: Array, truncated: boolean }>}
 */
export async function buildConversationContext(history = [], newUserMessage) {
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
  const contents = await Promise.all(
    merged.map(async (m) => {
      const parts = [];

      // If message includes an attachment, format it appropriately
      if (m.attachment && m.attachment.dataUrl) {
        const commaIdx = m.attachment.dataUrl.indexOf(',');
        const base64Data = commaIdx !== -1 ? m.attachment.dataUrl.slice(commaIdx + 1) : m.attachment.dataUrl;
        const mimeType = m.attachment.mimeType || 'application/octet-stream';
        const fileName = m.attachment.name || 'document.txt';

        if (isTextOrCodeFile(fileName, mimeType)) {
          try {
            const decodedText = Buffer.from(base64Data, 'base64').toString('utf8');
            const ext = getExtension(fileName) || 'text';
            parts.push({
              text: `\n\n--- ATTACHED FILE: ${fileName} (${mimeType}) ---\n\`\`\`${ext}\n${decodedText}\n\`\`\`\n--- END OF ATTACHED FILE ---\n`,
            });
          } catch {
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        } else if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
          try {
            const pdfData = await extractPdfContent(base64Data, { fileName });
            if (pdfData.success && pdfData.text) {
              parts.push({
                text: `\n\n--- ATTACHED PDF DOCUMENT: ${fileName} (Total Pages: ${pdfData.pageCount}) ---\n[The user has attached a ${pdfData.pageCount}-page PDF document. Below is the full extracted text from all ${pdfData.pageCount} pages]:\n\n${pdfData.text}\n\n--- END OF ATTACHED PDF DOCUMENT ---\n`,
              });
            }
          } catch {
            // Fall back to inlineData if parsing fails
          }
          // Also provide inlineData so Gemini can inspect layout and imagery
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data,
            },
          });
        } else {
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }

      if (m.content && m.content.trim()) {
        parts.push({ text: m.content.trim() });
      } else if (parts.length > 0) {
        // Default prompt if user only sent an attachment without text
        parts.push({ text: 'Please analyze this file or document in detail.' });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    })
  );

  // Step 8: Set truncated flag
  const truncated = hitBudgetLimit || candidates.length > selected.length;

  return { contents, truncated };
}
