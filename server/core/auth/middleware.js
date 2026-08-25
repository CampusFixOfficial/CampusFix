// =============================================================
// CampusFix - JWT Authentication Middleware
// =============================================================
// Protects routes by checking if the user has a valid JWT token.
// Also provides role-based access control (student/staff/admin).
// Owner: Bhavishya (authentication)
// =============================================================

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('../../config/env');

// ---- Main auth middleware: verifies JWT token ----
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in the Authorization header
    // Format: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized — please log in',
      });
    }

    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Find the user and attach to the request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account has been deactivated',
      });
    }

    // Attach user to the request so route handlers can access it
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized — invalid or expired token',
    });
  }
};

// ---- Role-based access: only allow specific roles ----
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied — requires ${roles.join(' or ')} role`,
      });
    }
    next();
  };
};

// Convenience helpers
const studentOnly = authorize('student');
const staffOnly = authorize('staff');
const adminOnly = authorize('admin');
const staffOrAdmin = authorize('staff', 'admin');

module.exports = {
  protect,
  authorize,
  studentOnly,
  staffOnly,
  adminOnly,
  staffOrAdmin,
};
