// Resumes are parsed from memory and the file itself is never stored: the app only needs the
// text, and not keeping the PDF means no copy of a candidate's contact details sits in storage.
// Import the library file directly: the package index runs a debug self-test when loaded
// without a parent module, which breaks in some environments.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

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

module.exports = { extractTextFromPDF, cleanText };
