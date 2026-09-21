import { apiFetch } from './api.js';

export const memoryService = {
  async list() {
    const res = await apiFetch('/users/me/memories');
    return res.data?.memories || [];
  },

  async create(text) {
    const res = await apiFetch('/users/me/memories', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return res.data?.memory;
  },

  async remove(id) {
    const res = await apiFetch(`/users/me/memories/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async clear() {
    const res = await apiFetch('/users/me/memories', {
      method: 'DELETE',
    });
    return res.data;
  },
};
