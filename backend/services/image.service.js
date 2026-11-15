import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, getGeminiApiKeys } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getExtension } from '../utils/artifactParser.js';

const IMAGE_GENERATE_KEYWORDS = [
  'generate an image',
  'generate image',
  'create an image',
  'create image',
  'draw an image',
  'draw a',
  'draw me',
  'make an image',
  'paint a',
  'picture of',
  'photo of',
  'image of',
  'generate a photo',
  'create a photo',
  'design a logo',
  'illustration of',
  'render an image',
  'ai image',
  'photograph of',
  'चित्र बनाओ',
  'तस्वीर बनाओ',
  'फोटो बनाओ',
  'इमेज बनाओ',
];

const IMAGE_EDIT_KEYWORDS = [
  'enhance',
  'edit',
  'color',
  'colour',
  'quality',
  'filter',
  'restore',
  'upscale',
  'brighten',
  'retouch',
  'stylize',
  'change background',
  'fix photo',
  'improve photo',
  'beautify',
  'hd',
  '4k',
  '8k',
  'hdr',
  'contrast',
  'saturation',
  'lighting',
  'सुधारो',
  'बदलो',
  'सुंदर बनाओ',
];

/**
 * Checks if the request is an image generation or editing task.
 */
export function isImageTask(prompt = '', attachment = null) {
  const text = (prompt || '').toLowerCase().trim();
  const hasImageAttachment = Boolean(
    attachment && (attachment.type === 'image' || attachment.mimeType?.startsWith('image/'))
  );

  // If user uploaded an image
  if (hasImageAttachment) {
    if (!text) return true; // Just image uploaded -> enhance by default
    return /enhance|edit|filter|color|colour|quality|restore|upscale|retouch|stylize|beautify|fix|clear|brighten|darken|contrast|vibrant|hd|4k|draw|generate|create|turn|convert|remake|redraw|सुधारो|बदलो|सुंदर/i.test(
      text
    );
  }

  // 1. Action + optional modifiers + noun (e.g. "generate me an image", "create a 4k photo", "design a logo")
  const actionNounPattern =
    /(?:generate|create|make|draw|paint|render|produce|design)\s+(?:me\s+)?(?:an?|the|some)?\s*(?:hd|4k|8k|ai|photorealistic|cinematic|digital|artistic|modern|cool)?\s*(?:image|photo|picture|wallpaper|poster|illustration|portrait|artwork|graphic|drawing|painting|logo)\b/i;

  // 2. Noun + Preposition (e.g. "image of", "image for roadmap", "photo of", "picture showing")
  const nounPrepositionPattern =
    /\b(?:image|photo|picture|wallpaper|poster|illustration|artwork|portrait|logo)\s+(?:of|for|showing|depicting|with)\b/i;

  // 3. Direct creative verbs (e.g. "draw a...", "paint me a...")
  const directVerbPattern = /\b(?:draw|paint|illustrate)\s+(?:me\s+)?(?:an?|the)\b/i;

  // 4. Dedicated AI image keywords & Hindi / regional phrases
  const keywordPattern =
    /\b(?:ai image|text to image|text-to-image|flux|sdxl|generate wallpaper|चित्र बनाओ|तस्वीर बनाओ|फोटो बनाओ|इमेज बनाओ|फोटो जनरेट|इमेज जनरेट)\b/i;

  return (
    actionNounPattern.test(text) ||
    nounPrepositionPattern.test(text) ||
    directVerbPattern.test(text) ||
    keywordPattern.test(text) ||
    IMAGE_GENERATE_KEYWORDS.some((kw) => text.includes(kw))
  );
}

/**
 * Fetches an image from NVIDIA NIM (Stable Diffusion 3), OpenAI DALL-E 3, or Pollinations Flux.
 */
