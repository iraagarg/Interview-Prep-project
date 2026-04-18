const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getOverview,
  getSkillAnalytics,
  getProgress
} = require('../controllers/analyticsController');

router.get('/overview', protect, getOverview);
router.get('/skills', protect, getSkillAnalytics);
router.get('/progress', protect, getProgress);

module.exports = router;
