import { AIProviderRouter } from '../services/ai/aiProviderRouter.js';
import { GeminiImageService } from '../services/ai/geminiImage.service.js';
import { Image } from '../models/Image.js';
import { ApiError } from '../utils/ApiError.js';
import path from 'path';

/**
 * Image Generation Controller
 */
export async function generate(req, res) {
  const { prompt, style = 'realistic', aspectRatio = '1:1', conversationId } = req.body;

  if (!prompt || !prompt.trim()) {
    throw new ApiError(400, 'PROMPT_REQUIRED', 'Please provide a prompt describing the image.');
  }

  // Route exclusively to GeminiImageService via AIProviderRouter
  const result = await AIProviderRouter.routeImage({
    prompt,
    style,
    aspectRatio,
    userId: req.user.id,
  });

  // Persist image metadata to MongoDB (metadata only, NO large base64 strings)
  const imageDoc = await Image.create({
    userId: req.user.id,
    conversationId: conversationId || undefined,
    prompt: result.prompt,
    enhancedPrompt: result.enhancedPrompt,
    model: result.model,
    style: result.style,
    aspectRatio: result.aspectRatio,
    filename: result.filename,
    filePath: result.filePath,
    url: result.url,
    mimeType: result.mimeType,
    format: result.format,
    size: result.size,
    status: 'completed',
  });

  res.status(201).json({
    success: true,
    data: {
      image: imageDoc.toJSON(),
      billingNotice: result.billingNotice || null,
      latencyMs: result.latencyMs,
    },
  });
}

/**
 * Retrieve User's Image History
 */
export async function history(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    Image.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Image.countDocuments({ userId: req.user.id }),
  ]);

  const sanitized = images.map((img) => ({
    id: img._id.toString(),
    prompt: img.prompt,
    model: img.model,
    style: img.style,
    aspectRatio: img.aspectRatio,
    filename: img.filename,
    url: img.url,
    mimeType: img.mimeType,
    format: img.format,
    size: img.size,
    createdAt: img.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      images: sanitized,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
}

/**
 * Serve Raw Image File
 */
export async function getRawImage(req, res) {
  const { id } = req.params;
  const fileInfo = await GeminiImageService.getImageFile(id);

  res.setHeader('Content-Type', fileInfo.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.sendFile(path.resolve(fileInfo.filePath));
}

