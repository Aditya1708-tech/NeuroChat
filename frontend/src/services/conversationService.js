import { apiFetch } from './api.js';

export const conversationService = {
  async create(title = 'New chat') {
    const res = await apiFetch('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    return res.data.conversation;
  },

  async list({ limit = 20, cursor, search, searchIn = 'titles' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (cursor) params.set('cursor', cursor);
    if (search) params.set('search', search);
    if (searchIn) params.set('searchIn', searchIn);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/conversations${queryString}`);
    return {
      conversations: res.data.conversations,
      nextCursor: res.meta?.nextCursor,
    };
  },

  async getById(id) {
    const res = await apiFetch(`/conversations/${id}`);
    return res.data.conversation;
  },

  async rename(id, title) {
    const res = await apiFetch(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    return res.data.conversation;
  },

  async delete(id) {
    await apiFetch(`/conversations/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
