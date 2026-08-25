// =============================================================
// CampusFix - Department Model (Mongoose Schema)
// =============================================================
// Each department handles a specific category of complaints.
// The classifier routes complaints to the right department.
// Owner: Atharva (database schemas)
// =============================================================

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  // Department name (e.g., "Technical", "Housekeeping")
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
  },

  // Short description of what this department handles
  description: {
    type: String,
    default: '',
  },

  // Keywords used by the rule-based classifier to route complaints here
  // Example: ["fan", "tubelight", "switch", "electrical", "wiring"]
  keywords: [{
    type: String,
    lowercase: true,
    trim: true,
  }],

  // The department head's user ID (for notifications)
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // SLA (Service Level Agreement) in hours
  // If a complaint isn't actioned within this many hours, it gets escalated
  slaHours: {
    type: Number,
    default: 48,
  },

  // Is this department active?
  isActive: {
    type: Boolean,
    default: true,
  },

  // Is this a sensitive department? (e.g., Discipline/Anti-Ragging Cell)
  // Anonymous complaints are only visible to sensitive departments
  isSensitive: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('Department', departmentSchema);
