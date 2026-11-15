/**
 * Resolves the API base URL intelligently:
 * - If running locally on localhost/127.0.0.1, routes through Vite's local proxy `/api` -> http://localhost:5001
 *   (avoids sleeping Render containers and cold starts on local dev!)
 * - If deployed (e.g. on Vercel), uses VITE_API_BASE_URL (ensuring the /api prefix is present)
 */
function resolveBaseUrl() {
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocal && !import.meta.env.VITE_FORCE_REMOTE) {
      return '/api';
    }
  }

  const rawUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
  if (rawUrl.startsWith('http') && !rawUrl.endsWith('/api')) {
    return `${rawUrl}/api`;
  }
  return rawUrl || '/api';
}

const BASE_URL = resolveBaseUrl();

/**
 * Custom fetch wrapper per spec §24.1 and §15.7
 * Handles JSON serialization, httpOnly credentials, timeouts, and 401 session expiry.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const timeoutMs = options.timeoutMs || 180000; // 3 minutes default for AI generation with documents

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const config = {
    ...options,
    signal: options.signal || controller.signal,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include httpOnly nc_token cookie
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timer);

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If unauthenticated (401) on non-login/register endpoints, dispatch session-expired event
      if (
        response.status === 401 &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register') &&
        !endpoint.includes('/auth/google')
      ) {
        window.dispatchEvent(new CustomEvent('neurochat:session-expired'));
      }

      const error = new Error(json?.error?.message || 'A network error occurred.');
      error.status = response.status;
      error.code = json?.error?.code || 'UNKNOWN_ERROR';
      error.fields = json?.error?.fields || null;
      error.retryable = json?.error?.retryable || false;
      error.savedData = json?.data || null;
      throw error;
    }

    return json;
  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please check your connection and try again.');
      timeoutErr.code = 'TIMEOUT';
      timeoutErr.retryable = true;
      throw timeoutErr;
    }

    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netErr = new Error("Couldn't reach NeuroChat. Check your connection and try again.");
      netErr.code = 'NETWORK_ERROR';
      netErr.retryable = true;
      throw netErr;
    }

    throw err;
  }
}
