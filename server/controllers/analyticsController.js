const Interview = require('../models/Interview');

// Scores from the rule-based fallback are a rough length heuristic, so averages, trends and the
// skills radar only use sessions the AI evaluator actually scored. Counts and time include all.
const completed = (userId) => ({ user: userId, status: 'completed' });
const aiScored = (userId) => ({ ...completed(userId), 'feedback.source': { $ne: 'fallback' } });

const DIMENSIONS = ['overallScore', 'communication', 'technical', 'problemSolving', 'confidence'];
const avgStage = Object.fromEntries(DIMENSIONS.map((d) => [d, { $avg: `$feedback.${d}` }]));

// @route GET /api/analytics/overview
const getOverview = async (req, res) => {
  const userId = req.user._id;

  const [total, totals, averages, recent, typeBreakdown] = await Promise.all([
    Interview.countDocuments({ user: userId }),
    Interview.aggregate([
      { $match: completed(userId) },
      { $group: { _id: null, count: { $sum: 1 }, minutes: { $sum: '$duration' } } },
    ]),
    Interview.aggregate([{ $match: aiScored(userId) }, { $group: { _id: null, scored: { $sum: 1 }, ...avgStage } }]),
    Interview.find(aiScored(userId)).select('feedback.overallScore role createdAt').sort({ createdAt: -1 }).limit(10),
    Interview.aggregate([{ $match: completed(userId) }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);

  const a = averages[0] || {};
  const round = (v) => Math.round(v || 0);

  res.json({
    success: true,
    stats: {
      totalInterviews: total,
      completedInterviews: totals[0]?.count || 0,
      scoredInterviews: a.scored || 0,
      averageScores: {
        overall: round(a.overallScore),
        communication: round(a.communication),
        technical: round(a.technical),
        problemSolving: round(a.problemSolving),
        confidence: round(a.confidence),
      },
      // last 10 AI-scored sessions, oldest first
      scoreTrend: recent.reverse().map((i) => ({ date: i.createdAt, score: i.feedback.overallScore || 0, role: i.role })),
      typeBreakdown,
      totalDuration: totals[0]?.minutes || 0, // minutes, across all completed sessions
    },
  });
};

// Feedback items are specific sentences, so exact-match counting rarely finds repeats.
// Instead show the leading points from the most recent AI-scored sessions, newest first.
const recentPoints = (interviews, field, perSession = 2, max = 5) => {
  const seen = new Set();
  const out = [];
  for (const iv of interviews) {
    for (const text of (iv.feedback[field] || []).slice(0, perSession)) {
      const key = text.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ text, date: iv.createdAt });
      if (out.length === max) return out;
    }
  }
  return out;
};

// @route GET /api/analytics/skills
const getSkillAnalytics = async (req, res) => {
  const userId = req.user._id;
  const [interviews, scoreByType] = await Promise.all([
    Interview.find(aiScored(userId)).select('feedback createdAt').sort({ createdAt: -1 }).limit(5),
    Interview.aggregate([
      { $match: aiScored(userId) },
      { $group: { _id: '$type', avgScore: { $avg: '$feedback.overallScore' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    analytics: {
      recentStrengths: recentPoints(interviews, 'strengths'),
      recentImprovements: recentPoints(interviews, 'improvements'),
      scoreByType,
      recommendations: interviews[0]?.feedback?.recommendations || [],
    },
  });
};

// @route GET /api/analytics/progress?days=
const getProgress = async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const interviews = await Interview.find({ ...aiScored(req.user._id), createdAt: { $gte: since } })
    .select('feedback createdAt role type')
    .sort({ createdAt: 1 });

  const progress = interviews.map((iv) => ({
    date: iv.createdAt,
    overall: iv.feedback.overallScore || 0,
    communication: iv.feedback.communication || 0,
    technical: iv.feedback.technical || 0,
    problemSolving: iv.feedback.problemSolving || 0,
    confidence: iv.feedback.confidence || 0,
    role: iv.role,
    type: iv.type,
  }));

  res.json({ success: true, progress, period: `${days} days` });
};

module.exports = { getOverview, getSkillAnalytics, getProgress };
