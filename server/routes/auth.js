// =============================================================
// CampusFix - Auth Routes (Register, Login, Profile)
// =============================================================
// Handles user registration, login, and profile retrieval.
// Owner: Bhavishya (authentication)
// =============================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { protect } = require('../core/auth/middleware');

const router = express.Router();

// Helper: Generate JWT token for a user
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

// =============================================================
// POST /api/auth/register — Create a new account
// =============================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, hostel, phone, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'An account with this email already exists',
      });
    }

    // Create the user (password gets hashed automatically by the model)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      rollNumber: rollNumber || '',
      hostel: hostel || '',
      phone: phone || '',
      department: department || null,
    });

    // Generate a JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully!',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          rollNumber: user.rollNumber,
          hostel: user.hostel,
        },
      },
    });

  } catch (error) {
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join('. '),
      });
    }
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during registration',
    });
  }
});

// =============================================================
// POST /api/auth/login — Log in to an existing account
// =============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both email and password',
      });
    }

    // Find user and include password field (normally excluded)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account has been deactivated — contact admin',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      status: 'success',
      message: 'Logged in successfully!',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          rollNumber: user.rollNumber,
          hostel: user.hostel,
        },
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during login',
    });
  }
});

// =============================================================
// GET /api/auth/me — Get current user's profile (protected)
// =============================================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name');

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          rollNumber: user.rollNumber,
          hostel: user.hostel,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Could not fetch profile',
    });
  }
});

module.exports = router;
