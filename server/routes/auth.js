const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { protect } = require('../core/auth/middleware');
const { verifyAuthorityCredentials } = require('../core/auth/authorityCredentials');
const { rateLimit } = require('../core/security/rateLimit');
const { sendRegistrationEmail, sendLoginEmail } = require('../core/notifications/emailService');

const router = express.Router();
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
const EMAIL_DOMAIN = 'vitbhopal.ac.in';
const registrationPattern = /^(\d{2})([A-Z]{2,6})(\d{3,8})$/;

function normalizeRegistrationNumber(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function validateStudentIdentity(emailValue, registrationValue) {
  const email = String(emailValue || '').trim().toLowerCase();
  const registrationNumber = normalizeRegistrationNumber(registrationValue);
  const match = registrationNumber.match(registrationPattern);
  if (!match) return { valid: false, message: 'Enter a valid VIT registration number.' };
  const configuredCodes = String(process.env.VIT_PROGRAM_CODES || '').split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
  if (configuredCodes.length && !configuredCodes.includes(match[2])) {
    return { valid: false, message: 'That program code is not enabled for registration.' };
  }
  const local = email.split('@')[0] || '';
  const embeddedNumber = local.slice(local.lastIndexOf('.') + 1).toUpperCase();
  if (email.split('@')[1] !== EMAIL_DOMAIN || embeddedNumber !== registrationNumber || !/^[a-z0-9._-]+$/i.test(local)) {
    return { valid: false, message: 'Use your VIT Bhopal email with the same registration number.' };
  }
  return { valid: true, email, registrationNumber };
}

const generateToken = (userId) => jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  employeeId: user.employeeId || '',
  managedLocations: user.role === 'staff' ? (user.managedLocations || []) : [],
  registrationNumber: user.registrationNumber || user.rollNumber || '',
  rollNumber: user.registrationNumber || user.rollNumber || '',
  studentType: user.studentType || '',
  hostel: user.hostel || '',
  phone: user.phone || '',
});

// Public registration is exclusively for students. Authorities and admins are created by admins.
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { name, email, password, registrationNumber: rawRegistrationNumber, rollNumber, studentType, hostel, phone } = req.body;
    const identity = validateStudentIdentity(email, rawRegistrationNumber || rollNumber);
    if (!identity.valid) return res.status(400).json({ status: 'error', message: identity.message });
    if (!name || String(name).trim().length < 2) return res.status(400).json({ status: 'error', message: 'Enter your full name.' });
    if (!password || password.length < 8) return res.status(400).json({ status: 'error', message: 'Use a password with at least 8 characters.' });
    if (!['Hosteller', 'Day Scholar'].includes(studentType)) return res.status(400).json({ status: 'error', message: 'Choose Hosteller or Day Scholar.' });
    if (studentType === 'Hosteller' && !String(hostel || '').trim()) return res.status(400).json({ status: 'error', message: 'Add your hostel details.' });

    const existingUser = await User.findOne({ $or: [{ email: identity.email }, { registrationNumber: identity.registrationNumber }] });
    if (existingUser) return res.status(409).json({ status: 'error', message: 'An account already uses this email or registration number.' });

    const user = await User.create({
      name: String(name).trim(),
      email: identity.email,
      password,
      role: 'student',
      registrationNumber: identity.registrationNumber,
      rollNumber: identity.registrationNumber,
      studentType,
      hostel: studentType === 'Hosteller' ? String(hostel).trim() : '',
      phone: phone || '',
    });
    // Send email without blocking account creation.
// Email failure should never prevent registration.
sendRegistrationEmail(user)
  .catch((emailError) => {
    console.error('Registration email failed:', emailError.message);
  });

res.status(201).json({
  status: 'success',
  message: 'Your CampusFix account is ready.',
  data: {
    token: generateToken(user._id),
    user: publicUser(user),
  },
});
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ status: 'error', message: Object.values(error.errors).map((item) => item.message).join('. ') });
    }
    console.error('Register error:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong during registration.' });
  }
});

router.post('/login', authRateLimit, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ status: 'error', message: 'Enter your email and password.' });
    const user = await User.findOne({ email }).select('+password').populate('department', 'name');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    if (!user.isActive) return res.status(401).json({ status: 'error', message: 'This account is not active. Contact a CampusFix administrator.' });
    if (user.role === 'staff') {
      const employeeId = String(req.body.employeeId || '').trim().toUpperCase();
      const selectedDepartment = String(req.body.departmentName || '').trim().toLowerCase();
      if (!employeeId || !selectedDepartment) {
        return res.status(400).json({ status: 'error', message: 'Enter your employee ID and select the department assigned to your account.' });
      }
      if (!verifyAuthorityCredentials(user, employeeId, selectedDepartment)) {
        return res.status(401).json({ status: 'error', message: 'The employee ID or department does not match this Authority account.' });
      }
    }
    // Send email without blocking account creation.
// Email failure should never prevent registration.
sendRegistrationEmail(user)
  .catch((emailError) => {
    console.error('Registration email failed:', emailError.message);
  });

res.status(201).json({
  status: 'success',
  message: 'Your CampusFix account is ready.',
  data: {
    token: generateToken(user._id),
    user: publicUser(user),
  },
});
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong during login.' });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name');
    if (!user) return res.status(404).json({ status: 'error', message: 'Account not found.' });
    res.json({ status: 'success', data: { user: { ...publicUser(user), createdAt: user.createdAt } } });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch your profile.' });
  }
});

module.exports = router;
