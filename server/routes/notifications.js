const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../core/auth/middleware');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ status: 'success', data: { notifications, unread: notifications.filter((item) => !item.readAt).length } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Could not load notifications.' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { $set: { readAt: new Date() } }, { new: true }).lean();
    if (!notification) return res.status(404).json({ status: 'error', message: 'Notification not found.' });
    res.json({ status: 'success', data: { notification } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Could not mark notification as read.' });
  }
});

router.patch('/read-all', async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ status: 'success', message: 'Notifications marked as read.' });
});

module.exports = router;
