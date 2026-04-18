const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createInterview,
  getInterviews,
  getInterview,
  completeInterview,
  deleteInterview
} = require('../controllers/interviewController');

router.post('/', protect, createInterview);
router.get('/', protect, getInterviews);
router.get('/:id', protect, getInterview);
router.put('/:id/complete', protect, completeInterview);
router.delete('/:id', protect, deleteInterview);

module.exports = router;
