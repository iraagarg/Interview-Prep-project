// Shared test bootstrap: isolated database, deterministic AI (no API key -> rule-based fallback)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
delete process.env.GROQ_API_KEY;
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.CLOUDINARY_API_KEY;
delete process.env.CLOUDINARY_API_SECRET;

const mongoose = require('mongoose');

const TEST_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/interviewai_test';

const connect = async () => {
  await mongoose.connect(TEST_URI);
  await mongoose.connection.db.dropDatabase();
};

const disconnect = async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
};

module.exports = { connect, disconnect };
