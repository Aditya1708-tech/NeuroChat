import {
  listMessages,
  sendMessage,
  retryMessage,
} from '../services/chat.service.js';

export async function list(req, res) {
  const { limit, before } = req.query;
  const result = await listMessages(req.user.id, req.params.id, { limit, before });

  res.status(200).json({
    success: true,
    data: { messages: result.messages },
    meta: { hasMore: result.hasMore },
  });
}

export async function send(req, res) {
  const { content, language, attachment } = req.body;
  const result = await sendMessage(req.user.id, req.params.id, { content, language, attachment });

  res.status(201).json({
    success: true,
    data: {
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      conversation: result.conversation,
    },
    meta: result.meta,
  });
}

export async function retry(req, res) {
  const result = await retryMessage(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    data: {
      assistantMessage: result.assistantMessage,
      conversation: result.conversation,
    },
  });
}
