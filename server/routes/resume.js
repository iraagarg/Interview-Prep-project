const express = require('express');
const { protect } = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/rateLimit');
const upload = require('../middlewares/upload');
const {
  uploadResume,
  getResume,
  getAllResumes,
  deleteResume,
  reanalyzeResume,
} = require('../controllers/resumeController');

const router = express.Router();

router.post('/upload', protect, aiLimiter, upload.single('resume'), uploadResume);
router.get('/', protect, getResume);
router.get('/all', protect, getAllResumes);
router.delete('/:id', protect, deleteResume);
router.post('/:id/analyze', protect, aiLimiter, reanalyzeResume);

module.exports = router;
