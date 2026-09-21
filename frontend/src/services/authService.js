import { apiFetch } from './api.js';

export const authService = {
  async register({ name, email, password, confirmPassword, rememberMe }) {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword, rememberMe }),
    });
    return res.data.user;
  },

  async login({ email, password, rememberMe }) {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    return res.data.user;
  },

  async googleLogin(credential, rememberMe = false) {
    const res = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, rememberMe }),
    });
    return res.data;
  },

  async logout() {
    await apiFetch('/auth/logout', {
      method: 'POST',
    });
  },

  async getMe() {
    const res = await apiFetch('/auth/me', {
      method: 'GET',
    });
    return res.data.user;
  },
};
