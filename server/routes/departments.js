// =============================================================
// CampusFix - Department Routes
// =============================================================
// CRUD for departments and seeding initial data.
// Owner: Bhavishya (department mapping)
// =============================================================

const express = require('express');
const Department = require('../models/Department');
const { protect, adminOnly, staffOrAdmin } = require('../core/auth/middleware');

const router = express.Router();

// =============================================================
// GET /api/departments — List all departments (any authenticated user)
// =============================================================
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('head', 'name email')
      .sort({ name: 1 });

    res.json({
      status: 'success',
      results: departments.length,
      data: { departments },
    });
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch departments' });
  }
});

// =============================================================
// POST /api/departments/seed — Seed initial departments (admin)
// =============================================================
router.post('/seed', async (req, res) => {
  try {
    const existing = await Department.countDocuments();
    if (existing > 0) {
      return res.json({
        status: 'success',
        message: `Departments already seeded (${existing} found)`,
      });
    }

    const defaultDepartments = [
      {
        name: 'Technical',
        description: 'Electrical, plumbing, carpentry, and general maintenance issues',
        keywords: ['fan', 'tubelight', 'light', 'bulb', 'switch', 'socket', 'electrical', 'wiring', 'ac', 'air conditioner', 'plumbing', 'tap', 'water', 'leak', 'pipe', 'door', 'window', 'lock', 'broken', 'repair', 'fix', 'not working', 'power', 'electricity', 'short circuit', 'fuse', 'cooler', 'heater', 'geyser'],
        slaHours: 24,
        isSensitive: false,
      },
      {
        name: 'Housekeeping',
        description: 'Cleanliness, sanitation, and hygiene related issues',
        keywords: ['dirty', 'clean', 'washroom', 'toilet', 'bathroom', 'garbage', 'trash', 'waste', 'dustbin', 'smell', 'stink', 'sweeping', 'mopping', 'hygiene', 'pest', 'cockroach', 'rat', 'insect', 'mosquito', 'spider', 'mess', 'canteen', 'kitchen', 'drain', 'clogged', 'sanitation', 'stain'],
        slaHours: 12,
        isSensitive: false,
      },
      {
        name: 'Discipline Cell',
        description: 'Anti-ragging, bullying, harassment, and misconduct complaints',
        keywords: ['bully', 'bullying', 'harass', 'harassment', 'ragging', 'threat', 'abuse', 'fight', 'violence', 'intimidation', 'misconduct', 'misbehavior', 'drunk', 'drugs', 'smoking', 'noise', 'disturbance', 'eve teasing', 'stalking', 'senior', 'junior', 'discrimination'],
        slaHours: 6,
        isSensitive: true,
      },
      {
        name: 'Academic',
        description: 'Academic grievances, exam issues, faculty complaints',
        keywords: ['exam', 'marks', 'grade', 'attendance', 'faculty', 'professor', 'teacher', 'lecture', 'class', 'syllabus', 'assignment', 'project', 'lab', 'library', 'book', 'timetable', 'schedule', 'result', 'revaluation', 'cheating', 'plagiarism', 'unfair', 'biased'],
        slaHours: 48,
        isSensitive: false,
      },
      {
        name: 'Garden & Grounds',
        description: 'Campus grounds, garden, parking, and outdoor infrastructure',
        keywords: ['garden', 'tree', 'grass', 'lawn', 'park', 'ground', 'playground', 'parking', 'road', 'pathway', 'bench', 'streetlight', 'outdoor', 'fence', 'gate', 'mud', 'pothole', 'footpath'],
        slaHours: 72,
        isSensitive: false,
      },
      {
        name: 'Administration',
        description: 'General administrative issues, ID cards, hostel allotment, fees',
        keywords: ['hostel', 'room', 'allotment', 'fee', 'fine', 'id card', 'certificate', 'document', 'admission', 'transfer', 'wifi', 'internet', 'network', 'mess', 'food', 'menu', 'laundry', 'security', 'guard', 'cctv', 'general'],
        slaHours: 48,
        isSensitive: false,
      },
    ];

    const departments = await Department.insertMany(defaultDepartments);

    res.status(201).json({
      status: 'success',
      message: `Seeded ${departments.length} departments`,
      data: { departments },
    });
  } catch (error) {
    console.error('Seed departments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to seed departments' });
  }
});

// =============================================================
// PUT /api/departments/:id — Update department (admin only)
// =============================================================
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, keywords, slaHours, isSensitive } = req.body;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, keywords, slaHours, isSensitive },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' });
    }

    res.json({
      status: 'success',
      message: 'Department updated',
      data: { department },
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update department' });
  }
});

module.exports = router;
