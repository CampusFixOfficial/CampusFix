// =============================================================
// CampusFix - User Model (Mongoose Schema)
// =============================================================
// Stores all users: students, staff (employees), and admins.
// Owner: Atharva (database schemas)
// =============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Full name of the user
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },

  // Email address (used for login)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },

  // Hashed password (never stored in plain text)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },

  // Role determines what the user can do
  // - student: can file and track complaints
  // - staff: can view/update complaints in their department
  // - admin: can see everything, reassign, view analytics
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student',
  },

  // Which department this user belongs to (only for staff)
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },

  // Employee identity is used only for authority sign-in; department access stays admin-assigned.
  employeeId: {
    type: String,
    trim: true,
    uppercase: true,
    minlength: [2, 'Employee ID must be at least 2 characters'],
    maxlength: [40, 'Employee ID cannot exceed 40 characters'],
    unique: true,
    sparse: true,
    default: undefined,
  },

  // Hostel Administration staff may coordinate reports from Admin-assigned hostel locations.
  // This scope supplements (never replaces) the account's operational department.
  managedLocations: [{
    type: String,
    trim: true,
  }],

  // Student-specific fields
  rollNumber: {
    type: String,
    default: '',
  },

  registrationNumber: {
    type: String,
    uppercase: true,
    trim: true,
    unique: true,
    sparse: true,
    default: undefined,
  },

  studentType: {
    type: String,
    enum: ['Hosteller', 'Day Scholar', ''],
    default: '',
  },

  hostel: {
    type: String,
    default: '',
  },

  phone: {
    type: String,
    default: '',
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },

}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// ---- Middleware: Hash password before saving ----
userSchema.pre('save', async function () {
  // Only hash if the password was changed (or is new)
  if (!this.isModified('password')) return;

  // Hash the password with a "salt" of 12 rounds
  // (Salt = random data added to make each hash unique, even for identical passwords)
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ---- Method: Check if entered password matches stored hash ----
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
