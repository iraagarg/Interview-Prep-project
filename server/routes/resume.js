const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  uploadResume,
  getResume,
  getAllResumes,
  deleteResume,
  reanalyzeResume
} = require('../controllers/resumeController');

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/', protect, getResume);
router.get('/all', protect, getAllResumes);
router.delete('/:id', protect, deleteResume);
router.post('/:id/analyze', protect, reanalyzeResume);

module.exports = router;
