import { apiFetch } from './api.js';

export const userService = {
  async updateProfile({ name, settings }) {
    const res = await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name, settings }),
    });
    return res.data.user;
  },

  async updatePassword({ currentPassword, newPassword }) {
    await apiFetch('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return true;
  },
};
