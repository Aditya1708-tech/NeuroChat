/**
 * Utility for programmatic file format conversions between JSON, CSV, Markdown, Text, and HTML.
 */

export function jsonToCsv(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    const array = Array.isArray(data) ? data : [data];
    if (array.length === 0) return '';

    // Collect all unique keys
    const keys = Array.from(
      new Set(array.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value'])))
    );

    const header = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(',');
    const rows = array.map((item) => {
      if (typeof item !== 'object' || item === null) {
        return `"${String(item).replace(/"/g, '""')}"`;
      }
      return keys
        .map((k) => {
          const val = item[k];
          if (val === undefined || val === null) return '""';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  } catch (err) {
    throw new Error(`Failed to convert JSON to CSV: ${err.message}`);
  }
}

export function csvToJson(csvString) {
  try {
    const lines = csvString.trim().split(/\r?\n/);
    if (lines.length === 0) return '[]';

    // Simple CSV line parser supporting quoted fields
    const parseLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseLine(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => {
        let val = values[idx] ?? '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        // Try parsing number or boolean
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(Number(val)) && val !== '') val = Number(val);
        obj[h] = val;
      });
      data.push(obj);
    }

    return JSON.stringify(data, null, 2);
  } catch (err) {
    throw new Error(`Failed to convert CSV to JSON: ${err.message}`);
  }
}

export function markdownToPlainText(mdString = '') {
  return mdString
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?|```$/g, '')) // Remove code block fences
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/^\s*[-*+]\s+/gm, '• ') // List bullets
    .trim();
}

/**
 * Universal format converter
 */
export function convertContentFormat(content, fromFormat = '', toFormat = '') {
  const from = fromFormat.toLowerCase();
  const to = toFormat.toLowerCase();

  if (from === to) return content;

  if (from === 'json' && to === 'csv') {
    return jsonToCsv(content);
  }

  if (from === 'csv' && to === 'json') {
    return csvToJson(content);
  }

  if (from === 'markdown' && (to === 'txt' || to === 'text')) {
    return markdownToPlainText(content);
  }

  // Fallback: return as text
  return content;
}

