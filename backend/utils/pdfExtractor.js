import { PDFParse } from 'pdf-parse';
import { logger } from './logger.js';

/**
 * Extracts complete text, page count, and metadata from a PDF buffer or base64 string.
 *
 * @param {Buffer|string} input - PDF buffer or base64 data string
 * @param {Object} options - Options
 * @param {string} options.fileName - Original file name for logging
 * @returns {Promise<{
 *   success: boolean,
 *   pageCount: number,
 *   text: string,
 *   pages: Array<{ pageNumber: number, text: string }>,
 *   error?: string
 * }>}
 */
export async function extractPdfContent(input, options = {}) {
  const { fileName = 'document.pdf' } = options;

  try {
    let buffer;
    if (Buffer.isBuffer(input)) {
      buffer = input;
    } else if (typeof input === 'string') {
      const commaIdx = input.indexOf(',');
      const base64Str = commaIdx !== -1 ? input.slice(commaIdx + 1) : input;
      buffer = Buffer.from(base64Str, 'base64');
    } else {
      throw new TypeError('Invalid PDF input: expected Buffer or base64 string');
    }

    const parser = new PDFParse({ data: buffer });
    await parser.load();

    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    const pageCount = textResult.total || infoResult?.total || 1;
    const pages = (textResult.pages || []).map((p, idx) => ({
      pageNumber: p.num || idx + 1,
      text: (p.text || '').trim(),
    }));

    const formattedText = pages
      .map((p) => `=== PAGE ${p.pageNumber} OF ${pageCount} ===\n${p.text}`)
      .join('\n\n');

    logger.info(`Successfully parsed PDF "${fileName}": ${pageCount} pages, ${buffer.length} bytes`);

    return {
      success: true,
      pageCount,
      text: formattedText || textResult.text || '',
      pages,
    };
  } catch (error) {
    logger.warn(`Failed to parse PDF "${fileName}" with pdf-parse: ${error.message}`);
    return {
      success: false,
      pageCount: 0,
      text: '',
      pages: [],
      error: error.message,
    };
  }
}

