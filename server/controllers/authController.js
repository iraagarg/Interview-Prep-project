const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpError = require('../utils/httpError');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const normEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

// @route POST /api/auth/register  (public)
const register = async (req, res) => {
  const { name, password, targetRole, experience } = req.body;
  const email = normEmail(req.body.email);

  if (!name || !email || !password) throw httpError(400, 'Please provide name, email, and password');
  if (String(password).length < 6) throw httpError(400, 'Password must be at least 6 characters');

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
  if (!email || !password) throw httpError(400, 'Please provide email and password');

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
  if (updates.skills && !Array.isArray(updates.skills)) throw httpError(400, 'skills must be an array');

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated successfully', user });
};

// @route PUT /api/auth/password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw httpError(400, 'Current and new password are required');
  if (String(newPassword).length < 6) throw httpError(400, 'New password must be at least 6 characters');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw httpError(400, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
};

module.exports = { register, login, getMe, updateProfile, changePassword };
