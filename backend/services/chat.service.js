import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateConversationTitle, fallbackTitle } from './title.service.js';
import { buildConversationContext } from './context.service.js';
import { generateReply } from './ai.service.js';
import { buildMemoryAndChatContext, extractAndSaveMemories } from './memory.service.js';
import { isSensitiveTopic } from '../utils/sensitiveTopics.js';
import { logger } from '../utils/logger.js';

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

  // Reverse to chronological order
  const messages = messagesDesc.reverse().map((msg) => ({
    id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    role: msg.role,
    content: msg.content,
    attachment: msg.attachment || null,
    createdAt: msg.createdAt,
    metadata: msg.metadata || {},
  }));

  return { messages, hasMore };
}

export async function sendMessage(userId, conversationId, { content = '', language, attachment }) {
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
  const { contents, truncated } = buildConversationContext(recentHistory, {
    role: 'user',
    content: (content || '').trim(),
    attachment: attachment || undefined,
  });

  // 4b. Fetch long-term memory profile & past conversation directory for cross-chat awareness
  const { memoryContext, recentConversationsContext } = await buildMemoryAndChatContext(userId, conversationId);

  // 5. Call AI service directly without waiting for title generation
  let aiReply;
  try {
    aiReply = await generateReply({
      contents,
      replyLanguage: effectiveLanguage,
      memoryContext,
      recentConversationsContext,
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

  // 7. Save assistant message
  const assistantMessageDoc = await Message.create({
    conversationId,
    userId,
    role: 'assistant',
    content: aiReply.text,
    metadata: {
      model: aiReply.model,
      finishReason: aiReply.finishReason,
      latencyMs: aiReply.latencyMs,
      usage: aiReply.usage,
      sensitiveTopic,
      contextTruncated: truncated,
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
      sensitiveTopic,
    },
  };
}

export async function retryMessage(userId, conversationId) {
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
    const { contents, truncated } = buildConversationContext(recentHistory, {
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
    });
    const sensitiveTopic = isSensitiveTopic(lastMessage.content) || isSensitiveTopic(aiReply.text);

    const assistantMessage = await Message.create({
      conversationId,
      userId,
      role: 'assistant',
      content: aiReply.text,
      metadata: {
        model: aiReply.model,
        finishReason: aiReply.finishReason,
        latencyMs: aiReply.latencyMs,
        usage: aiReply.usage,
        sensitiveTopic,
        contextTruncated: truncated,
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

    const { contents, truncated } = buildConversationContext(
      previousMessages.filter((m) => m._id.toString() !== lastUserMsg._id.toString()),
      lastUserMsg
    );

    const { memoryContext, recentConversationsContext } = await buildMemoryAndChatContext(userId, conversationId);

    const aiReply = await generateReply({
      contents,
      replyLanguage: effectiveLanguage,
      memoryContext,
      recentConversationsContext,
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
