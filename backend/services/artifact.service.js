import mongoose from 'mongoose';
import { Artifact } from '../models/Artifact.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import {
  parseArtifacts,
  resolveArtifactNaming,
  getMimeType,
  getExtension,
} from '../utils/artifactParser.js';
import { generateReply } from './ai.service.js';
import { convertContentFormat } from '../utils/fileConverter.js';
import { logger } from '../utils/logger.js';

/**
 * List artifacts in user's Library with optional filters.
 */
export async function listArtifacts(userId, { conversationId, search, type, format, limit = 50, skip = 0 } = {}) {
  const query = { userId };

  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    query.conversationId = conversationId;
  }

  if (type) {
    query.type = type;
  }

  if (format) {
    query.format = format;
  }

  if (search && search.trim()) {
    query.search = search.trim();
  }

  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const skipNumber = Math.max(parseInt(skip, 10) || 0, 0);

  const docs = await Artifact.find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .skip(skipNumber)
    .limit(limitNumber)
    .lean();

  const total = await Artifact.countDocuments(query);

  const artifacts = docs.map((doc) => ({
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    conversationId: doc.conversationId ? doc.conversationId.toString() : '',
    messageId: doc.messageId ? doc.messageId.toString() : undefined,
    title: doc.title,
    filename: doc.filename,
    type: doc.type,
    format: doc.format,
    mimeType: doc.mimeType,
    content: doc.content,
    originalFileName: doc.originalFileName,
    originalFormat: doc.originalFormat,
    size: doc.size,
    version: doc.version,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  return { artifacts, total, hasMore: skipNumber + artifacts.length < total };
}

/**
 * Get a single artifact by ID.
 */
export async function getArtifactById(userId, artifactId) {
  if (!mongoose.Types.ObjectId.isValid(artifactId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Artifact not found.');
  }

  const doc = await Artifact.findOne({ _id: artifactId, userId });
  if (!doc) {
    throw new ApiError(404, 'NOT_FOUND', 'Artifact not found.');
  }

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    conversationId: doc.conversationId ? doc.conversationId.toString() : '',
    messageId: doc.messageId ? doc.messageId.toString() : undefined,
    title: doc.title,
    filename: doc.filename,
    type: doc.type,
    format: doc.format,
    mimeType: doc.mimeType,
    content: doc.content,
    originalFileName: doc.originalFileName,
    originalFormat: doc.originalFormat,
    size: doc.size,
    version: doc.version,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Create or save an artifact into the library.
 */
export async function createArtifact(userId, data) {
  const {
    conversationId,
    messageId,
    title,
    filename,
    type = 'code',
    format,
    mimeType,
    content = '',
    originalFileName,
    originalFormat,
  } = data;

  const resolvedMime = mimeType || getMimeType(filename || format || 'txt');
  const resolvedFormat = format || getExtension(filename) || 'text';
  const size = Buffer.byteLength(content, 'utf8');

  const artifactDoc = await Artifact.create({
    userId,
    conversationId: conversationId || undefined,
    messageId: messageId || undefined,
    title: title || (filename ? `File: ${filename}` : 'Untitled Artifact'),
    filename: filename || 'document.txt',
    type,
    format: resolvedFormat,
    mimeType: resolvedMime,
    content,
    originalFileName,
    originalFormat,
    size,
    version: 1,
  });

  return artifactDoc.toJSON();
}

/**
 * Update an artifact in the library.
 */
export async function updateArtifact(userId, artifactId, updates = {}) {
  if (!mongoose.Types.ObjectId.isValid(artifactId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Artifact not found.');
  }

  const existing = await Artifact.findOne({ _id: artifactId, userId });
  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Artifact not found.');
  }

  if (updates.title) existing.title = updates.title.trim();
  if (updates.filename) {
    existing.filename = updates.filename.trim();
    existing.format = getExtension(existing.filename) || existing.format;
    existing.mimeType = getMimeType(existing.filename);
  }
  if (updates.content !== undefined) {
    existing.content = updates.content;
    existing.size = Buffer.byteLength(updates.content, 'utf8');
    existing.version = (existing.version || 1) + 1;
  }
  if (updates.format) existing.format = updates.format;

  existing.updatedAt = new Date();
  await existing.save();

  return existing.toJSON();
}

/**
 * Delete an artifact from the library.
 */
export async function deleteArtifact(userId, artifactId) {
  if (!mongoose.Types.ObjectId.isValid(artifactId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Artifact not found.');
  }

  const result = await Artifact.deleteOne({ _id: artifactId, userId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'NOT_FOUND', 'Artifact not found.');
  }

  return { success: true };
}

/**
 * Seamlessly edit an uploaded document or artifact using AI.
 * Handles target format conversions, preserves original format if not specified,
 * saves to Library, and optionally updates conversation messages.
 */
export async function editFileWithAI({
  userId,
  conversationId,
  fileContent = '',
  fileName = 'document.txt',
  mimeType,
  instructions = '',
  targetFormat,
}) {
  // 1. Validate or initialize conversation
  let convId = conversationId;
  let conversation = null;

  if (convId && mongoose.Types.ObjectId.isValid(convId)) {
    conversation = await Conversation.findOne({ _id: convId, userId });
  }

  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      title: `Editing ${fileName}`,
    });
    convId = conversation.id;
  }

  // 2. Resolve input text (decode base64 dataUrl if provided)
  let rawText = fileContent;
  if (fileContent.startsWith('data:')) {
    const comma = fileContent.indexOf(',');
    const base64Part = comma !== -1 ? fileContent.slice(comma + 1) : fileContent;
    try {
      rawText = Buffer.from(base64Part, 'base64').toString('utf8');
    } catch {
      rawText = fileContent;
    }
  }

  // 3. Resolve output format and naming
  const naming = resolveArtifactNaming({
    originalFileName: fileName,
    instructions,
    targetFormat,
  });

  const originalExt = getExtension(fileName) || 'text';

  // 4. Construct high-fidelity editing prompt
  const editPrompt = `You are editing an uploaded document or code file.

ORIGINAL FILENAME: ${fileName}
DESIRED OUTPUT FILENAME: ${naming.filename}
DESIRED FORMAT: ${naming.format} (${naming.mimeType})

USER EDITING INSTRUCTIONS:
${instructions || 'Please review, optimize, fix any errors, and output the updated version.'}

ORIGINAL FILE CONTENT:
\`\`\`${originalExt}
${rawText}
\`\`\`

INSTRUCTIONS FOR OUTPUT:
1. Deliver the COMPLETE updated/edited file inside a <neuro_artifact> tag:
   <neuro_artifact identifier="edit_${Date.now()}" type="code" title="Updated ${naming.filename}" filename="${naming.filename}" format="${naming.format}">
   ...complete updated code or text...
   </neuro_artifact>
2. In your conversational message outside the tag, summarize the edits, improvements, and fixes you performed.`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: editPrompt }],
    },
  ];

  // 5. Call AI service
  const aiReply = await generateReply({
    contents,
    replyLanguage: 'auto',
  });

  // 6. Parse artifacts from output
  const parsed = parseArtifacts(aiReply.text, {
    originalFileName: fileName,
    defaultFileName: naming.filename,
  });

  let artifactData = parsed.artifacts[0];

  // Fallback if parsing found nothing
  if (!artifactData) {
    artifactData = {
      identifier: 'edit_' + Date.now().toString(36),
      title: `Updated ${naming.filename}`,
      filename: naming.filename,
      type: 'code',
      format: naming.format,
      mimeType: naming.mimeType,
      content: rawText,
      size: Buffer.byteLength(rawText, 'utf8'),
      originalFileName: fileName,
    };
  }

  // 7. Save user message to chat history
  const userMsg = await Message.create({
    conversationId: convId,
    userId,
    role: 'user',
    content: instructions ? `Edit \`${fileName}\`: ${instructions}` : `Edit \`${fileName}\``,
    attachment: {
      type: 'file',
      name: fileName,
      mimeType: mimeType || getMimeType(fileName),
      size: Buffer.byteLength(rawText, 'utf8'),
    },
  });

  // 8. Save artifact to Library
  const savedArtifact = await Artifact.create({
    userId,
    conversationId: convId,
    messageId: userMsg._id,
    title: artifactData.title || `Updated ${naming.filename}`,
    filename: artifactData.filename || naming.filename,
    type: artifactData.type || 'code',
    format: artifactData.format || naming.format,
    mimeType: artifactData.mimeType || naming.mimeType,
    content: artifactData.content,
    originalFileName: fileName,
    originalFormat: originalExt,
    size: artifactData.size || Buffer.byteLength(artifactData.content, 'utf8'),
    version: 1,
  });

  const artifactJSON = savedArtifact.toJSON();

  // 9. Save assistant message with artifact metadata
  const assistantMsg = await Message.create({
    conversationId: convId,
    userId,
    role: 'assistant',
    content: parsed.cleanText || `I have updated \`${naming.filename}\` per your instructions.`,
    metadata: {
      model: aiReply.model,
      finishReason: aiReply.finishReason,
      latencyMs: aiReply.latencyMs,
      usage: aiReply.usage,
      artifacts: [artifactJSON],
    },
  });

  // 10. Update conversation timestamp
  conversation.updatedAt = new Date();
  await conversation.save();

  return {
    artifact: artifactJSON,
    explanation: parsed.cleanText,
    userMessage: userMsg.toJSON(),
    assistantMessage: assistantMsg.toJSON(),
    conversation: conversation.toJSON(),
  };
}

