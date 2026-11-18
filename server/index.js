require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5001;
const { MONGODB_URI, JWT_SECRET } = process.env;

if (!MONGODB_URI || !JWT_SECRET) {
  console.error('Missing required environment variables: MONGODB_URI and JWT_SECRET must be set.');
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  console.warn('GROQ_API_KEY is not set: AI features will use rule-based fallbacks.');
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
      }
      throw err;
    });

    // Graceful shutdown (Render sends SIGTERM on redeploy)
    const shutdown = () => {
      server.close(() => mongoose.connection.close(false).then(() => process.exit(0)));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
