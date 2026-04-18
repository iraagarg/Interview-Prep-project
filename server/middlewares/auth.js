const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const err = new Error('Not authorized. No token provided.');
    err.statusCode = 401;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      const err = new Error('User not found.');
      err.statusCode = 401;
      return next(err);
    }

    next();
  } catch (error) {
    const err = new Error('Not authorized. Invalid token.');
    err.statusCode = 401;
    return next(err);
  }
};

module.exports = { protect };
