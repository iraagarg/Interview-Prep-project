const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  createInterview,
  getInterviews,
  getInterview,
  abandonInterview,
  deleteInterview,
} = require('../controllers/interviewController');

const router = express.Router();

router.post('/', protect, createInterview);
router.get('/', protect, getInterviews);
router.get('/:id', protect, getInterview);
router.put('/:id/abandon', protect, abandonInterview);
router.delete('/:id', protect, deleteInterview);

module.exports = router;
