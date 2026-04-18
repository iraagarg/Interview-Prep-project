const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const User = require('../models/User');

// @desc    Create new interview session
// @route   POST /api/interview
// @access  Private
const createInterview = async (req, res) => {
  const { role, type, difficulty, resumeId } = req.body;

  const interview = await Interview.create({
    user: req.user._id,
    resume: resumeId || null,
    role: role || req.user.targetRole || 'Software Engineer',
    type: type || 'mixed',
    difficulty: difficulty || 'medium',
    title: `${role || 'Software Engineer'} - ${new Date().toLocaleDateString()}`
  });

  res.status(201).json({
    success: true,
    message: 'Interview session created',
    interview
  });
};

// @desc    Get all user interviews
// @route   GET /api/interview
// @access  Private
const getInterviews = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Interview.countDocuments({ user: req.user._id });
  const interviews = await Interview.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-messages');

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    interviews
  });
};

// @desc    Get single interview
// @route   GET /api/interview/:id
// @access  Private
const getInterview = async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  res.json({ success: true, interview });
};

// @desc    Complete interview & generate feedback
// @route   PUT /api/interview/:id/complete
// @access  Private
const completeInterview = async (req, res) => {
  const { feedback } = req.body;

  const interview = await Interview.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  interview.status = 'completed';
  interview.completedAt = new Date();
  interview.feedback = feedback || interview.feedback;

  // Calculate duration in minutes
  if (interview.startedAt) {
    interview.duration = Math.round(
      (new Date() - new Date(interview.startedAt)) / 60000
    );
  }

  await interview.save();

  // Update user stats
  const user = await User.findById(req.user._id);
  user.totalInterviews += 1;

  // Recalculate average score
  const completedInterviews = await Interview.find({
    user: req.user._id,
    status: 'completed'
  }).select('feedback.overallScore');

  const totalScore = completedInterviews.reduce(
    (acc, iv) => acc + (iv.feedback.overallScore || 0),
    0
  );
  user.averageScore = Math.round(totalScore / completedInterviews.length);
  await user.save();

  res.json({
    success: true,
    message: 'Interview completed',
    interview
  });
};

// @desc    Delete interview
// @route   DELETE /api/interview/:id
// @access  Private
const deleteInterview = async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  await interview.deleteOne();
  res.json({ success: true, message: 'Interview deleted' });
};

module.exports = {
  createInterview,
  getInterviews,
  getInterview,
  completeInterview,
  deleteInterview
};
