const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    rawText: {
      type: String,
      default: ''
    },
    analysis: {
      summary: { type: String, default: '' },
      skills: [String],
      experience: [String],
      education: [String],
      strengths: [String],
      weaknesses: [String],
      missingSkills: [String],
      overallScore: { type: Number, default: 0 },
      recommendations: [String]
    },
    isAnalyzed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
