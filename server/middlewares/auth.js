const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpError = require('../utils/httpError');

// Verifies the Bearer token and attaches the user (without password) to req.user
const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(httpError(401, 'Not authorized. No token provided.'));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(httpError(401, 'Not authorized. Invalid or expired token.'));
  }

  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) return next(httpError(401, 'User not found.'));
  if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
    return next(httpError(401, 'Your password was changed. Please log in again.'));
  }
  user.passwordChangedAt = undefined; // internal; never sent to the client
  req.user = user;
  return next();
};

module.exports = { protect };
