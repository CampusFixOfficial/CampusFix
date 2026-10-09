const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { sendComplaintUpdateEmail } = require('./emailService');

async function createNotification({ recipient, type = 'system', title, message, complaint = null }) {
  if (!recipient || !title || !message) return null;
  return Notification.create({ recipient, type, title, message, complaint });
}

async function notifyStudent(complaint, payload) {
  const notification = await createNotification({ ...payload, recipient: complaint.complainant, complaint: complaint._id });
  const student = complaint.complainant?.email ? complaint.complainant : await User.findById(complaint.complainant).select('name email').lean();
  await sendComplaintUpdateEmail(student, complaint, payload.title, payload.message);
  return notification;
}

module.exports = { createNotification, notifyStudent };
