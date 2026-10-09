const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['status', 'remark', 'sla', 'system'], default: 'system' },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
