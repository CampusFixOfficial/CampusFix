// =============================================================
// CampusFix - Complaint Model (Mongoose Schema)
// =============================================================
// The central data model — every complaint filed goes here.
// Tracks the full lifecycle: Received → Assigned → In Progress → Resolved
// Owner: Atharva (database schemas)
// =============================================================

const mongoose = require('mongoose');

// Status history entry — tracks each status change
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Received', 'Assigned', 'In Progress', 'Resolved', 'Escalated', 'Needs Review', 'Closed'],
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  remarks: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema({
  // The complaint text written by the student
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },

  description: {
    type: String,
    required: [true, 'Complaint description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },

  // Current status of the complaint
  status: {
    type: String,
    enum: ['Received', 'Assigned', 'In Progress', 'Resolved', 'Escalated', 'Needs Review', 'Closed'],
    default: 'Received',
  },

  // Full history of every status change
  statusHistory: [statusHistorySchema],

  // Who filed this complaint
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Which department this was routed to
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },

  // Who is currently assigned to handle it (staff member)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Anonymous mode — hides the complainant's identity
  isAnonymous: {
    type: Boolean,
    default: false,
  },

  // Location where the issue is (e.g., "Hostel A - Room 204", "Library")
  location: {
    type: String,
    default: '',
    trim: true,
  },

  // Photo evidence URLs (stored on Cloudinary)
  images: [{
    url: String,
    publicId: String, // Cloudinary public ID for deletion
  }],

  // Classification details — how the system categorized this complaint
  classification: {
    method: {
      type: String,
      enum: ['keyword', 'ml', 'manual', 'hybrid'],
      default: 'keyword',
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    predictedDepartment: String,
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },

  // Duplicate detection
  isDuplicate: {
    type: Boolean,
    default: false,
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },

  // Feedback after resolution
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },

  // When was it resolved?
  resolvedAt: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true, // createdAt = when complaint was filed
});

// Index for efficient queries
complaintSchema.index({ status: 1, department: 1 });
complaintSchema.index({ complainant: 1, createdAt: -1 });
complaintSchema.index({ department: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
