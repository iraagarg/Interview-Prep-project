const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const httpError = require('../utils/httpError');
const { recalcUserStats } = require('../services/statsService');
const { generateInterviewQuestion, continueInterview, generateFeedback } = require('../services/aiService');

const MAX_ANSWER_CHARS = 4000;
const MAX_ANSWERS = 30; // keeps documents and model context bounded

const findOwned = async (req) => {
  const interview = await Interview.findOne({ _id: req.params.interviewId, user: req.user._id });
  if (!interview) throw httpError(404, 'Interview not found');
  return interview;
};

const visible = (messages) => messages.filter((m) => m.role !== 'system');

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

  // Conditional write: if a concurrent request already stored an opening question, keep that one
  const started = await Interview.findOneAndUpdate(
    { _id: interview._id, user: req.user._id, status: 'active', questionsAsked: 0 },
    {
      $set: {
        messages: [
          {
            role: 'system',
            content: `${interview.type} interview for ${interview.role} (${interview.difficulty})${resumeText ? ', resume linked' : ''}`,
          },
          { role: 'assistant', content: question },
        ],
        questionsAsked: 1,
        startedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!started) {
    const current = await findOwned(req);
    const existing = visible(current.messages).find((m) => m.role === 'assistant');
    if (!existing) throw httpError(409, 'The interview changed while starting. Please try again.');
    return res.json({ success: true, message: existing.content, questionsAsked: current.questionsAsked });
  }

  return res.json({ success: true, message: question, questionsAsked: started.questionsAsked });
};

// @route POST /api/chat/message/:interviewId
const sendMessage = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) throw httpError(400, 'Message cannot be empty');
  if (message.length > MAX_ANSWER_CHARS) throw httpError(400, `Answer is too long (max ${MAX_ANSWER_CHARS} characters)`);

  const interview = await findOwned(req);
  if (interview.status !== 'active') throw httpError(400, 'This interview session has already ended');
  if (!visible(interview.messages).length) throw httpError(400, 'Start the interview before answering');
  if (interview.messages.filter((m) => m.role === 'user').length >= MAX_ANSWERS) {
    throw httpError(400, `This session has reached ${MAX_ANSWERS} answers. End it to get your feedback.`);
  }

  // Store the answer only while the session is still active (an End request may be scoring it)
  const withAnswer = await Interview.findOneAndUpdate(
    { _id: interview._id, user: req.user._id, status: 'active' },
    { $push: { messages: { role: 'user', content: message } } },
    { new: true }
  );
  if (!withAnswer) throw httpError(409, 'This interview is being scored and can no longer take answers');

  const reply = await continueInterview(visible(withAnswer.messages), interview.role, interview.type, interview.difficulty);

  const updated = await Interview.findOneAndUpdate(
    { _id: interview._id, user: req.user._id, status: 'active' },
    { $push: { messages: { role: 'assistant', content: reply } }, $inc: { questionsAsked: 1 } },
    { new: true }
  );
  // The answer is already stored and will be scored; only the follow-up is dropped
  if (!updated) throw httpError(409, 'This interview ended while the next question was being prepared');

  res.json({ success: true, message: reply, questionsAsked: updated.questionsAsked });
};

// A session stuck in 'scoring' (e.g. the process restarted mid-evaluation) can be claimed again
const SCORING_STALE_MS = 2 * 60 * 1000;

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

  // Atomically claim the session so concurrent End requests (two tabs, a retry) evaluate it only once
  const claimed = await Interview.findOneAndUpdate(
    {
      _id: interview._id,
      user: req.user._id,
      $or: [{ status: 'active' }, { status: 'scoring', updatedAt: { $lt: new Date(Date.now() - SCORING_STALE_MS) } }],
    },
    { $set: { status: 'scoring' } },
    { new: true }
  );
  if (!claimed) {
    const current = await findOwned(req);
    if (current.status === 'completed') {
      return res.json({ success: true, message: 'Interview already completed', feedback: current.feedback, interview: current });
    }
    throw httpError(409, 'This interview is already being scored. Please wait a few seconds and refresh.');
  }

  let feedback;
  try {
    feedback = await generateFeedback(visible(claimed.messages), claimed.role, claimed.type, {
      difficulty: claimed.difficulty,
      experience: req.user.experience,
    });
  } catch (err) {
    await Interview.updateOne({ _id: claimed._id, status: 'scoring' }, { $set: { status: 'active' } });
    throw err;
  }

  claimed.feedback = feedback;
  claimed.status = 'completed';
  claimed.completedAt = new Date();
  claimed.duration = Math.max(1, Math.round((claimed.completedAt - new Date(claimed.startedAt)) / 60000));
  await claimed.save();
  await recalcUserStats(req.user._id);

  return res.json({ success: true, message: 'Interview completed successfully', feedback, interview: claimed });
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
