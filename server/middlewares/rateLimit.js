const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';
const json = (message) => ({ success: false, message });

// Brute-force protection for login / register (per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTest,
  message: json('Too many attempts. Please try again in 15 minutes.'),
});

// Protects the LLM quota: AI calls are the expensive part of the system (per user)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : rateLimit.ipKeyGenerator(req.ip)),
  skip: () => isTest,
  message: json('You are sending answers too quickly. Please wait a moment.'),
});

module.exports = { authLimiter, aiLimiter };
