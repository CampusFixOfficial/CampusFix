// =============================================================
// CampusFix Backend - Main Server Entry Point
// =============================================================
// This is the starting point of the entire backend.
// It sets up Express, connects middleware, mounts routes,
// and starts listening for requests.
// Owner: Bhavishya (architecture/integration)
// =============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const connectDB = require('./config/db');
const { startEscalationScheduler } = require('./core/escalation/scheduler');

// Import route files
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const departmentRoutes = require('./routes/departments');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const feedbackRoutes = require('./routes/feedback');
const notificationRoutes = require('./routes/notifications');

// Initialize Express app
const app = express();

// =============================================================
// Middleware
// =============================================================

// CORS - allows the frontend (running on a different port) to talk to this backend
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (config.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Parse JSON request bodies (so we can read data sent from the frontend)
app.use(express.json({ limit: '6mb' }));

// Parse URL-encoded request bodies (for form submissions)
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

// =============================================================
// API Routes
// =============================================================

// Health check - a simple route to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🏫 CampusFix API is running!',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);

// =============================================================
// Error Handling
// =============================================================

// Handle 404 - route not found
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: config.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// =============================================================
// Start Server
// =============================================================

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();
  startEscalationScheduler();

  // Start listening
  app.listen(config.PORT, () => {
    console.log('');
    console.log('===========================================');
    console.log('  🏫 CampusFix Backend Server');
    console.log('===========================================');
    console.log(`  🌐 URL:         http://localhost:${config.PORT}`);
    console.log(`  🏥 Health:      http://localhost:${config.PORT}/api/health`);
    console.log(`  📦 Environment: ${config.NODE_ENV}`);
    console.log('===========================================');
    console.log('');
  });
};

startServer();

module.exports = app;
