import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Artifact } from '../models/Artifact.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateConversationTitle, fallbackTitle } from './title.service.js';
import { buildConversationContext } from './context.service.js';
import { generateReply } from './ai.service.js';
import { buildMemoryAndChatContext, extractAndSaveMemories } from './memory.service.js';
import { isSensitiveTopic } from '../utils/sensitiveTopics.js';
import { logger } from '../utils/logger.js';
import { parseArtifacts, getExtension } from '../utils/artifactParser.js';
import { isImageTask, processImageRequest } from './image.service.js';

export async function listMessages(userId, conversationId, { limit = 50, before } = {}) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  // Ownership check
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  const query = { conversationId, userId };
  if (before && mongoose.Types.ObjectId.isValid(before)) {
    query._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

  const messagesDesc = await Message.find(query)
    .sort({ _id: -1 })
    .limit(limitNumber + 1)
    .lean();

  const hasMore = messagesDesc.length > limitNumber;
  if (hasMore) {
    messagesDesc.pop();
  }

  // Also query artifacts associated with this conversation
  const convArtifacts = await Artifact.find({ conversationId, userId }).lean();

  // Reverse to chronological order
  const messages = messagesDesc.reverse().map((msg) => {
    const meta = msg.metadata || {};
    let msgArtifacts = Array.isArray(meta.artifacts) ? meta.artifacts : [];

    // If assistant message and artifacts are missing in metadata, link existing conversation artifacts
    if (msg.role === 'assistant' && msgArtifacts.length === 0 && convArtifacts.length > 0) {
      msgArtifacts = convArtifacts.map((art) => ({
        id: art._id.toString(),
        identifier: art.identifier || 'art_' + art._id.toString(),
        title: art.title,
        filename: art.filename,
        type: art.type || 'code',
        format: art.format || 'text',
        mimeType: art.mimeType || 'text/plain',
        content: art.content || '',
        size: art.size || (art.content ? Buffer.byteLength(art.content, 'utf8') : 0),
        version: art.version || 1,
      }));
    }

    return {
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      role: msg.role,
      content: msg.content,
      attachment: msg.attachment || null,
      createdAt: msg.createdAt,
      metadata: {
        ...meta,
        artifacts: msgArtifacts,
      },
    };
  });

  return { messages, hasMore };
}

