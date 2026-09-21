import {
  registerUser,
  loginUser,
  getUserProfile,
} from '../services/auth.service.js';
import { authenticateGoogleUser } from '../services/google.service.js';
import { generateToken } from '../utils/tokens.js';
import { setSessionCookie, clearSessionCookie } from '../utils/cookies.js';

export async function register(req, res) {
  const { name, email, password, rememberMe } = req.body;
  const user = await registerUser({ name, email, password });

  const token = generateToken(user._id, user.tokenVersion, rememberMe);
  setSessionCookie(res, token, rememberMe);

  res.status(201).json({
    success: true,
    data: { user: user.toJSON() },
  });
}

export async function login(req, res) {
  const { email, password, rememberMe } = req.body;
  const user = await loginUser({ email, password });

  const token = generateToken(user._id, user.tokenVersion, rememberMe);
  setSessionCookie(res, token, rememberMe);

  res.status(200).json({
    success: true,
    data: { user: user.toJSON() },
  });
}

export async function googleAuth(req, res) {
  const { credential, rememberMe } = req.body;
  const { user, isNewUser } = await authenticateGoogleUser(credential);

  const token = generateToken(user._id, user.tokenVersion, rememberMe);
  setSessionCookie(res, token, rememberMe);

  res.status(200).json({
    success: true,
    data: { user: user.toJSON(), isNewUser },
  });
}

export async function logout(req, res) {
  clearSessionCookie(res);
  res.status(204).end();
}

export async function me(req, res) {
  const user = await getUserProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: { user: user.toJSON() },
  });
}
