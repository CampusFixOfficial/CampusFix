const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../core/auth/middleware');
const { aggregateCampusLandscape } = require('../core/analytics/campusLandscape');

const router = express.Router();

router.get('/campus-landscape', protect, adminOnly, async (req, res, next) => {
  try {
    // The projection deliberately excludes student identities, report text, photos, and residence data.
    // Location is always derived from the report's problemLocation/location fields, never the submitter's profile.
    const complaints = await Complaint.find({}, {
      status: 1,
      priority: 1,
      isDuplicate: 1,
      duplicateOf: 1,
      department: 1,
      'classification.predictedDepartment': 1,
      location: 1,
      problemLocation: 1,
      createdAt: 1,
      'statusHistory.status': 1,
      'statusHistory.timestamp': 1,
      acknowledgedAt: 1,
    }).populate('department', 'name').lean();

    res.json({ status: 'success', data: aggregateCampusLandscape(complaints) });
  } catch (error) {
    next(error);
  }
});

// Keep the existing summary contract available to older clients.
router.get('/summary', (req, res) => {
  res.json({ status: 'success', message: 'CampusFix analytics summary is not configured.', data: {} });
});

module.exports = router;
