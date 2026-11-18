const express = require('express');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, authLimiter, changePassword);

module.exports = router;
