// =============================================================
// CampusFix Backend - Database Connection
// =============================================================
// Connects to MongoDB Atlas (our cloud database).
// Owner: Bhavishya (architecture/integration)
// =============================================================

const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // In development, keep running even without DB (for UI work)
    if (config.NODE_ENV === 'development') {
      console.log('⚠️  Running without database connection (dev mode)');
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
