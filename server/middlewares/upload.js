const multer = require('multer');
const httpError = require('../utils/httpError');

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Keep the file in memory: we parse the PDF straight from the buffer and stream
// the same buffer to Cloudinary, so the server never writes to its (ephemeral) disk
// and never has to download the file back again.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(httpError(400, 'Only PDF files are allowed'));
  },
});

module.exports = upload;