export async function sendMessage(userId, conversationId, { content = '', language, attachment, model = 'gemini' }) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  const user = await User.findById(userId);
  const effectiveLanguage = language || user?.settings?.replyLanguage || 'auto';

  // 1. Check if conversation needs title update
  const msgCount = await Message.countDocuments({ conversationId, userId });
  const needsTitle = msgCount === 0 || conversation.title === 'New chat' || conversation.title.includes('…');
  const promptForTitle = (content || '').trim() || (attachment ? `Analysis of ${attachment.name}` : 'New chat');

  if (needsTitle && conversation.title === 'New chat') {
    conversation.title = fallbackTitle(promptForTitle);
  }

  // 2. Save user message first (never lost if AI step fails per spec §18.4)
  const userMessageDoc = await Message.create({
    conversationId,
    userId,
    role: 'user',
    content: (content || '').trim(),
    attachment: attachment || undefined,
  });

  const userMessageDTO = userMessageDoc.toJSON();

  // 3. Fetch recent history (up to 40 messages for context construction)
  const recentHistoryDesc = await Message.find({
    conversationId,
    userId,
    _id: { $ne: userMessageDoc._id },
  })
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  const recentHistory = recentHistoryDesc.reverse();

  // 4. Build bounded context
  const { contents, truncated } = await buildConversationContext(recentHistory, {
    role: 'user',
    content: (content || '').trim(),
    attachment: attachment || undefined,
  });

  // 4b. Fetch long-term memory profile & past conversation directory for cross-chat awareness
  const { memoryContext, recentConversationsContext } = await buildMemoryAndChatContext(userId, conversationId);

  // 5. Check if request is an Image Generation or Image Enhancement request
  if (isImageTask(content, attachment)) {
    try {
      const imgResult = await processImageRequest({
        prompt: (content || '').trim(),
        attachment,
        replyLanguage: effectiveLanguage,
      });

      // Persist to Artifact Library
      const savedArtifact = await Artifact.create({
        userId,
        conversationId,
        messageId: userMessageDoc._id,
        title: imgResult.isEnhanced ? `Enhanced: ${imgResult.originalName}` : `Image: ${imgResult.filename}`,
        filename: imgResult.filename,
        type: 'image',
        format: imgResult.format,
        mimeType: imgResult.mimeType,
        content: imgResult.imageUrl,
        originalFileName: imgResult.originalName,
        size: imgResult.size,
        version: 1,
      });

      const assistantMessageDoc = await Message.create({
        conversationId,
        userId,
        role: 'assistant',
        content: imgResult.textReply,
        metadata: {
          model: 'flux-sdxl-image-studio',
          finishReason: 'STOP',
          latencyMs: 3500,
          image: {
            url: imgResult.imageUrl,
            filename: imgResult.filename,
            originalName: imgResult.originalName,
            format: imgResult.format,
            mimeType: imgResult.mimeType,
            isEnhanced: imgResult.isEnhanced,
            size: imgResult.size,
            artifactId: savedArtifact._id,
          },
          artifacts: [savedArtifact.toJSON()],
        },
      });

      conversation.updatedAt = new Date();
      await conversation.save();

      return {
        userMessage: userMessageDTO,
        assistantMessage: assistantMessageDoc.toJSON(),
        conversation: conversation.toJSON(),
        meta: {
          artifacts: [savedArtifact.toJSON()],
          image: assistantMessageDoc.metadata.image,
        },
      };
    } catch (imgError) {
      logger.error('Image processing failed, falling back to standard AI reply', { error: imgError?.message });
    }
  }

  // 5. Call AI service directly without waiting for title generation
  let aiReply;
  try {
    aiReply = await generateReply({
      contents,
      replyLanguage: effectiveLanguage,
      memoryContext,
      recentConversationsContext,
      model,
    });
  } catch (error) {
    // Attach saved user message so client error handling can retain it
    error.savedData = {
      userMessage: userMessageDTO,
      conversation: conversation.toJSON(),
    };
    throw error;
  }

  // 6. Asynchronously generate refined AI title in background without blocking response
  if (needsTitle) {
    generateConversationTitle(promptForTitle)
      .then(async (newTitle) => {
        if (newTitle && newTitle !== 'New chat') {
          await Conversation.updateOne({ _id: conversationId }, { title: newTitle });
        }
      })
      .catch((err) => {
        logger.warn('Background title generation failed', { error: err?.message });
      });
  }

  // 7. Asynchronously extract enduring facts or preferences into user memory (ChatGPT-style)
  extractAndSaveMemories(userId, conversationId, content || '').catch((err) => {
    logger.warn('Background memory extraction skipped', { error: err?.message });
  });

  // 6. Check sensitive topics heuristic
  const sensitiveTopic = isSensitiveTopic(content) || isSensitiveTopic(aiReply.text);

  // 6b. Automatically parse and save generated/edited artifacts into user's Library
  const parsed = parseArtifacts(aiReply.text, {
    originalFileName: attachment?.name,
  });

  const savedArtifacts = [];
  if (parsed.artifacts && parsed.artifacts.length > 0) {
    for (const art of parsed.artifacts) {
      try {
        const saved = await Artifact.create({
          userId,
          conversationId,
          messageId: userMessageDoc._id,
          title: art.title,
          filename: art.filename,
          type: art.type || 'code',
          format: art.format,
          mimeType: art.mimeType,
          content: art.content,
          originalFileName: art.originalFileName || attachment?.name,
          originalFormat: art.originalFileName ? getExtension(art.originalFileName) : undefined,
          size: art.size,
          version: 1,
        });
        savedArtifacts.push(saved.toJSON());
      } catch (err) {
        logger.warn('Failed to auto-save artifact to library', { error: err?.message });
      }
    }
  }

  // 7. Save assistant message
  const assistantMessageDoc = await Message.create({
    conversationId,
    userId,
    role: 'assistant',
    content: parsed.artifacts.length > 0 ? parsed.cleanText : aiReply.text,
    metadata: {
      model: aiReply.model,
      finishReason: aiReply.finishReason,
      latencyMs: aiReply.latencyMs,
      usage: aiReply.usage,
      sensitiveTopic,
      contextTruncated: truncated,
      artifacts: typeof savedArtifacts !== 'undefined' ? savedArtifacts : [],
    },
  });

  // 8. Update conversation timestamp
  conversation.updatedAt = new Date();
  await conversation.save();

  return {
    userMessage: userMessageDTO,
    assistantMessage: assistantMessageDoc.toJSON(),
    conversation: conversation.toJSON(),
    meta: {
      contextTruncated: truncated,
      artifacts: typeof savedArtifacts !== 'undefined' ? savedArtifacts : [],
      sensitiveTopic,
    },
  };
}

