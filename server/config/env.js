// =============================================================
// CampusFix Backend - Environment Configuration
// =============================================================
// This file loads settings from the .env file and exports them
// so the rest of the app can use them easily.
// =============================================================

const dotenv = require('dotenv');
const path = require('path');

// Load .env file from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Render environment values can accidentally include copied quotes or line breaks.
// Normalize the browser origin before the CORS middleware writes it to a header.
const clientUrl = String(process.env.CLIENT_URL || 'http://localhost:5173')
  .replace(/[\r\n]/g, '')
  .trim()
  .replace(/^['"]|['"]$/g, '');

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  // Database connection details belong in the host environment, not source control.
  MONGODB_URI: process.env.MONGODB_URI || '',

  // JWT Authentication
  // Never fall back to a shared signing key; configure JWT_SECRET in the environment.
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Cloudinary (image storage)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Gmail SMTP (email notifications)
  GMAIL_USER: process.env.GMAIL_USER || '',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',

  // Classification microservice
  CLASSIFIER_URL: process.env.CLASSIFIER_URL || 'http://localhost:5001',

  // Frontend URL (for CORS)
  CLIENT_URL: clientUrl,
};
