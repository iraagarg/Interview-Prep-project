const Resume = require('../models/Resume');
const httpError = require('../utils/httpError');
const { extractTextFromPDF, cleanText } = require('../services/resumeParser');
const { analyzeResume } = require('../services/aiService');

const MIN_TEXT_CHARS = 50;

// @route POST /api/resume/upload  (multipart field: "resume")
const uploadResume = async (req, res) => {
  if (!req.file) throw httpError(400, 'Please upload a PDF file');
  // Cheap magic-number check: the MIME type comes from the client and can be spoofed
  if (req.file.buffer.subarray(0, 5).toString() !== '%PDF-') throw httpError(400, 'The file is not a valid PDF');

  const rawText = cleanText(await extractTextFromPDF(req.file.buffer));
  if (rawText.length < MIN_TEXT_CHARS) {
    throw httpError(
      422,
      'Could not read text from this PDF. It looks like a scanned image. Please export your resume as a text-based PDF (for example from Word or Google Docs).'
    );
  }

  // Only the extracted text is kept; the uploaded file is discarded with the request
  const analysis = await analyzeResume(rawText);
  const resume = await Resume.create({
    user: req.user._id,
    fileName: req.file.originalname.slice(0, 200),
    rawText,
    analysis,
  });

  const out = resume.toObject();
  delete out.rawText;
  res.status(201).json({ success: true, message: 'Resume uploaded and analyzed successfully', resume: out });
};

// @route GET /api/resume  (latest)
const getResume = async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 }).select('-rawText');
  res.json({ success: true, resume: resume || null });
};

// @route GET /api/resume/all
const getAllResumes = async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 }).select('-rawText');
  res.json({ success: true, resumes });
};

// @route DELETE /api/resume/:id
const deleteResume = async (req, res) => {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!resume) throw httpError(404, 'Resume not found');
  res.json({ success: true, message: 'Resume deleted successfully' });
};

// @route POST /api/resume/:id/analyze
const reanalyzeResume = async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw httpError(404, 'Resume not found');
  if (!resume.rawText) throw httpError(422, 'This resume has no extractable text. Please upload it again.');

  resume.analysis = await analyzeResume(resume.rawText);
  await resume.save();

  const out = resume.toObject();
  delete out.rawText;
  res.json({ success: true, message: 'Resume re-analyzed successfully', resume: out });
};

module.exports = { uploadResume, getResume, getAllResumes, deleteResume, reanalyzeResume };
