import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { aiConfig } from '../../config/ai.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

let genAI = null;

function getClient() {
  if (!genAI && env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('placeholder')) {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
}

// Development fallback responses if API key is not yet set
function generateMockResponse(contents, systemInstruction) {
  const lastMsg = contents[contents.length - 1];
  const lastText = (lastMsg?.parts?.[0]?.text || '').toLowerCase();
  const allText = contents.map((c) => c.parts?.[0]?.text || '').join(' ').toLowerCase();

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
      text: `**Photosynthesis** is the biological process by which green plants, algae, and certain bacteria convert sunlight, water, and carbon dioxide into chemical energy in the form of glucose and oxygen.\n\n$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{Light} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n\nThis fundamental reaction happens inside **chloroplasts** using the green pigment **chlorophyll**.`,
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
  const client = getClient();

  // If no live key provided, use development mock provider
  if (!client) {
    logger.dev('Gemini API key is placeholder; using development mock responder.');
    // Add small realistic latency
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
        timeout: aiConfig.timeoutMs || 35000,
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
      };
    } catch (error) {
      lastError = error;

      // If it's a safety block or empty response ApiError, don't retry models
      if (error instanceof ApiError && !error.isTransient) {
        throw error;
      }

      logger.warn(`Model ${currentModelName} failed, trying next candidate...`, { error: error.message });
      // Continue to next model in candidateModels
    }
  }

  const error = lastError;

  if (error instanceof ApiError) {
    throw error;
  }

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
      'NeuroChat is busy right now due to high request traffic. Please try again in a few minutes.',
      null,
      true
    );
  }

  if (isHighTrafficOrBusy) {
    throw new ApiError(
      503,
      'AI_BUSY',
      'NeuroChat is busy right now. Please try again in a few minutes.',
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