export async function retryMessage(userId, conversationId, { model = 'gemini' } = {}) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  const lastMessage = await Message.findOne({ conversationId, userId }).sort({ _id: -1 });
  if (!lastMessage) {
    throw new ApiError(409, 'NOTHING_TO_RETRY', 'No messages to retry in this conversation.');
  }

  const user = await User.findById(userId);
  const effectiveLanguage = user?.settings?.replyLanguage || 'auto';

  if (lastMessage.role === 'user') {
    // Previous send failed: generate missing reply
    const recentHistoryDesc = await Message.find({
      conversationId,
      userId,
      _id: { $ne: lastMessage._id },
    })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const recentHistory = recentHistoryDesc.reverse();
    const { contents, truncated } = await buildConversationContext(recentHistory, {
      role: 'user',
      content: lastMessage.content,
      attachment: lastMessage.attachment || undefined,
    });

    const { memoryContext, recentConversationsContext } = await buildMemoryAndChatContext(userId, conversationId);

    const aiReply = await generateReply({
      contents,
      replyLanguage: effectiveLanguage,
      memoryContext,
      recentConversationsContext,
      model,
    });
    const sensitiveTopic = isSensitiveTopic(lastMessage.content) || isSensitiveTopic(aiReply.text);

    const assistantMessage = await Message.create({
      conversationId,
      userId,
      role: 'assistant',
      content: parsed.artifacts.length > 0 ? parsed.cleanText : aiReply.text,
      metadata: {
        model: aiReply.model,
        finishReason: aiReply.finishReason,
        latencyMs: aiReply.latencyMs,
        usage: aiReply.usage,
        sensitiveTopic,
        contextTruncated: truncated,
      artifacts: typeof savedArtifacts !== 'undefined' ? savedArtifacts : [],
      },
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    return {
      assistantMessage: assistantMessage.toJSON(),
      conversation: conversation.toJSON(),
    };
  } else {
    // Last message is assistant: regenerate response without destroying until success
    const previousMessagesDesc = await Message.find({
      conversationId,
      userId,
      _id: { $ne: lastMessage._id },
    })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const previousMessages = previousMessagesDesc.reverse();
    const lastUserMsg = [...previousMessages].reverse().find((m) => m.role === 'user');

    if (!lastUserMsg) {
      throw new ApiError(409, 'NOTHING_TO_RETRY', 'No user prompt found to retry.');
    }

    const { contents, truncated } = await buildConversationContext(
      previousMessages.filter((m) => m._id.toString() !== lastUserMsg._id.toString()),
      lastUserMsg
    );

    const { memoryContext, recentConversationsContext } = await buildMemoryAndChatContext(userId, conversationId);

    const aiReply = await generateReply({
      contents,
      replyLanguage: effectiveLanguage,
      memoryContext,
      recentConversationsContext,
      model,
    });
    const sensitiveTopic = isSensitiveTopic(lastUserMsg.content) || isSensitiveTopic(aiReply.text);

    // Replace old assistant message only after success
    lastMessage.content = aiReply.text;
    lastMessage.metadata = {
      model: aiReply.model,
      finishReason: aiReply.finishReason,
      latencyMs: aiReply.latencyMs,
      usage: aiReply.usage,
      sensitiveTopic,
      contextTruncated: truncated,
      artifacts: typeof savedArtifacts !== 'undefined' ? savedArtifacts : [],
    };
    await lastMessage.save();

    conversation.updatedAt = new Date();
    await conversation.save();

    return {
      assistantMessage: lastMessage.toJSON(),
      conversation: conversation.toJSON(),
    };
  }
}
