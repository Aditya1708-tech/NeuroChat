const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Custom fetch wrapper per spec §24.1 and §15.7
 * Handles JSON serialization, httpOnly credentials, and 401 session expiry.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include httpOnly nc_token cookie
  };

  try {
    const response = await fetch(url, config);

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
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netErr = new Error("Couldn't reach NeuroChat. Check your connection and try again.");
      netErr.code = 'NETWORK_ERROR';
      netErr.retryable = true;
      throw netErr;
    }
    
    throw err;
  }
}
