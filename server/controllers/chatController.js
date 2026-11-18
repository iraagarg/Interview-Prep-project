const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const httpError = require('../utils/httpError');
const { recalcUserStats } = require('../services/statsService');
const { generateInterviewQuestion, continueInterview, generateFeedback } = require('../services/aiService');

const MAX_ANSWER_CHARS = 4000;

const findOwned = async (req) => {
  const interview = await Interview.findOne({ _id: req.params.interviewId, user: req.user._id });
  if (!interview) throw httpError(404, 'Interview not found');
  return interview;
};

const visible = (messages) => messages.filter((m) => m.role !== 'system');
const countQuestions = (messages) => messages.filter((m) => m.role === 'assistant').length;

// @route POST /api/chat/start/:interviewId
const startChat = async (req, res) => {
  const interview = await findOwned(req);
  if (interview.status !== 'active') throw httpError(400, `This interview is already ${interview.status}`);

  // Idempotent: a double click or page refresh must not generate a second opening question
  const firstQuestion = visible(interview.messages).find((m) => m.role === 'assistant');
  if (firstQuestion) {
    return res.json({ success: true, message: firstQuestion.content, questionsAsked: interview.questionsAsked });
  }

  let resumeText = '';
  if (interview.resume) {
    const resume = await Resume.findOne({ _id: interview.resume, user: req.user._id });
    if (resume) resumeText = resume.rawText;
  }

  const question = await generateInterviewQuestion(interview.role, interview.type, resumeText, interview.difficulty);

  interview.messages = [
    {
      role: 'system',
      content: `${interview.type} interview for ${interview.role} (${interview.difficulty})${resumeText ? ', resume linked' : ''}`,
    },
    { role: 'assistant', content: question },
  ];
  interview.questionsAsked = 1;
  interview.startedAt = new Date();
  await interview.save();

  return res.json({ success: true, message: question, questionsAsked: interview.questionsAsked });
};

// @route POST /api/chat/message/:interviewId
const sendMessage = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) throw httpError(400, 'Message cannot be empty');
  if (message.length > MAX_ANSWER_CHARS) throw httpError(400, `Answer is too long (max ${MAX_ANSWER_CHARS} characters)`);

  const interview = await findOwned(req);
  if (interview.status !== 'active') throw httpError(400, 'This interview session has already ended');
  if (!visible(interview.messages).length) throw httpError(400, 'Start the interview before answering');

  interview.messages.push({ role: 'user', content: message });

  const reply = await continueInterview(visible(interview.messages), interview.role, interview.type, interview.difficulty);
  interview.messages.push({ role: 'assistant', content: reply });
  interview.questionsAsked = countQuestions(interview.messages); // one question per interviewer turn (enforced by prompt)

  await interview.save();
  res.json({ success: true, message: reply, questionsAsked: interview.questionsAsked });
};

// @route POST /api/chat/end/:interviewId
const endInterview = async (req, res) => {
  const interview = await findOwned(req);

  // Idempotent: ending twice returns the stored feedback instead of paying for a second evaluation
  if (interview.status === 'completed') {
    return res.json({ success: true, message: 'Interview already completed', feedback: interview.feedback, interview });
  }
  if (interview.status === 'abandoned') throw httpError(400, 'This interview was abandoned');

  const answers = interview.messages.filter((m) => m.role === 'user').length;
  if (answers < 1) throw httpError(400, 'Answer at least one question to receive feedback');

  const feedback = await generateFeedback(visible(interview.messages), interview.role, interview.type);

  interview.feedback = feedback;
  interview.status = 'completed';
  interview.completedAt = new Date();
  interview.duration = Math.max(1, Math.round((interview.completedAt - new Date(interview.startedAt)) / 60000));
  await interview.save();
  await recalcUserStats(req.user._id);

  return res.json({ success: true, message: 'Interview completed successfully', feedback, interview });
};

// @route GET /api/chat/messages/:interviewId
const getMessages = async (req, res) => {
  const interview = await findOwned(req);
  res.json({
    success: true,
    messages: visible(interview.messages),
    status: interview.status,
    questionsAsked: interview.questionsAsked,
  });
};

module.exports = { startChat, sendMessage, endInterview, getMessages };
