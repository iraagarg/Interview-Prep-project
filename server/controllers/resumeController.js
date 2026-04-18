const cloudinary = require('cloudinary').v2;
const Resume = require('../models/Resume');
const { extractTextFromPDF, cleanText } = require('../services/resumeParser');
const { analyzeResume } = require('../services/openaiService');

// @desc    Upload and analyze resume
// @route   POST /api/resume/upload
// @access  Private
const uploadResume = async (req, res) => {
  if (!req.file) {
    const err = new Error('Please upload a PDF file');
    err.statusCode = 400;
    throw err;
  }

  // req.file.path is now a Cloudinary https:// URL
  // req.file.filename is now the Cloudinary public ID
  const fileUrl = req.file.path;
  const publicId = req.file.filename;

  // Extract text from PDF via Cloudinary URL
  let rawText = '';
  try {
    rawText = await extractTextFromPDF(fileUrl);
  } catch (pdfErr) {
    console.error('PDF extraction error:', pdfErr.message);
  }

  let cleanedText = cleanText(rawText);

  // If PDF is scanned/image-based, use fallback
  if (!cleanedText || cleanedText.length < 10) {
    console.log('ℹ️  PDF has minimal extractable text (may be scanned). Using fallback analysis.');
    cleanedText = `Resume file: ${req.file.originalname}. Unable to extract text from this PDF (possibly a scanned or image-based document). Providing general analysis.`;
  }

  // Create resume record
  const resume = await Resume.create({
    user: req.user._id,
    fileName: req.file.originalname,
    fileUrl,      // Cloudinary URL
    publicId,     // Cloudinary public ID
    rawText: cleanedText,
    isAnalyzed: false
  });

  // Analyze resume
  const analysis = await analyzeResume(cleanedText);
  resume.analysis = analysis;
  resume.isAnalyzed = true;
  await resume.save();

  res.status(201).json({
    success: true,
    message: 'Resume uploaded and analyzed successfully',
    resume
  });
};

// @desc    Get user's resume
// @route   GET /api/resume
// @access  Private
const getResume = async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    resume: resume || null
  });
};

// @desc    Get all resumes for user
// @route   GET /api/resume/all
// @access  Private
const getAllResumes = async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    resumes
  });
};

// @desc    Delete resume
// @route   DELETE /api/resume/:id
// @access  Private
const deleteResume = async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });

  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete file from Cloudinary instead of local disk
  if (resume.publicId) {
    await cloudinary.uploader.destroy(resume.publicId, {
      resource_type: 'raw'  // must match how it was uploaded
    });
  }

  await resume.deleteOne();
  res.json({ success: true, message: 'Resume deleted successfully' });
};

// @desc    Re-analyze existing resume
// @route   POST /api/resume/:id/analyze
// @access  Private
const reanalyzeResume = async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });

  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }

  const textToAnalyze = resume.rawText || `Resume: ${resume.fileName}. Please add an OpenAI API key for analysis.`;
  const analysis = await analyzeResume(textToAnalyze);
  resume.analysis = analysis;
  resume.isAnalyzed = true;
  await resume.save();

  res.json({
    success: true,
    message: 'Resume re-analyzed successfully',
    resume
  });
};

module.exports = { uploadResume, getResume, getAllResumes, deleteResume, reanalyzeResume };