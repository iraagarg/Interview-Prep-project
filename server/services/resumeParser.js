// Import the library file directly: the package index runs a debug self-test when loaded
// without a parent module, which breaks in some environments.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Extract text from an in-memory PDF buffer. Returns '' if the PDF has no text layer. */
const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    return '';
  }
};

/** Normalise whitespace in extracted text. */
const cleanText = (text) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Upload a PDF buffer to Cloudinary as a raw file. */
const uploadPdfToCloudinary = (buffer, originalName) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'resumes',
        resource_type: 'raw',
        // raw files keep their extension in the public ID, so the URL serves a .pdf
        public_id: `resume_${Date.now()}_${Math.round(Math.random() * 1e6)}.pdf`,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.on('error', reject);
    stream.end(buffer);
  }).catch((err) => {
    const e = new Error(`File storage failed for ${originalName}: ${err.message}`);
    e.statusCode = 502;
    throw e;
  });

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (err) {
    // The database record is the source of truth; a storage cleanup failure must not block deletion
    console.error('Cloudinary delete failed:', err.message);
  }
};

const isStorageConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

module.exports = { extractTextFromPDF, cleanText, uploadPdfToCloudinary, deleteFromCloudinary, isStorageConfigured };
