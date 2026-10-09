const mongoose = require('mongoose');

const platformFeedbackSchema = new mongoose.Schema({
  topic: {
    type: String,
    enum: ['general', 'suggestion', 'system_issue', 'routing', 'coordination', 'usability'],
    default: 'general',
  },
  message: {
    type: String,
    required: [true, 'Write a short note before sending feedback.'],
    trim: true,
    minlength: [8, 'Add a little more detail before sending.'],
    maxlength: [2000, 'Keep feedback under 2,000 characters.'],
  },
  senderType: {
    type: String,
    enum: ['visitor', 'student', 'authority', 'admin'],
    required: true,
    default: 'visitor',
  },
  source: {
    type: String,
    enum: ['landing-page', 'student-portal', 'authority-portal', 'other'],
    default: 'other',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
    maxlength: [254, 'Email address is too long.'],
  },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
}, { timestamps: true });

platformFeedbackSchema.index({ createdAt: -1 });
platformFeedbackSchema.index({ senderType: 1, createdAt: -1 });

module.exports = mongoose.model('PlatformFeedback', platformFeedbackSchema);
