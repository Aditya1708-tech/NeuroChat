import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateToken(userId, tokenVersion, rememberMe = false) {
  const expiresIn = rememberMe ? env.JWT_EXPIRES_LONG : env.JWT_EXPIRES_SHORT;
  return jwt.sign(
    {
      sub: userId.toString(),
      tv: tokenVersion,
    },
    env.JWT_SECRET,
    { expiresIn }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}
