import { verifyToken } from '../utils/tokens.js';
import { clearSessionCookie } from '../utils/cookies.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.nc_token;

  if (!token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  }

  const payload = verifyToken(token);
  if (!payload || !payload.sub) {
    clearSessionCookie(res);
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Session expired or invalid token.'));
  }

  try {
    const user = await User.findById(payload.sub).select('_id name email tokenVersion');
    if (!user) {
      clearSessionCookie(res);
      return next(new ApiError(401, 'UNAUTHENTICATED', 'User no longer exists.'));
    }

    if (payload.tv !== user.tokenVersion) {
      clearSessionCookie(res);
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Session revoked. Please log in again.'));
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (err) {
    next(err);
  }
}
