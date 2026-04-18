const axios = require('axios');
const pdfParse = require('pdf-parse');

/**
 * Extract text content from a PDF file via Cloudinary URL
 */
const extractTextFromPDF = async (fileUrl) => {
  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });
    const buffer = Buffer.from(response.data);
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
  }
};

/**
 * Clean and normalize extracted text
 */
const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

module.exports = { extractTextFromPDF, cleanText };