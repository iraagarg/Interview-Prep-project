const Interview = require('../models/Interview');
const User = require('../models/User');

/**
 * Recompute the denormalised summary fields on the user from completed interviews.
 * Called whenever an interview is completed or deleted, so the numbers can never drift.
 */
const recalcUserStats = async (userId) => {
  const [agg] = await Interview.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$feedback.overallScore' } } },
  ]);
  await User.findByIdAndUpdate(userId, {
    totalInterviews: agg ? agg.count : 0,
    averageScore: agg ? Math.round(agg.avg || 0) : 0,
  });
};

module.exports = { recalcUserStats };
