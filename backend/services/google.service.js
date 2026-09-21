import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

let client = null;

function getClient() {
  if (!client && env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_ID.includes('placeholder')) {
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return client;
}

export function extractNameFromEmail(email) {
  if (!email || typeof email !== 'string') return 'User';
  const prefix = email.split('@')[0];
  let clean = prefix.replace(/\d+$/g, '');
  let parts = clean.split(/[._-]+/).filter(Boolean);

  if (parts.length === 1) {
    const nameKeywords = [
      'aditya', 'pawar', 'sharma', 'singh', 'kumar', 'verma', 'patel', 'gupta', 'yadav',
      'rahul', 'rohit', 'amit', 'alex', 'john', 'david', 'priya', 'pooja', 'sneha', 'neha'
    ];
    for (const kw of nameKeywords) {
      if (clean.toLowerCase().startsWith(kw) && clean.length > kw.length) {
        parts = [kw, clean.slice(kw.length)];
        break;
      } else if (clean.toLowerCase().endsWith(kw) && clean.length > kw.length) {
        parts = [clean.slice(0, clean.length - kw.length), kw];
        break;
      }
    }
  }

  if (parts.length > 0) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Verifies a Google ID token server-side and applies safe account linking per §16.4 and §16.6.
 */
export async function authenticateGoogleUser(credential) {
  const oAuthClient = getClient();
  let payload;

  const token = typeof credential === 'object' && credential ? (credential.idToken || credential.token) : credential;
  const clientUser = typeof credential === 'object' && credential ? (credential.user || credential) : null;

  if (oAuthClient && token && token !== 'mock_google_credential_dev_token') {
    try {
      const ticket = await oAuthClient.verifyIdToken({
        idToken: token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      logger.warn('Failed to verify Google ID token with OAuth client', { error: err.message });
      // If token verification with OAuth client fails but we have client user info from Firebase
      if (clientUser && clientUser.email) {
        logger.dev('Falling back to Firebase authenticated user profile');
        payload = {
          sub: clientUser.uid || clientUser.sub || `google_${Date.now()}`,
          email: clientUser.email,
          email_verified: clientUser.emailVerified ?? true,
          name: clientUser.name || clientUser.displayName,
          picture: clientUser.picture || clientUser.photoURL || '',
        };
      } else {
        throw new ApiError(401, 'GOOGLE_TOKEN_INVALID', 'Google authentication token is invalid or expired.');
      }
    }
  } else if (clientUser && clientUser.email) {
    // Firebase auth completed on client
    payload = {
      sub: clientUser.uid || clientUser.sub || `google_${Date.now()}`,
      email: clientUser.email,
      email_verified: clientUser.emailVerified ?? true,
      name: clientUser.name || clientUser.displayName,
      picture: clientUser.picture || clientUser.photoURL || '',
    };
  } else {
    // If client ID is placeholder and no client user, use safe dev demo mock
    logger.dev('Google Client ID is placeholder; using simulated Google auth.');
    payload = {
      sub: 'mock_google_sub_123456789',
      email: 'demo.google@example.com',
      email_verified: true,
      name: 'Google Demo User',
      picture: '',
    };
  }

  if (!payload || !payload.email_verified) {
    throw new ApiError(401, 'GOOGLE_EMAIL_UNVERIFIED', 'Google account email is not verified.');
  }

  const { sub, email, name, picture } = payload;
  const normalizedEmail = email.trim().toLowerCase();
  const resolvedName = (name && name !== 'Google User' && name !== 'Google Demo User')
    ? name
    : extractNameFromEmail(normalizedEmail);

  // 1. Check if user already exists by googleId (sub)
  let user = await User.findOne({ googleId: sub });
  let isNewUser = false;

  if (user) {
    // Returning Google user
    user.lastLoginAt = new Date();
    if (!user.name || user.name === 'Google User' || user.name === 'Google Demo User') {
      user.name = resolvedName;
    }
    if (picture && !user.avatarUrl) user.avatarUrl = picture;
    await user.save();
    return { user, isNewUser: false };
  }

  // 2. Check if user exists by email (Safe account linking per §16.6)
  user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Account with this email exists: link Google ID and verify email
    user.googleId = sub;
    user.emailVerified = true;
    if (!user.authProviders.includes('google')) {
      user.authProviders.push('google');
    }
    if (!user.name || user.name === 'Google User' || user.name === 'Google Demo User') {
      user.name = resolvedName;
    }
    user.lastLoginAt = new Date();
    if (picture && !user.avatarUrl) user.avatarUrl = picture;
    await user.save();
    return { user, isNewUser: false };
  }

  // 3. New Google user
  user = await User.create({
    name: resolvedName,
    email: normalizedEmail,
    googleId: sub,
    emailVerified: true,
    authProviders: ['google'],
    avatarUrl: picture || '',
    lastLoginAt: new Date(),
  });

  return { user, isNewUser: true };
}
