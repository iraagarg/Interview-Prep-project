const Interview = require('../models/Interview');
const User = require('../models/User');

/**
 * Recompute the denormalised summary fields on the user from completed interviews.
 * Called whenever an interview is completed or deleted, so the numbers can never drift.
 */
const recalcUserStats = async (userId) => {
  // Same rule as the analytics page: fallback (heuristic) scores are counted but not averaged
  const [agg] = await Interview.aggregate([
    { $match: { user: userId, status: 'completed' } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avg: { $avg: { $cond: [{ $eq: ['$feedback.source', 'fallback'] }, null, '$feedback.overallScore'] } },
      },
    },
  ]);
  await User.findByIdAndUpdate(userId, {
    totalInterviews: agg ? agg.count : 0,
    averageScore: agg ? Math.round(agg.avg || 0) : 0,
  });
};

module.exports = { recalcUserStats };
