import {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from '../services/conversation.service.js';

export async function create(req, res) {
  const { title } = req.body;
  const conversation = await createConversation(req.user.id, { title });

  res.status(201).json({
    success: true,
    data: { conversation: conversation.toJSON() },
  });
}

export async function list(req, res) {
  const { limit, cursor, search, searchIn } = req.query;
  const result = await listConversations(req.user.id, {
    limit,
    cursor,
    search,
    searchIn,
  });

  res.status(200).json({
    success: true,
    data: { conversations: result.conversations },
    meta: { nextCursor: result.nextCursor },
  });
}

export async function getById(req, res) {
  const conversation = await getConversation(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    data: { conversation: conversation.toJSON() },
  });
}

export async function updateTitle(req, res) {
  const { title } = req.body;
  const conversation = await updateConversation(req.user.id, req.params.id, { title });

  res.status(200).json({
    success: true,
    data: { conversation: conversation.toJSON() },
  });
}

export async function remove(req, res) {
  await deleteConversation(req.user.id, req.params.id);
  res.status(204).end();
}