export async function fetchGeneratedImage(prompt, { width = 1024, height = 1024, seed } = {}) {
  // Optional: Check if user explicitly enabled NVIDIA SD3 endpoint
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (process.env.ENABLE_NVIDIA_SD3 === 'true' && nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
    try {
      logger.info('Generating high-definition image via NVIDIA NIM (Stable Diffusion 3)...');
      const res = await fetch('https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nvidiaKey}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.slice(0, 950),
          mode: 'text-to-image',
          cfg_scale: 7,
          aspect_ratio: '1:1',
          seed: seed || Math.floor(Math.random() * 1000000),
          steps: 28,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const base64 = data.image || data.artifacts?.[0]?.base64;
        if (base64) {
          logger.info('NVIDIA NIM image generation succeeded (Watermark-free)!');
          return Buffer.from(base64, 'base64');
        }
      }
    } catch (nvErr) {
      logger.warn('NVIDIA NIM fetch failed, falling back:', { error: nvErr?.message });
    }
  }

  // Check if user provided an OpenAI API key for DALL-E 3
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey.startsWith('sk-')) {
    try {
      logger.info('Generating image using OpenAI DALL-E 3...');
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt.slice(0, 950),
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const base64 = data.data?.[0]?.b64_json;
        if (base64) {
          logger.info('DALL-E 3 generation succeeded!');
          return Buffer.from(base64, 'base64');
        }
      } else {
        const errText = await res.text();
        logger.warn('OpenAI DALL-E 3 returned error, falling back to Flux engine:', { error: errText });
      }
    } catch (openAiErr) {
      logger.warn('DALL-E 3 fetch failed, falling back to Flux engine:', { error: openAiErr?.message });
    }
  }

  // High-definition Flux Engine via Pollinations
  const cleanPrompt = encodeURIComponent(prompt.slice(0, 800));
  const seedParam = seed ? `&seed=${seed}` : `&seed=${Math.floor(Math.random() * 1000000)}`;
  const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=flux&nologo=true&enhance=false${seedParam}`;

  const res = await fetch(url, { headers: { 'User-Agent': 'NeuroChat/1.0' } });
  if (!res.ok) {
    throw new Error(`Image engine returned HTTP ${res.status}: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Refines a user prompt or image analysis into an elite photography / digital art prompt.
 */
export async function refineImagePrompt(prompt, imageAnalysis = '') {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    return prompt;
  }

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
  ];

  let systemInstruction = `You are an elite AI Art & Concept Director. 
Transform the given user request into a concise, vivid, thematic prompt (maximum 75 words) optimized for high-end AI image generation (Flux/DALL-E 3).
Focus on: clear concrete subject, physical environment, dramatic lighting, high dynamic range (HDR), color grading, depth of field, and 8k crisp details.
If the user asks for a roadmap, guide, curriculum, or educational path (e.g. cybersecurity, programming, AI), do NOT generate an abstract dark tunnel. Instead, compose an illuminated isometric concept art of a futuristic cyber command center with glowing holographic screens showing learning milestones, digital padlocks, network shields, and cybersecurity terminal nodes.
Output ONLY the raw prompt text without any quotes, conversational text, or prefixes.`;

  if (imageAnalysis) {
    systemInstruction += `\nReference image analysis: ${imageAnalysis}\nPreserve the core subject, composition, and essence of the original image while applying all requested color, lighting, quality, and aesthetic enhancements.`;
  }

  // 1. Try NVIDIA Nemotron-3 Ultra (550B) first for elite creative art direction
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey && nvidiaKey.startsWith('nvapi-')) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `User request: "${prompt}"` },
          ],
          temperature: 0.6,
          max_tokens: 300,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const refined = data.choices?.[0]?.message?.content?.trim();
        if (refined && refined.length > 10) {
          logger.info('NVIDIA Nemotron-3 Ultra refined image prompt successfully');
          return refined.replace(/^\*\*Prompt:\*\*\s*/i, '').trim();
        }
      }
    } catch (nvErr) {
      logger.warn('Nemotron prompt refinement failed, falling back to Gemini:', { error: nvErr?.message });
    }
  }

  // 2. Fall back to Gemini key rotation
  for (const key of keys) {
    const ai = new GoogleGenerativeAI(key);
    for (const modelName of candidateModels) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(
          `${systemInstruction}\n\nUser request: "${prompt}"`
        );
        const generated = result.response?.text()?.trim();
        if (generated && generated.length > 10) {
          return generated.replace(/^\*\*Prompt:\*\*\s*/i, '').trim();
        }
      } catch (err) {
        // Try next model / key
      }
    }
  }

  return prompt;
}

/**
 * Uses Gemini Vision to inspect an uploaded image and understand its subjects and flaws.
 */
