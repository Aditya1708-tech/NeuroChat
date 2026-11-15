/**
 * Utility functions for parsing, formatting, and handling artifacts and documents.
 */

export const FORMAT_MIME_MAP = {
  js: 'text/javascript',
  jsx: 'text/javascript',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  py: 'text/x-python',
  html: 'text/html',
  css: 'text/css',
  json: 'application/json',
  csv: 'text/csv',
  md: 'text/markdown',
  markdown: 'text/markdown',
  txt: 'text/plain',
  text: 'text/plain',
  xml: 'application/xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  sql: 'text/x-sql',
  sh: 'application/x-sh',
  java: 'text/x-java-source',
  cpp: 'text/x-c',
  c: 'text/x-c',
  svg: 'image/svg+xml',
};

export const EXTENSION_FORMAT_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  csv: 'csv',
  md: 'markdown',
  markdown: 'markdown',
  txt: 'text',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  sql: 'sql',
  sh: 'bash',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  svg: 'svg',
};

/**
 * Get file extension from filename.
 */
export function getExtension(filename = '') {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Get MIME type for a given filename or format.
 */
export function getMimeType(filenameOrFormat = '') {
  const ext = getExtension(filenameOrFormat) || filenameOrFormat.toLowerCase();
  return FORMAT_MIME_MAP[ext] || 'text/plain';
}

/**
 * Check if a file is text/code based (safe to decode to utf-8 string).
 */
export function isTextOrCodeFile(name = '', mimeType = '') {
  if (mimeType.startsWith('text/')) return true;
  if (
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/x-yaml'
  ) {
    return true;
  }
  const ext = getExtension(name);
  return Boolean(EXTENSION_FORMAT_MAP[ext]);
}

/**
 * Detects if the user requested a specific target format in their prompt/instructions.
 * If found, returns { targetFormat, extension, mimeType }.
 * If none specified, returns null (meaning keep original format).
 */
export function detectRequestedFormat(instructions = '') {
  const text = (instructions || '').toLowerCase();

  const formatKeywords = [
    { format: 'json', ext: 'json', regex: /\b(to|as|in|into|format:?)\s*(json)\b/i },
    { format: 'csv', ext: 'csv', regex: /\b(to|as|in|into|format:?)\s*(csv)\b/i },
    { format: 'markdown', ext: 'md', regex: /\b(to|as|in|into|format:?)\s*(markdown|md)\b/i },
    { format: 'python', ext: 'py', regex: /\b(to|as|in|into|format:?)\s*(python|py)\b/i },
    { format: 'javascript', ext: 'js', regex: /\b(to|as|in|into|format:?)\s*(javascript|js)\b/i },
    { format: 'typescript', ext: 'ts', regex: /\b(to|as|in|into|format:?)\s*(typescript|ts)\b/i },
    { format: 'html', ext: 'html', regex: /\b(to|as|in|into|format:?)\s*(html)\b/i },
    { format: 'text', ext: 'txt', regex: /\b(to|as|in|into|format:?)\s*(plain\s*text|txt|text)\b/i },
    { format: 'yaml', ext: 'yaml', regex: /\b(to|as|in|into|format:?)\s*(yaml|yml)\b/i },
    { format: 'sql', ext: 'sql', regex: /\b(to|as|in|into|format:?)\s*(sql)\b/i },
  ];

  for (const item of formatKeywords) {
    if (item.regex.test(text)) {
      return {
        targetFormat: item.format,
        extension: item.ext,
        mimeType: FORMAT_MIME_MAP[item.ext] || 'text/plain',
      };
    }
  }

  return null;
}

/**
 * Determine the final filename and format for an edited document.
 * If targetFormat is requested, update the file extension accordingly.
 * Otherwise, preserve the original filename, extension, and format!
 */
export function resolveArtifactNaming({ originalFileName, instructions, targetFormat }) {
  const requested = targetFormat
    ? {
        targetFormat,
        extension: targetFormat.toLowerCase(),
        mimeType: FORMAT_MIME_MAP[targetFormat.toLowerCase()] || 'text/plain',
      }
    : detectRequestedFormat(instructions);

  const originalExt = getExtension(originalFileName);
  const baseName = originalFileName
    ? originalFileName.replace(/\.[^/.]+$/, '')
    : 'document';

  if (requested) {
    const newFilename = `${baseName}.${requested.extension}`;
    return {
      filename: newFilename,
      format: requested.targetFormat,
      mimeType: requested.mimeType,
      isConverted: originalExt !== requested.extension,
    };
  }

  // Preserve original format and extension
  const safeExt = originalExt || 'txt';
  const format = EXTENSION_FORMAT_MAP[safeExt] || 'text';
  const mimeType = FORMAT_MIME_MAP[safeExt] || 'text/plain';

  return {
    filename: originalFileName || `document.${safeExt}`,
    format,
    mimeType,
    isConverted: false,
  };
}

/**
 * Parses <neuro_artifact> tags from AI output text.
 * Returns clean conversational markdown and an array of extracted artifacts.
 */
export function parseArtifacts(aiOutput = '', defaultContext = {}) {
  if (!aiOutput || typeof aiOutput !== 'string') {
    return { cleanText: '', artifacts: [] };
  }

  const artifacts = [];
  const artifactRegex = /<neuro_artifact\s+([^>]*?)>([\s\S]*?)<\/neuro_artifact>/gi;

  let cleanText = aiOutput.replace(artifactRegex, (match, attributesStr, content) => {
    // Extract attributes
    const getAttr = (name) => {
      const regex = new RegExp(`${name}=["']([^"']+)["']`, 'i');
      const attrMatch = regex.exec(attributesStr);
      return attrMatch ? attrMatch[1] : '';
    };

    const identifier = getAttr('identifier') || 'art_' + Date.now().toString(36);
    let title = getAttr('title') || 'Generated Artifact';
    let filename = getAttr('filename') || defaultContext.defaultFileName || 'document.txt';
    let type = getAttr('type') || 'code';
    let format = getAttr('format') || getExtension(filename) || 'text';

    // Normalize format
    format = EXTENSION_FORMAT_MAP[format] || format;
    const ext = getExtension(filename) || 'txt';
    const mimeType = FORMAT_MIME_MAP[ext] || 'text/plain';

    const trimmedContent = content.trim();
    const size = Buffer.byteLength(trimmedContent, 'utf8');

    artifacts.push({
      identifier,
      title,
      filename,
      type,
      format,
      mimeType,
      content: trimmedContent,
      size,
      originalFileName: defaultContext.originalFileName,
    });

    // Cleanly strip the XML artifact tag from the conversational stream
    return '\n';
  });

  // Also handle unclosed <neuro_artifact> tags (e.g. when LLM stream terminates early or hits MAX_TOKENS)
  if (cleanText.includes('<neuro_artifact')) {
    const unclosedRegex = /<neuro_artifact\s+([^>]*?)>([\s\S]*)$/i;
    cleanText = cleanText.replace(unclosedRegex, (match, attributesStr, content) => {
      const getAttr = (name) => {
        const regex = new RegExp(`${name}=["']([^"']+)["']`, 'i');
        const attrMatch = regex.exec(attributesStr);
        return attrMatch ? attrMatch[1] : '';
      };

      const identifier = getAttr('identifier') || 'art_' + Date.now().toString(36);
      let title = getAttr('title') || 'Generated Artifact';
      let filename = getAttr('filename') || defaultContext.defaultFileName || 'document.txt';
      let type = getAttr('type') || 'code';
      let format = getAttr('format') || getExtension(filename) || 'text';

      format = EXTENSION_FORMAT_MAP[format] || format;
      const ext = getExtension(filename) || 'txt';
      const mimeType = FORMAT_MIME_MAP[ext] || 'text/plain';

      const trimmedContent = (content || '').trim();
      const size = Buffer.byteLength(trimmedContent, 'utf8');

      artifacts.push({
        identifier,
        title,
        filename,
        type,
        format,
        mimeType,
        content: trimmedContent,
        size,
        originalFileName: defaultContext.originalFileName,
      });

      return '\n';
    });
  }

  // Fallback: If no <neuro_artifact> was found, but the user explicitly requested to edit a file
  // and the assistant replied with a full markdown code block
  if (artifacts.length === 0 && defaultContext.originalFileName) {
    const codeBlockRegex = /```(\w+)?\r?\n([\s\S]+?)```/;
    const match = codeBlockRegex.exec(aiOutput);
    if (match && match[2] && match[2].trim().length > 30) {
      const codeLang = match[1] || getExtension(defaultContext.originalFileName) || 'text';
      const filename = defaultContext.originalFileName;
      const format = EXTENSION_FORMAT_MAP[codeLang] || codeLang;
      const mimeType = getMimeType(filename);
      const content = match[2].trim();

      artifacts.push({
        identifier: 'art_' + Date.now().toString(36),
        title: `Updated ${filename}`,
        filename,
        type: 'code',
        format,
        mimeType,
        content,
        size: Buffer.byteLength(content, 'utf8'),
        originalFileName: defaultContext.originalFileName,
      });
    }
  }

  return {
    cleanText: cleanText.trim(),
    artifacts,
  };
}

