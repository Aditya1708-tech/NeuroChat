import { apiFetch } from './api.js';

export const messageService = {
  async list(conversationId, { limit = 50, before } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (before) params.set('before', before);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`/conversations/${conversationId}/messages${queryString}`);
    return {
      messages: res.data.messages,
      hasMore: res.meta?.hasMore,
    };
  },

  async send(conversationId, content, language, attachment) {
    const res = await apiFetch(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, language, attachment }),
    });
    return res;
  },

  async retry(conversationId) {
    const res = await apiFetch(`/conversations/${conversationId}/messages/retry`, {
      method: 'POST',
    });
    return res.data;
  },
};
