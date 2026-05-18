const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────
// PROTECT — verifies access token on every
// protected route call
// ─────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  // Extract Bearer token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'NO_TOKEN',
      message: 'No token provided. Please login.',
    });
  }

  try {
    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    // Token expired → tell frontend to try refresh
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired. Please refresh.',
      });
    }

    // Token tampered / invalid
    return res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID',
      message: 'Invalid token. Please login again.',
    });
  }
};

// ─────────────────────────────────────────
// AUTHORIZE — role-based access control
// Usage: authorize('recruiter') or
//        authorize('admin', 'recruiter')
// ─────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Access denied. Only [${roles.join(', ')}] can perform this action.`,
      });
    }
    next();
  };
};

// ─────────────────────────────────────────
// OPTIONAL AUTH — attaches user if token
// present but doesn't block if missing
// (used for public routes that personalize)
// ─────────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(); // No token? Continue as guest

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    // Invalid token on optional route — just continue as guest
  }
  next();
};

module.exports = { protect, authorize, optionalAuth };
