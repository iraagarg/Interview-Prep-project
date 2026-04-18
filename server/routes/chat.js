const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  startChat,
  sendMessage,
  endInterview,
  getMessages
} = require('../controllers/chatController');

router.post('/start/:interviewId', protect, startChat);
router.post('/message/:interviewId', protect, sendMessage);
router.post('/end/:interviewId', protect, endInterview);
router.get('/messages/:interviewId', protect, getMessages);

module.exports = router;