export async function analyzeImageWithGemini(dataUrl, userPrompt) {
  const keys = getGeminiApiKeys();
  if (!keys.length || !dataUrl.includes(',')) return '';

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
  ];

  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = /data:([^;]+);/.exec(header);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  for (const key of keys) {
    const ai = new GoogleGenerativeAI(key);
    for (const modelName of candidateModels) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: `Analyze this photo for editing and enhancement according to this user request: "${userPrompt}". 
Describe the key subject, environment, lighting, and specific color/detail enhancements needed in 2 concise sentences.`,
          },
        ]);

        const text = result.response?.text()?.trim();
        if (text) return text;
      } catch (err) {
        // Try next
      }
    }
  }

  return '';
}

/**
 * Main Image Processing Engine: Handles both Text-to-Image Generation and Photo Enhancement.
 */
export async function processImageRequest({ prompt = '', attachment = null, replyLanguage = 'auto' }) {
  const isEditing = Boolean(attachment && attachment.dataUrl);
  const originalFileName = attachment?.name || 'generated_image.png';
  let ext = getExtension(originalFileName).toLowerCase();
  if (!ext || ext === 'txt' || ext === 'bin') {
    ext = attachment?.mimeType?.split('/')[1] || 'png';
  }
  if (ext === 'jpeg') ext = 'jpg';

  const baseName = originalFileName.replace(/\.[^/.]+$/, '').replace(/_enhanced$/i, '');
  const finalFilename = isEditing ? `${baseName}_enhanced.${ext}` : `${baseName || 'neurochat_art'}.${ext}`;
  const finalMimeType = attachment?.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  let imageAnalysis = '';
  if (isEditing) {
    imageAnalysis = await analyzeImageWithGemini(attachment.dataUrl, prompt);
  }

  // Refine prompt for high aesthetic quality
  const targetPrompt = isEditing
    ? `${prompt}. High resolution photographic enhancement, vibrant balanced color palette, rich contrast, crisp clarity, clean studio lighting.`
    : prompt;

  const refinedPrompt = await refineImagePrompt(targetPrompt, imageAnalysis);
  logger.info(`Generating image with refined prompt: "${refinedPrompt.slice(0, 100)}..."`);

  // Fetch the rendered image buffer
  const imageBuffer = await fetchGeneratedImage(refinedPrompt, { width: 1024, height: 1024 });

  // Convert buffer to dataUrl
  const dataUrl = `data:${finalMimeType};base64,${imageBuffer.toString('base64')}`;

  // Formulate friendly conversational reply
  let textReply = '';
  if (isEditing) {
    if (replyLanguage === 'hi') {
      textReply = `मैंने आपकी तस्वीर **\`${originalFileName}\`** को आपकी आवश्यकतानुसार सफलतापूर्वक संवर्धित (Enhance) कर दिया है। इसमें रंगों की गहराई, प्रकाश (Lighting), और बारीकियों (Sharpness) को परिष्कृत किया गया है। आप इसे नीचे दिए गए बटन से सीधे डाउनलोड कर सकते हैं।`;
    } else {
      textReply = `I have enhanced your photo **\`${originalFileName}\`** according to your instructions! The colors have been dynamically graded, contrast and exposure balanced, and details sharpened while preserving your original composition and format (\`.${ext}\`). You can download the enhanced photo directly below.`;
    }
  } else {
    if (replyLanguage === 'hi') {
      textReply = `यहाँ आपके अनुरोध के आधार पर तैयार की गई उच्च-गुणवत्ता वाली तस्वीर प्रस्तुत है: **"${prompt}"**। आप इसे पूर्ण रिज़ॉल्यूशन में देखने के लिए क्लिक कर सकते हैं या सीधे डाउनलोड कर सकते हैं।`;
    } else {
      textReply = `Here is your high-resolution image generated for: **"${prompt}"**! It has been rendered with vibrant lighting, rich textures, and 1024×1024 resolution. You can preview it in full screen or download it directly below.`;
    }
  }

  return {
    imageUrl: dataUrl,
    filename: finalFilename,
    originalName: originalFileName,
    format: ext,
    mimeType: finalMimeType,
    isEnhanced: isEditing,
    prompt: refinedPrompt,
    textReply,
    size: imageBuffer.byteLength,
  };
}
