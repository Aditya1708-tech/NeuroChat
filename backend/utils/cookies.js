import { env } from '../config/env.js';

export const COOKIE_NAME = 'nc_token';

export function getCookieOptions(rememberMe = false) {
  const isProd = env.NODE_ENV === 'production';

  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };

  if (rememberMe) {
    options.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  return options;
}

export function setSessionCookie(res, token, rememberMe = false) {
  res.cookie(COOKIE_NAME, token, getCookieOptions(rememberMe));
}

export function clearSessionCookie(res) {
  const isProd = env.NODE_ENV === 'production';

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}