import html2pdf from 'html2pdf.js';
import { apiFetch } from './api.js';

export const FORMAT_EXTENSIONS = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  html: 'html',
  css: 'css',
  json: 'json',
  csv: 'csv',
  markdown: 'md',
  text: 'txt',
  xml: 'xml',
  yaml: 'yaml',
  sql: 'sql',
};

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
  sql: 'text/x-sql',
};

/**
 * Downloads a file directly in the browser via Blob URL.
 */
export function downloadFile(filename = 'document.txt', content = '', mimeType = '') {
  const ext = filename.split('.').pop()?.toLowerCase() || 'txt';
  const resolvedMime = mimeType || FORMAT_MIME_MAP[ext] || 'text/plain;charset=utf-8';

  const blob = new Blob([content], { type: resolvedMime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Client-side format conversion helpers for instantaneous exports.
 */
export function convertFormat(content = '', fromFormat = '', toFormat = '') {
  const from = fromFormat.toLowerCase();
  const to = toFormat.toLowerCase();

  if (from === to) return content;

  // JSON to CSV
  if (from === 'json' && to === 'csv') {
    try {
      const data = typeof content === 'string' ? JSON.parse(content) : content;
      const array = Array.isArray(data) ? data : [data];
      if (array.length === 0) return '';
      const keys = Array.from(new Set(array.flatMap((item) => Object.keys(item))));
      const header = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(',');
      const rows = array.map((item) =>
        keys
          .map((k) => {
            const val = item[k] ?? '';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      return [header, ...rows].join('\n');
    } catch {
      return content;
    }
  }

  // CSV to JSON
  if (from === 'csv' && to === 'json') {
    try {
      const lines = content.trim().split(/\r?\n/);
      if (lines.length === 0) return '[]';
      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map((v) => v.replace(/^"|"$/g, '').trim());
        const obj = {};
        headers.forEach((h, idx) => {
          let val = values[idx] ?? '';
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (!isNaN(Number(val)) && val !== '') val = Number(val);
          obj[h] = val;
        });
        data.push(obj);
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return content;
    }
  }

  // Markdown to plain text
  if (from === 'markdown' && (to === 'txt' || to === 'text')) {
    return content
      .replace(/^#+\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?|```$/g, ''))
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
  }

  return content;
}

export const artifactService = {
  async list({ conversationId, search, type, format, limit = 50, skip = 0 } = {}) {
    const params = new URLSearchParams();
    if (conversationId) params.set('conversationId', conversationId);
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (format) params.set('format', format);
    if (limit) params.set('limit', limit);
    if (skip) params.set('skip', skip);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/artifacts${queryString}`);
    return {
      artifacts: res.data.artifacts || [],
      total: res.data.total || 0,
      hasMore: res.meta?.hasMore || false,
    };
  },

  async get(id) {
    const res = await apiFetch(`/artifacts/${id}`);
    return res.data.artifact;
  },

  async create(data) {
    const res = await apiFetch('/artifacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data.artifact;
  },

  async update(id, updates) {
    const res = await apiFetch(`/artifacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data.artifact;
  },

  async delete(id) {
    const res = await apiFetch(`/artifacts/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async editFile(conversationId, { fileContent, fileName, mimeType, instructions, targetFormat }) {
    const res = await apiFetch(`/conversations/${conversationId}/edit-file`, {
      method: 'POST',
      body: JSON.stringify({
        fileContent,
        fileName,
        mimeType,
        instructions,
        targetFormat,
      }),
    });
    return res.data;
  },

  getDownloadUrl(id) {
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${base}/artifacts/${id}/download`;
  },
};



/**
 * High-definition PDF Exporter: Generates and downloads an exact-fidelity PDF
 * preserving all banner gradients, color palettes, fonts, margins, and tables.
 */
export async function exportArtifactAsPdf(artifact) {
  if (!artifact) return;
  const { title = 'Document', filename = 'document.pdf', content = '' } = artifact;

  const baseName = filename.replace(/\.(html|md|txt|pdf)$/i, '') || 'document';
  const pdfFilename = `${baseName}.pdf`;

  const isHtml = Boolean(content && (content.includes('<!DOCTYPE html>') || content.includes('<html')));

  let bodyHtml = '';
  let extractedStyles = '';

  if (isHtml) {
    // 1. Extract all <style> blocks from the HTML (both <head> and <body>)
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    while ((match = styleRegex.exec(content)) !== null) {
      extractedStyles += '\n' + match[1];
    }

    // 2. Extract <body> content if present, or strip doctype/head/html
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyHtml = bodyMatch[1];
    } else {
      bodyHtml = content.replace(/<!DOCTYPE html>/gi, '').replace(/<html[^>]*>|<\/html>/gi, '');
    }
  } else {
    // Plain text or Markdown: Wrap in an executive styled template with indigo banner
    bodyHtml = `
      <div class="document-container">
        <div class="cover-banner">
          <h1>${title}</h1>
          <p>Formatted Executive Document</p>
          <div class="meta-tag">Generated by NeuroChat</div>
        </div>
        <div class="executive-body">
          ${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      </div>
    `;
    extractedStyles = `
      :root {
        --primary: #1e3a8a;
        --secondary: #059669;
        --accent: #2563eb;
        --text-main: #0f172a;
        --border-color: #e2e8f0;
        --card-bg: #f8fafc;
      }
      .document-container { padding: 24px; max-width: 100%; margin: 0 auto; }
      .executive-body { white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11pt; line-height: 1.65; color: #1e293b; }
      h1, h2, h3 { color: var(--primary); }
    `;
  }

  // 3. Transform extracted styles so that :root CSS variables and body styles map to container classes
  let transformedStyles = extractedStyles
    .replace(/:root\b/g, ':root, .nc-pdf-export-container, .nc-pdf-body-wrapper')
    .replace(/\bbody\s*\{/g, 'body, .nc-pdf-body-wrapper {')
    .replace(/\bhtml\s*\{/g, 'html, .nc-pdf-export-container {');

  // 4. Enhanced print engine styles ensuring 100% color, gradient, and margin preservation
  const printEngineStyles = `
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
    }
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    .nc-pdf-export-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff !important;
      background-color: #ffffff !important;
      width: 794px !important; /* 210mm at 96 DPI */
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      line-height: 1.6;
    }
    .nc-pdf-body-wrapper {
      width: 100% !important;
      background: #ffffff !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .document-container, .container, main, article {
      max-width: 100% !important;
      width: 100% !important;
      box-shadow: none !important;
    }
    .cover-banner, [class*="banner"] {
      background-color: #1e3a8a !important;
      background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%) !important;
      color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border-radius: 12px;
      padding: 30px 28px;
      margin-bottom: 24px;
    }
    .cover-banner h1, [class*="banner"] h1 {
      color: #ffffff !important;
      margin: 0 0 8px 0;
    }
    .cover-banner p, [class*="banner"] p {
      color: #f1f5f9 !important;
      opacity: 0.95 !important;
    }
    .meta-tag, .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2) !important;
      color: #ffffff !important;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      margin: 16px 0 !important;
    }
    th, td {
      border: 1px solid #cbd5e1 !important;
      padding: 8px 12px !important;
    }
    th {
      background-color: #e0e7ff !important;
      color: #1e3a8a !important;
      font-weight: 600 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    tr:nth-child(even) {
      background-color: #f8fafc !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .callout {
      background-color: #f0fdf4 !important;
      border-left: 4px solid #059669 !important;
      padding: 12px 16px !important;
      border-radius: 0 8px 8px 0 !important;
      margin: 16px 0 !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .callout.warning {
      background-color: #fffbeb !important;
      border-left-color: #d97706 !important;
    }
    .page-break {
      page-break-before: always !important;
      break-before: always !important;
    }
    .no-print {
      display: none !important;
    }
    ${transformedStyles}
  `;

  // 5. Create offscreen wrapper and container in main DOM with normal layout flow (NO negative zIndex, NO fixed position)
  const wrapper = document.createElement('div');
  wrapper.id = 'nc-pdf-offscreen-wrapper';
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-99999px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px';
  wrapper.style.overflow = 'visible';

  const exportContainer = document.createElement('div');
  exportContainer.id = 'nc-pdf-export-root';
  exportContainer.className = 'nc-pdf-export-container';
  exportContainer.style.width = '794px';
  exportContainer.style.backgroundColor = '#ffffff';
  exportContainer.style.color = '#0f172a';
  exportContainer.style.margin = '0';
  exportContainer.style.padding = '0';
  exportContainer.style.boxSizing = 'border-box';
  exportContainer.style.display = 'block';

  exportContainer.innerHTML = `
    <style id="nc-pdf-injected-styles">
      ${printEngineStyles}
    </style>
    <div class="nc-pdf-body-wrapper">
      ${bodyHtml}
    </div>
  `;

  wrapper.appendChild(exportContainer);
  document.body.appendChild(wrapper);

  // 6. Wait for layout, styles, and fonts to fully calculate
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font wait error
    }
  }

  const opt = {
    margin: [8, 8, 8, 8], // mm
    filename: pdfFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
    },
  };

  try {
    await html2pdf().set(opt).from(exportContainer).save();
  } catch (err) {
    console.warn('html2pdf direct conversion fallback:', err);
    window.print();
  } finally {
    setTimeout(() => {
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    }, 2000);
  }
}