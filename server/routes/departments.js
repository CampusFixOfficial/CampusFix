const express = require('express');
const Department = require('../models/Department');
const { DEFAULT_DEPARTMENTS } = require('../config/departments');
const { protect, adminOnly } = require('../core/auth/middleware');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'name email')
      .sort({ name: 1 });
    res.json({ status: 'success', results: departments.length, data: { departments } });
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch departments' });
  }
});

// Admin-only, idempotent seed: canonicalize old names and deactivate legacy categories.
router.post('/seed', protect, adminOnly, async (req, res) => {
  try {
    const departments = [];
    for (const item of DEFAULT_DEPARTMENTS) {
      const department = await Department.findOneAndUpdate(
        { name: item.name },
        { $set: { ...item, isActive: true, isSensitive: Boolean(item.isSensitive) } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      departments.push(department);
    }
    await Department.updateMany(
      { name: { $nin: DEFAULT_DEPARTMENTS.map((item) => item.name) } },
      { $set: { isActive: false } }
    );
    res.json({ status: 'success', message: 'CampusFix departments are ready.', results: departments.length, data: { departments } });
  } catch (error) {
    console.error('Seed departments error:', error);
    res.status(500).json({ status: 'error', message: 'Could not prepare departments.' });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { description, keywords, slaHours, isSensitive, head } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: { description, keywords, slaHours, isSensitive, head } },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ status: 'error', message: 'Department not found' });
    res.json({ status: 'success', data: { department } });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(400).json({ status: 'error', message: 'Could not update department.' });
  }
});

module.exports = router;
