const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpError = require('../utils/httpError');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const normEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const isText = (v) => typeof v === 'string' && v.trim().length > 0;

// Profile skills: short strings only, so one request cannot store megabytes in a user document
const MAX_SKILLS = 30;
const MAX_SKILL_LENGTH = 40;

// @route POST /api/auth/register  (public)
const register = async (req, res) => {
  const { name, password, targetRole, experience } = req.body;
  const email = normEmail(req.body.email);

  if (!isText(name) || !email || !isText(password)) throw httpError(400, 'Please provide name, email, and password');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (targetRole !== undefined && typeof targetRole !== 'string') throw httpError(400, 'targetRole must be text');

  if (await User.exists({ email })) throw httpError(400, 'User already exists with this email');

  const user = await User.create({
    name,
    email,
    password,
    targetRole: targetRole || '',
    experience: experience || 'fresher',
  });

  res.status(201).json({ success: true, message: 'Account created successfully', token: generateToken(user._id), user });
};

// @route POST /api/auth/login  (public)
const login = async (req, res) => {
  const email = normEmail(req.body.email);
  const { password } = req.body;
  if (!email || !isText(password)) throw httpError(400, 'Please provide email and password');

  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password: prevents account enumeration
  if (!user || !(await user.comparePassword(password))) throw httpError(401, 'Invalid email or password');

  res.json({ success: true, message: 'Login successful', token: generateToken(user._id), user });
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const updates = {};
  for (const field of ['name', 'targetRole', 'experience', 'skills']) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.name !== undefined && !isText(updates.name)) throw httpError(400, 'name must be non-empty text');
  if (updates.targetRole !== undefined && typeof updates.targetRole !== 'string') throw httpError(400, 'targetRole must be text');
  if (updates.skills !== undefined) {
    if (!Array.isArray(updates.skills) || updates.skills.some((x) => typeof x !== 'string')) {
      throw httpError(400, 'skills must be a list of text values');
    }
    updates.skills = [...new Set(updates.skills.map((x) => x.trim()).filter(Boolean))];
    if (updates.skills.length > MAX_SKILLS) throw httpError(400, `You can list at most ${MAX_SKILLS} skills`);
    if (updates.skills.some((x) => x.length > MAX_SKILL_LENGTH)) {
      throw httpError(400, `Each skill can be at most ${MAX_SKILL_LENGTH} characters`);
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated successfully', user });
};

// @route PUT /api/auth/password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!isText(currentPassword) || !isText(newPassword)) throw httpError(400, 'Current and new password are required');
  if (newPassword.length < 6) throw httpError(400, 'New password must be at least 6 characters');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw httpError(400, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  // Older tokens (other devices, a stolen token) stop working; this session gets a fresh one
  res.json({ success: true, message: 'Password changed successfully', token: generateToken(user._id) });
};

module.exports = { register, login, getMe, updateProfile, changePassword };
