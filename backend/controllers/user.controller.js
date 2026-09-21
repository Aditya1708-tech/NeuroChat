import {
  updateUserProfile,
  changePassword,
} from '../services/auth.service.js';
import { generateToken } from '../utils/tokens.js';
import { setSessionCookie } from '../utils/cookies.js';

export async function updateProfile(req, res) {
  const { name, settings } = req.body;
  const user = await updateUserProfile(req.user.id, { name, settings });

  res.status(200).json({
    success: true,
    data: { user: user.toJSON() },
  });
}

export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await changePassword(req.user.id, { currentPassword, newPassword });

  // Re-issue cookie with updated tokenVersion
  const token = generateToken(user._id, user.tokenVersion, true);
  setSessionCookie(res, token, true);

  res.status(204).end();
}

import {
  getUserMemories,
  addMemory,
  deleteMemory,
  clearMemories,
} from '../services/memory.service.js';

export async function listMemories(req, res) {
  const memories = await getUserMemories(req.user.id);
  res.status(200).json({
    success: true,
    data: { memories },
  });
}

export async function createMemory(req, res) {
  const { text } = req.body;
  const memory = await addMemory(req.user.id, text);
  res.status(201).json({
    success: true,
    data: { memory },
  });
}

export async function removeMemory(req, res) {
  await deleteMemory(req.user.id, req.params.id);
  res.status(200).json({
    success: true,
    data: { id: req.params.id },
  });
}

export async function removeAllMemories(req, res) {
  await clearMemories(req.user.id);
  res.status(200).json({
    success: true,
    data: { cleared: true },
  });
}
