import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { extractNameFromEmail } from './google.service.js';

const DUMMY_HASH = '$2b$12$e8YnZfQ71hL7uO5Z.3C/q.4iMszkcmRk9z0Q5k6B7zK.H3sX8s8yq';

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (existing) {
    // If account was created with Google and doesn't have a password yet, add password and enable local login
    if (existing.authProviders.includes('google') && !existing.passwordHash) {
      const salt = await bcrypt.genSalt(12);
      existing.passwordHash = await bcrypt.hash(password, salt);
      if (!existing.authProviders.includes('local')) {
        existing.authProviders.push('local');
      }
      if (name && (!existing.name || existing.name === 'Google User')) {
        existing.name = name.trim();
      }
      existing.lastLoginAt = new Date();
      await existing.save();
      return existing;
    }

    throw new ApiError(
      409,
      'EMAIL_IN_USE',
      'An account with this email already exists. Please log in directly.',
      { email: 'Email is already registered.' }
    );
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    authProviders: ['local'],
    emailVerified: false,
    lastLoginAt: new Date(),
  });

  return user;
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    // Constant-time defense against user enumeration via response timing
    await bcrypt.compare(password, DUMMY_HASH);
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }

  if (!user.passwordHash) {
    // User signed up with Google but hasn't set a password yet
    throw new ApiError(
      400,
      'PASSWORD_NOT_SET',
      'This account was created with Google. Please log in with Google, or register this email to set a password.'
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return user;
}

export async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'User profile not found.');
  }
  if (!user.name || user.name === 'Google User' || user.name === 'Google Demo User') {
    user.name = extractNameFromEmail(user.email);
    await user.save();
  }
  return user;
}

export async function updateUserProfile(userId, { name, settings }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'User not found.');
  }

  if (name !== undefined) {
    user.name = name.trim();
  }

  if (settings) {
    user.settings = {
      ...user.settings.toObject(),
      ...settings,
    };
  }

  await user.save();
  return user;
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'User not found.');
  }

  // If user already had a password, require current password
  if (user.passwordHash) {
    if (!currentPassword) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Current password is required.', {
        currentPassword: 'Enter current password.',
      });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.');
    }
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  if (!user.authProviders.includes('local')) {
    user.authProviders.push('local');
  }
  // Invalidate older session tokens
  user.tokenVersion = (user.tokenVersion || 0) + 1;

  await user.save();
  return user;
}
