const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    // Read Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to request
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired token'
    });
  }
};

module.exports = { protect };
