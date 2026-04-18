const Interview = require('../models/Interview');

// @desc    Get user analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getOverview = async (req, res) => {
  const userId = req.user._id;

  const [total, completed, interviews] = await Promise.all([
    Interview.countDocuments({ user: userId }),
    Interview.countDocuments({ user: userId, status: 'completed' }),
    Interview.find({ user: userId, status: 'completed' })
      .select('feedback role type createdAt duration')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  // Calculate averages
  const scores = interviews.map(i => ({
    overall: i.feedback.overallScore || 0,
    communication: i.feedback.communication || 0,
    technical: i.feedback.technical || 0,
    problemSolving: i.feedback.problemSolving || 0,
    confidence: i.feedback.confidence || 0
  }));

  const avg = (arr, key) =>
    arr.length ? Math.round(arr.reduce((s, i) => s + i[key], 0) / arr.length) : 0;

  const averageScores = {
    overall: avg(scores, 'overall'),
    communication: avg(scores, 'communication'),
    technical: avg(scores, 'technical'),
    problemSolving: avg(scores, 'problemSolving'),
    confidence: avg(scores, 'confidence')
  };

  // Score trend (last 10 interviews chronologically)
  const trend = [...interviews]
    .reverse()
    .map(i => ({
      date: i.createdAt,
      score: i.feedback.overallScore || 0,
      role: i.role
    }));

  // Type breakdown
  const typeBreakdown = await Interview.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    stats: {
      totalInterviews: total,
      completedInterviews: completed,
      averageScores,
      scoreTrend: trend,
      typeBreakdown,
      totalDuration: interviews.reduce((s, i) => s + (i.duration || 0), 0)
    }
  });
};

// @desc    Get performance by skill area
// @route   GET /api/analytics/skills
// @access  Private
const getSkillAnalytics = async (req, res) => {
  const interviews = await Interview.find({
    user: req.user._id,
    status: 'completed'
  }).select('feedback role type createdAt').sort({ createdAt: -1 }).limit(20);

  // Aggregate all strengths and improvements
  const allStrengths = {};
  const allImprovements = {};

  interviews.forEach(iv => {
    (iv.feedback.strengths || []).forEach(s => {
      allStrengths[s] = (allStrengths[s] || 0) + 1;
    });
    (iv.feedback.improvements || []).forEach(im => {
      allImprovements[im] = (allImprovements[im] || 0) + 1;
    });
  });

  const topStrengths = Object.entries(allStrengths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text, count]) => ({ text, count }));

  const topImprovements = Object.entries(allImprovements)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text, count]) => ({ text, count }));

  // Score by interview type
  const scoreByType = await Interview.aggregate([
    { $match: { user: req.user._id, status: 'completed' } },
    {
      $group: {
        _id: '$type',
        avgScore: { $avg: '$feedback.overallScore' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    analytics: {
      topStrengths,
      topImprovements,
      scoreByType,
      recommendations: interviews[0]?.feedback?.recommendations || []
    }
  });
};

// @desc    Get progress over time
// @route   GET /api/analytics/progress
// @access  Private
const getProgress = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const interviews = await Interview.find({
    user: req.user._id,
    status: 'completed',
    createdAt: { $gte: since }
  })
    .select('feedback createdAt role type')
    .sort({ createdAt: 1 });

  const progress = interviews.map(iv => ({
    date: iv.createdAt,
    overall: iv.feedback.overallScore || 0,
    communication: iv.feedback.communication || 0,
    technical: iv.feedback.technical || 0,
    problemSolving: iv.feedback.problemSolving || 0,
    confidence: iv.feedback.confidence || 0,
    role: iv.role,
    type: iv.type
  }));

  res.json({
    success: true,
    progress,
    period: `${days} days`
  });
};

module.exports = { getOverview, getSkillAnalytics, getProgress };
