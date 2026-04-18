const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const {
  generateInterviewQuestion,
  continueInterview,
  generateFeedback
} = require('../services/openaiService');

// @desc    Start interview - generate first question
// @route   POST /api/chat/start/:interviewId
// @access  Private
const startChat = async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.interviewId,
    user: req.user._id
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  // Get resume text if linked
  let resumeText = '';
  if (interview.resume) {
    const resume = await Resume.findById(interview.resume);
    if (resume) resumeText = resume.rawText;
  }

  // Generate first question
  const firstQuestion = await generateInterviewQuestion(
    interview.role,
    interview.type,
    resumeText,
    interview.difficulty
  );

  // Save to interview messages
  const systemMessage = {
    role: 'system',
    content: `You are conducting a ${interview.type} interview for ${interview.role} (${interview.difficulty} difficulty).${resumeText ? ` Resume context: ${resumeText.substring(0, 500)}` : ''}`
  };

  const assistantMessage = {
    role: 'assistant',
    content: firstQuestion
  };

  interview.messages = [systemMessage, assistantMessage];
  interview.questionsAsked = 1;
  await interview.save();

  res.json({
    success: true,
    message: firstQuestion,
    questionsAsked: interview.questionsAsked
  });
};

// @desc    Send message in interview
// @route   POST /api/chat/message/:interviewId
// @access  Private
const sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    const err = new Error('Message cannot be empty');
    err.statusCode = 400;
    throw err;
  }

  const interview = await Interview.findOne({
    _id: req.params.interviewId,
    user: req.user._id
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  if (interview.status === 'completed') {
    const err = new Error('This interview session has already ended');
    err.statusCode = 400;
    throw err;
  }

  // Add user message
  interview.messages.push({
    role: 'user',
    content: message.trim()
  });

  // Get AI response
  const nonSystemMessages = interview.messages.filter(m => m.role !== 'system');
  const aiResponse = await continueInterview(
    nonSystemMessages,
    interview.role,
    interview.type,
    interview.difficulty
  );

  // Add AI response
  interview.messages.push({
    role: 'assistant',
    content: aiResponse
  });

  // Count questions (rough estimate)
  const questionCount = interview.messages.filter(
    m => m.role === 'assistant' && m.content.includes('?')
  ).length;
  interview.questionsAsked = questionCount;

  await interview.save();

  res.json({
    success: true,
    message: aiResponse,
    questionsAsked: interview.questionsAsked
  });
};

// @desc    End interview and generate feedback
// @route   POST /api/chat/end/:interviewId
// @access  Private
const endInterview = async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.interviewId,
    user: req.user._id
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  if (interview.messages.length < 3) {
    const err = new Error('Interview is too short to generate meaningful feedback');
    err.statusCode = 400;
    throw err;
  }

  // Generate feedback
  const feedback = await generateFeedback(
    interview.messages.filter(m => m.role !== 'system'),
    interview.role,
    interview.type
  );

  interview.feedback = feedback;
  interview.status = 'completed';
  interview.completedAt = new Date();
  interview.duration = Math.round(
    (new Date() - new Date(interview.startedAt)) / 60000
  );

  await interview.save();

  res.json({
    success: true,
    message: 'Interview completed successfully',
    feedback,
    interview
  });
};

// @desc    Get interview messages
// @route   GET /api/chat/messages/:interviewId
// @access  Private
const getMessages = async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.interviewId,
    user: req.user._id
  });

  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404;
    throw err;
  }

  const messages = interview.messages.filter(m => m.role !== 'system');

  res.json({
    success: true,
    messages,
    status: interview.status,
    questionsAsked: interview.questionsAsked
  });
};

module.exports = { startChat, sendMessage, endInterview, getMessages };
