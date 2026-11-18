const express = require('express');
const { protect } = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/rateLimit');
const { startChat, sendMessage, endInterview, getMessages } = require('../controllers/chatController');

const router = express.Router();

router.post('/start/:interviewId', protect, aiLimiter, startChat);
router.post('/message/:interviewId', protect, aiLimiter, sendMessage);
router.post('/end/:interviewId', protect, aiLimiter, endInterview);
router.get('/messages/:interviewId', protect, getMessages);

module.exports = router;
