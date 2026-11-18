const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const httpError = require('../utils/httpError');
const { recalcUserStats } = require('../services/statsService');

const TYPES = ['technical', 'hr', 'mixed'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// @route POST /api/interview
const createInterview = async (req, res) => {
  const { type = 'mixed', difficulty = 'medium', resumeId } = req.body;
  const role = (req.body.role || req.user.targetRole || 'Software Engineer').toString().trim();

  if (!TYPES.includes(type)) throw httpError(400, `type must be one of: ${TYPES.join(', ')}`);
  if (!DIFFICULTIES.includes(difficulty)) throw httpError(400, `difficulty must be one of: ${DIFFICULTIES.join(', ')}`);

  // A linked resume must belong to the same user
  if (resumeId && !(await Resume.exists({ _id: resumeId, user: req.user._id }))) {
    throw httpError(404, 'Resume not found');
  }

  const interview = await Interview.create({
    user: req.user._id,
    resume: resumeId || null,
    role,
    type,
    difficulty,
    title: `${role} - ${new Date().toLocaleDateString('en-IN')}`,
  });

  res.status(201).json({ success: true, message: 'Interview session created', interview });
};

// @route GET /api/interview?page=&limit=
const getInterviews = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const filter = { user: req.user._id };

  const [total, interviews] = await Promise.all([
    Interview.countDocuments(filter),
    Interview.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-messages'),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), interviews });
};

// @route GET /api/interview/:id
const getInterview = async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) throw httpError(404, 'Interview not found');
  res.json({ success: true, interview });
};

// @route PUT /api/interview/:id/abandon
// Scores are only ever written by the server (POST /api/chat/end), never accepted from the client.
const abandonInterview = async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  if (!interview) throw httpError(404, 'Interview not found');
  if (interview.status !== 'active') throw httpError(400, `Interview is already ${interview.status}`);

  interview.status = 'abandoned';
  interview.completedAt = new Date();
  await interview.save();
  res.json({ success: true, message: 'Interview abandoned', interview });
};

// @route DELETE /api/interview/:id
const deleteInterview = async (req, res) => {
  const interview = await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!interview) throw httpError(404, 'Interview not found');
  if (interview.status === 'completed') await recalcUserStats(req.user._id);
  res.json({ success: true, message: 'Interview deleted' });
};

module.exports = { createInterview, getInterviews, getInterview, abandonInterview, deleteInterview };
