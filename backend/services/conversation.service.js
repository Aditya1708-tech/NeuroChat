import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export async function createConversation(userId, { title = 'New chat' } = {}) {
  const conversation = await Conversation.create({
    userId,
    title: title.trim() || 'New chat',
  });
  return conversation;
}

export async function listConversations(userId, { limit = 20, cursor, search, searchIn = 'titles' } = {}) {
  const query = { userId };

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    if (searchIn === 'messages') {
      // Find matching conversation IDs from messages text index
      const matchedMessages = await Message.find(
        { userId, $text: { $search: search.trim() } },
        { conversationId: 1 }
      ).limit(100);
      const matchedConvIds = [...new Set(matchedMessages.map((m) => m.conversationId.toString()))];
      query._id = { $in: matchedConvIds };
    } else {
      query.title = { $regex: new RegExp(escaped, 'i') };
    }
  }

  if (cursor) {
    try {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.updatedAt = { $lt: cursorDate };
      }
    } catch {
      // Ignore invalid cursor date
    }
  }

  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const items = await Conversation.find(query)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(limitNumber + 1)
    .lean();

  let nextCursor = null;
  if (items.length > limitNumber) {
    const nextItem = items.pop();
    nextCursor = nextItem.updatedAt.toISOString();
  }

  const conversations = items.map((item) => ({
    id: item._id.toString(),
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return { conversations, nextCursor };
}

export async function getConversation(userId, conversationId) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new ApiError(404, 'NOT_FOUND', 'Conversation not found.');
  }

  return conversation;
}

export async function updateConversation(userId, conversationId, { title }) {
  const conversation = await getConversation(userId, conversationId);
  conversation.title = title.trim();
  await conversation.save();
  return conversation;
}

export async function deleteConversation(userId, conversationId) {
  const conversation = await getConversation(userId, conversationId);

  // Cascade delete all messages belonging to this conversation
  await Message.deleteMany({ conversationId, userId });
  await Conversation.deleteOne({ _id: conversation._id, userId });

  return true;
}
