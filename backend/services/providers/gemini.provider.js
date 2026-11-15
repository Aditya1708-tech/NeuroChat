import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, getGeminiApiKeys } from '../../config/env.js';
import { aiConfig } from '../../config/ai.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

let clientPool = [];
let roundRobinIndex = 0;

/**
 * Retrieves the pool of active Gemini clients, reloading if keys change.
 */
function getClientPool() {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return [];

  // Rebuild pool if key count changed
  const currentKeySet = new Set(clientPool.map((c) => c.key));
  const isMatch = keys.length === clientPool.length && keys.every((k) => currentKeySet.has(k));

  if (!isMatch) {
    clientPool = keys.map((key) => ({
      key,
      masked: `...${key.slice(-6)}`,
      client: new GoogleGenerativeAI(key),
    }));
    logger.info(`Initialized Gemini client pool with ${clientPool.length} active API key(s)`);
  }

  return clientPool;
}

// Development fallback responses if API key is not yet set
function generateMockResponse(contents, systemInstruction) {
  const lastMsg = contents[contents.length - 1];
  const lastText = (lastMsg?.parts?.[0]?.text || '').toLowerCase();
  const allText = contents.map((c) => c.parts?.[0]?.text || '').join(' ').toLowerCase();

  // File Editing & Artifact generation mock handler
  if (
    allText.includes('--- attached file:') ||
    allText.includes('--- attached pdf document:') ||
    allText.includes('edit-file') ||
    allText.includes('refactor') ||
    allText.includes('artifact') ||
    (allText.includes('convert') && (allText.includes('json') || allText.includes('csv') || allText.includes('markdown')))
  ) {
    const fileMatch = /--- ATTACHED (?:FILE|PDF DOCUMENT):\s*([^\s(]+)/i.exec(allText);
    const uploadedName = fileMatch ? fileMatch[1] : (lastText.includes('json') ? 'data.json' : 'document.html');
    const isPython = uploadedName.endsWith('.py') || lastText.includes('python');
    const isJson = uploadedName.endsWith('.json') || lastText.includes('json');
    const isCsv = uploadedName.endsWith('.csv') || lastText.includes('csv');
    const isMd = uploadedName.endsWith('.md') || lastText.includes('markdown');
    const isPdfOrDoc = uploadedName.endsWith('.pdf') || uploadedName.endsWith('.html') || lastText.includes('format') || lastText.includes('margin') || lastText.includes('palette');

    let filename = uploadedName;
    let format = 'html';
    let type = 'document';
    let codeContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Formatted Document</title>
  <style>
    :root {
      --primary-color: #1e3a8a;
      --secondary-color: #2563eb;
      --accent-color: #3b82f6;
      --bg-surface: #ffffff;
      --bg-soft: #f8fafc;
      --border-color: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
    }
    @page { size: A4 portrait; margin: 25mm 20mm; }
    @media print { body { padding: 0 !important; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: var(--text-main); margin: 0; padding: 40px; background: var(--bg-surface); }
    .header-banner { border-bottom: 3px solid var(--secondary-color); padding-bottom: 16px; margin-bottom: 28px; }
    h1 { color: var(--primary-color); font-size: 26pt; margin: 0 0 8px 0; }
    h2 { color: var(--secondary-color); font-size: 16pt; margin-top: 24px; border-left: 4px solid var(--secondary-color); padding-left: 10px; }
    .meta-tag { display: inline-block; padding: 3px 8px; border-radius: 4px; background: var(--bg-soft); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid var(--border-color); padding: 10px 14px; text-align: left; }
    th { background: var(--bg-soft); color: var(--primary-color); font-weight: 600; }
    .callout { background: #eff6ff; border-left: 4px solid var(--accent-color); padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>Formatted Project Document</h1>
    <span class="meta-tag">Processed & Styled by NeuroChat</span>
  </div>
  <h2>Executive Overview</h2>
  <p>This document has been reformatted with consistent 1-inch margins, high-contrast typography, and an enhanced corporate color palette.</p>
  <div class="callout">
    <strong>Document Enhancements:</strong> All sections preserved, margin bleed prevented, and print-ready styles applied.
  </div>
</body>
</html>`;

    if (isPython) {
      format = 'python';
      type = 'code';
      codeContent = `# Updated ${filename} - Processed by NeuroChat\nfrom datetime import datetime\n\ndef process_data(items: list) -> list:\n    return [{**item, "verified": True} for item in items]\n`;
    } else if (isJson) {
      format = 'json';
      type = 'data';
      codeContent = `{\n  "version": "1.0",\n  "records": [{ "id": 1, "status": "active" }]\n}`;
    } else if (isCsv) {
      format = 'csv';
      type = 'data';
      codeContent = `id,name,role,status\n1,Aditya,Admin,Active`;
    } else if (isMd) {
      format = 'markdown';
      type = 'markdown';
      codeContent = `# Project Documentation\n\n## Overview\nFormatted document with enhanced color palette.`;
    }

    return {
      text: `I have analyzed and reformatted **\`${filename}\`** with professional margins, typography, and an enhanced color palette.\n\n### Document Enhancements:\n- Applied calibrated 1-inch margins (\`@page { margin: 25mm 20mm }\`)\n- Harmonized color palette with primary accent, clean cards, and styled callout boxes\n- Embedded print stylesheets ensuring colors and headers are 100% preserved in PDF export\n- Saved to your Library ready for 1-click preview and PDF download.\n\n<neuro_artifact identifier="art_${Date.now()}" type="${type}" title="Formatted ${filename}" filename="${filename.replace(/\.pdf$/i, '.html')}" format="${format}">\n${codeContent}\n</neuro_artifact>`,
      finishReason: 'STOP',
      model: `${aiConfig.model}-dev-mock`,
      usage: { promptTokens: 60, completionTokens: 140 },
    };
  }

  // Multi-turn context test
  if (allText.includes('java') && (lastText.includes('advantage') || lastText.includes('benefit') || lastText.includes('its') || lastText.includes('फायदे') || lastText.includes('इसके'))) {
    return {
      text: `### Main Advantages of Java:\n\n1. **Platform Independence**: Java programs compile to bytecode running on any JVM ("Write Once, Run Anywhere").\n2. **Object-Oriented**: Promotes clean, modular code through encapsulation, inheritance, and polymorphism.\n3. **Automatic Memory Management**: Garbage collection handles memory reclamation without manual pointers.\n4. **Robust Standard Library & Ecosystem**: Thousands of high-performance libraries and enterprise frameworks (Spring, Quarkus).\n5. **Strong Typing & Compile-Time Checks**: Reduces runtime errors in large enterprise codebases.`,
      finishReason: 'STOP',
      model: `${aiConfig.model}-dev-mock`,
      usage: { promptTokens: 64, completionTokens: 128 },
    };
  }

  if (lastText.includes('java') || lastText.includes('जावा')) {
    return {
      text: `**Java** is a class-based, object-oriented programming language designed for minimal implementation dependencies.\n\n\`\`\`java\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello from NeuroChat!");\n    }\n}\n\`\`\`\n\nIt is widely used for building enterprise backends, Android mobile applications, big data platforms, and secure banking systems.`,
      finishReason: 'STOP',
      model: `${aiConfig.model}-dev-mock`,
      usage: { promptTokens: 25, completionTokens: 90 },
    };
  }

  if (lastText.includes('photosynthesis') || lastText.includes('प्रकाश संश्लेषण')) {
    return {
      text: `**Photosynthesis** is the biological process by which green plants, algae, and certain bacteria convert sunlight, water, and carbon dioxide into chemical energy in the form of glucose and oxygen.\n\n$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{Light} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6CO}_2$$\n\nThis fundamental reaction happens inside **chloroplasts** using the green pigment **chlorophyll**.`,
      finishReason: 'STOP',
      model: `${aiConfig.model}-dev-mock`,
      usage: { promptTokens: 30, completionTokens: 85 },
    };
  }

  if (lastText.includes('python') || lastText.includes('पायथन')) {
    return {
      text: `**Python** is an interpreted, high-level, dynamically-typed programming language renowned for simplicity and developer productivity.\n\n\`\`\`python\ndef greet(name: str) -> str:\n    return f"Hello, {name}! Welcome to NeuroChat."\n\nprint(greet("World"))\n\`\`\`\n\nIt dominates fields like Artificial Intelligence, Data Science, Web Development, and Automation.`,
      finishReason: 'STOP',
      model: `${aiConfig.model}-dev-mock`,
      usage: { promptTokens: 28, completionTokens: 95 },
    };
  }

  if (lastText.includes('नमस्ते') || lastText.includes('hindi') || lastText.includes('हिन्दी')) {
    return {
      text: `नमस्ते! मैं **NeuroChat** हूँ — आपका बुद्धिमान वार्तालाप सहायक।\n\nमैं आपकी कैसे मदद कर सकता हूँ? आप मुझसे किसी भी विषय, कोडिंग, या अध्ययन सामग्री के बारे में प्रश्न पूछ सकते हैं।`,
      finishReason: 'STOP',
      model: `${aiConfig.model}-dev-mock`,
      usage: { promptTokens: 40, completionTokens: 60 },
    };
  }

  return {
    text: `I have received your message:\n\n> "${lastMsg?.parts?.[0]?.text || ''}"\n\n*NeuroChat Backend Note*: This response was generated via the NeuroChat development provider. Once you add your live Google Gemini API key to \`backend/.env\`, NeuroChat will automatically query Google Gemini models directly.`,
    finishReason: 'STOP',
    model: `${aiConfig.model}-dev-mock`,
    usage: { promptTokens: 20, completionTokens: 45 },
  };
}

export async function callGemini({ contents, systemInstruction }) {
  const pool = getClientPool();

  // If no live key provided, use development mock provider
  if (pool.length === 0) {
    logger.dev('No live Gemini API keys available; using development mock responder.');
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateMockResponse(contents, systemInstruction);
  }

  const candidateModels = [
    'gemini-3.5-flash-lite',
    aiConfig.model,
    'gemini-3.6-flash',
    'gemini-3.8-flash',
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let lastError = null;

  // Try across available API keys (round-robin + failover if quota/busy)
  const poolSize = pool.length;
  const startIndex = (roundRobinIndex++) % poolSize;

  for (let keyAttempt = 0; keyAttempt < poolSize; keyAttempt++) {
    const currentEntry = pool[(startIndex + keyAttempt) % poolSize];
    const client = currentEntry.client;

    for (const currentModelName of candidateModels) {
      const model = client.getGenerativeModel(
        {
          model: currentModelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            temperature: aiConfig.temperature,
            maxOutputTokens: aiConfig.maxOutputTokens,
          },
        },
        {
          timeout: aiConfig.timeoutMs || 180000,
        }
      );

      const startTime = Date.now();

      try {
        const result = await model.generateContent({ contents });
        const latencyMs = Date.now() - startTime;
        const response = await result.response;

        if (!response) {
          throw new ApiError(502, 'AI_EMPTY_RESPONSE', "I couldn't produce an answer. Try rephrasing or retry.", null, true);
        }

        const candidate = response.candidates?.[0];
        if (!candidate) {
          throw new ApiError(502, 'AI_EMPTY_RESPONSE', "I couldn't produce an answer. Try rephrasing or retry.", null, true);
        }

        const finishReason = candidate.finishReason || 'STOP';
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
          throw new ApiError(422, 'AI_BLOCKED', "I can't help with that request. Try asking differently.", null, false);
        }

        const text = response.text() || '';
        if (!text.trim()) {
          throw new ApiError(502, 'AI_EMPTY_RESPONSE', "I couldn't produce an answer. Try rephrasing or retry.", null, true);
        }

        const usage = response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount || 0,
              completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            }
          : { promptTokens: 0, completionTokens: 0 };

        return {
          text,
          finishReason,
          model: currentModelName,
          usage,
          latencyMs,
          keyMasked: currentEntry.masked,
        };
      } catch (error) {
        lastError = error;

        // If it's a safety block or non-transient ApiError, do not retry
        if (error instanceof ApiError && !error.isTransient) {
          throw error;
        }

        const status = error?.status || error?.statusCode;
        const isQuotaOrRateLimited =
          status === 429 ||
          error?.message?.includes('429') ||
          error?.message?.toLowerCase().includes('quota') ||
          error?.message?.toLowerCase().includes('rate');

        const isBusyOrOverloaded =
          (status >= 500 && status < 600) ||
          error?.message?.toLowerCase().includes('overloaded') ||
          error?.message?.toLowerCase().includes('unavailable');

        if (isQuotaOrRateLimited || isBusyOrOverloaded) {
          logger.warn(
            `Key ${currentEntry.masked} encountered ${isQuotaOrRateLimited ? 'quota limit' : 'busy/overload'}. Rotating to next API key...`,
            { error: error.message }
          );
          // Break model loop to switch immediately to next API key
          break;
        }

        logger.warn(`Model ${currentModelName} failed on key ${currentEntry.masked}, trying next candidate model...`, {
          error: error.message,
        });
      }
    }
  }

  const error = lastError;

  if (error instanceof ApiError) {
    throw error;
  }

  const status = error?.status || error?.statusCode;
  const isQuotaOrRateLimited =
    status === 429 ||
    error?.message?.includes('429') ||
    error?.message?.toLowerCase().includes('quota') ||
    error?.message?.toLowerCase().includes('rate');

  const isHighTrafficOrBusy =
    (status >= 500 && status < 600) ||
    error?.message?.toLowerCase().includes('demand') ||
    error?.message?.toLowerCase().includes('unavailable') ||
    error?.message?.toLowerCase().includes('overloaded') ||
    error?.name === 'AbortError';

  if (isQuotaOrRateLimited) {
    throw new ApiError(
      429,
      'AI_RATE_LIMITED',
      'NeuroChat is busy right now due to high request traffic. Please try again in a few moments.',
      null,
      true
    );
  }

  if (isHighTrafficOrBusy) {
    throw new ApiError(
      503,
      'AI_BUSY',
      'NeuroChat is busy right now. Please try again in a few moments.',
      null,
      true
    );
  }

  if (status === 400 || status === 401 || status === 403) {
    logger.error('Gemini Configuration or Auth Error', { message: error?.message });
    throw new ApiError(502, 'AI_CONFIG_ERROR', "NeuroChat's AI service isn't available right now. Please try again later.", null, true);
  }

  logger.error('Gemini Provider Error', { message: error?.message });
  throw new ApiError(502, 'AI_BAD_RESPONSE', "I couldn't produce an answer. Try rephrasing or retry.", null, true);
}
