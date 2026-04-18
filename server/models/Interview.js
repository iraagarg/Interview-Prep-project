const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null
    },
    title: {
      type: String,
      default: 'Mock Interview Session'
    },
    role: {
      type: String,
      default: 'Software Engineer'
    },
    type: {
      type: String,
      enum: ['technical', 'hr', 'mixed'],
      default: 'mixed'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active'
    },
    messages: [messageSchema],
    feedback: {
      overallScore: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      strengths: [String],
      improvements: [String],
      summary: { type: String, default: '' },
      recommendations: [String]
    },
    duration: {
      type: Number, // in minutes
      default: 0
    },
    questionsAsked: {
      type: Number,
      default: 0
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
