import { apiFetch } from './api.js';

export const imageService = {
  /**
   * Generates a new image using Google Gemini Image Studio (Key 2)
   */
  async generate({ prompt, style = 'realistic', aspectRatio = '1:1', conversationId }) {
    const res = await apiFetch('/images/generate', {
      method: 'POST',
      timeoutMs: 120000,
      body: JSON.stringify({
        prompt,
        style,
        aspectRatio,
        conversationId,
      }),
    });
    return res.data;
  },

  /**
   * Fetches user's generated image history
   */
  async getHistory({ page = 1, limit = 20 } = {}) {
    const res = await apiFetch(`/images/history?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
    return res.data;
  },
};

