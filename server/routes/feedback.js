const express = require('express');
const PlatformFeedback = require('../models/PlatformFeedback');
const { protect, adminOnly, optionalProtect } = require('../core/auth/middleware');
const { validatePlatformFeedback } = require('../core/feedback/feedbackUtils');

const router = express.Router();

router.post('/', optionalProtect, async (req, res) => {
  try {
    const result = validatePlatformFeedback(req.body, req.user || null);
    if (!result.valid) return res.status(400).json({ status: 'error', message: result.message });
    const feedback = await PlatformFeedback.create(result.feedback);
    res.status(201).json({ status: 'success', message: 'Thank you for sharing your feedback.', data: { feedback: { id: feedback._id, topic: feedback.topic, message: feedback.message, senderType: feedback.senderType, source: feedback.source, createdAt: feedback.createdAt } } });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ status: 'error', message: Object.values(error.errors).map((item) => item.message).join('. ') });
    console.error('Platform feedback submit error:', error);
    res.status(500).json({ status: 'error', message: 'Your feedback could not be saved. Please try again.' });
  }
});

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const feedback = await PlatformFeedback.find({})
      .select('topic message senderType source sender contactEmail complaintId createdAt')
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();
    res.json({ status: 'success', results: feedback.length, data: { feedback } });
  } catch (error) {
    console.error('Platform feedback list error:', error);
    res.status(500).json({ status: 'error', message: 'Could not load CampusFix feedback.' });
  }
});

module.exports = router;
