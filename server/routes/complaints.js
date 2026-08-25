// =============================================================
// CampusFix - Complaint Routes
// =============================================================
// CRUD operations for complaints: submit, view, update status,
// reassign, and rate.
// Owner: Atharva (complaint intake) + Bhavishya (routing/status)
// =============================================================

const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, studentOnly, staffOrAdmin, adminOnly } = require('../core/auth/middleware');
const { classifyByKeywords } = require('../core/classifier/keywordClassifier');

const router = express.Router();

// =============================================================
// POST /api/complaints — Submit a new complaint (students only)
// =============================================================
router.post('/', protect, studentOnly, async (req, res) => {
  try {
    const { title, description, isAnonymous, location, priority, images } = req.body;

    // Create the complaint
    const complaint = new Complaint({
      title,
      description,
      complainant: req.user._id,
      isAnonymous: isAnonymous || false,
      location: location || '',
      priority: priority || 'medium',
      images: images || [],
      status: 'Received',
      statusHistory: [{
        status: 'Received',
        changedBy: req.user._id,
        remarks: 'Complaint submitted',
      }],
    });

    // Auto-classify using keyword matcher
    const fullText = `${title} ${description}`;
    const classification = await classifyByKeywords(fullText);

    complaint.classification = {
      method: classification.method,
      confidence: classification.confidence,
      predictedDepartment: classification.departmentName || 'Unclassified',
    };

    if (classification.departmentId && classification.confidence >= 0.1) {
      // High enough confidence — auto-assign
      complaint.department = classification.departmentId;
      complaint.status = 'Assigned';
      complaint.statusHistory.push({
        status: 'Assigned',
        remarks: `Auto-assigned to ${classification.departmentName} (confidence: ${(classification.confidence * 100).toFixed(0)}%)`,
      });
    } else {
      // Low confidence — needs manual review
      complaint.status = 'Needs Review';
      complaint.statusHistory.push({
        status: 'Needs Review',
        remarks: 'Could not auto-classify — needs manual department assignment',
      });
    }

    await complaint.save();

    res.status(201).json({
      status: 'success',
      message: 'Complaint submitted successfully!',
      data: { complaint },
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ status: 'error', message: messages.join('. ') });
    }
    console.error('Submit complaint error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit complaint' });
  }
});

// =============================================================
// GET /api/complaints/mine — Get my complaints (students)
// =============================================================
router.get('/mine', protect, studentOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find({ complainant: req.user._id })
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      results: complaints.length,
      data: { complaints },
    });
  } catch (error) {
    console.error('Fetch complaints error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch complaints' });
  }
});

// =============================================================
// GET /api/complaints/department — Get complaints for my department (staff)
// =============================================================
router.get('/department', protect, staffOrAdmin, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'staff') {
      // Staff sees only their department's complaints
      filter.department = req.user.department;
    }
    // Admin sees all complaints (no filter)

    const complaints = await Complaint.find(filter)
      .populate('department', 'name')
      .populate('complainant', 'name email hostel rollNumber')
      .sort({ createdAt: -1 });

    // For anonymous complaints, hide complainant info (unless sensitive department)
    const sanitized = complaints.map(c => {
      const obj = c.toObject();
      if (obj.isAnonymous && req.user.role !== 'admin') {
        obj.complainant = { name: 'Anonymous', email: 'hidden' };
      }
      return obj;
    });

    res.json({
      status: 'success',
      results: sanitized.length,
      data: { complaints: sanitized },
    });
  } catch (error) {
    console.error('Fetch dept complaints error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch complaints' });
  }
});

// =============================================================
// GET /api/complaints/:id — Get single complaint detail
// =============================================================
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('department', 'name')
      .populate('complainant', 'name email hostel rollNumber')
      .populate('statusHistory.changedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    // Access control
    const isOwner = complaint.complainant._id.toString() === req.user._id.toString();
    const isStaffForDept = req.user.role === 'staff' &&
      complaint.department &&
      complaint.department._id.toString() === (req.user.department || '').toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isStaffForDept && !isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    const obj = complaint.toObject();
    if (obj.isAnonymous && !isOwner && !isAdmin) {
      obj.complainant = { name: 'Anonymous', email: 'hidden' };
    }

    res.json({
      status: 'success',
      data: { complaint: obj },
    });
  } catch (error) {
    console.error('Fetch complaint error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch complaint' });
  }
});

// =============================================================
// PATCH /api/complaints/:id/status — Update complaint status (staff/admin)
// =============================================================
router.patch('/:id/status', protect, staffOrAdmin, async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    // Update status
    complaint.status = status;
    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      remarks: remarks || '',
      timestamp: new Date(),
    });

    // If resolved, set resolvedAt
    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    res.json({
      status: 'success',
      message: `Complaint status updated to "${status}"`,
      data: { complaint },
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update status' });
  }
});

// =============================================================
// PATCH /api/complaints/:id/reassign — Reassign to another dept (admin)
// =============================================================
router.patch('/:id/reassign', protect, adminOnly, async (req, res) => {
  try {
    const { departmentId, remarks } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    complaint.department = departmentId;
    complaint.status = 'Assigned';
    complaint.statusHistory.push({
      status: 'Assigned',
      changedBy: req.user._id,
      remarks: remarks || 'Reassigned by admin',
      timestamp: new Date(),
    });

    await complaint.save();

    res.json({
      status: 'success',
      message: 'Complaint reassigned successfully',
      data: { complaint },
    });
  } catch (error) {
    console.error('Reassign error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reassign complaint' });
  }
});

// =============================================================
// PATCH /api/complaints/:id/feedback — Rate a resolved complaint (student)
// =============================================================
router.patch('/:id/feedback', protect, studentOnly, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ status: 'error', message: 'Complaint not found' });
    }

    if (complaint.complainant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'You can only rate your own complaints' });
    }

    if (complaint.status !== 'Resolved') {
      return res.status(400).json({ status: 'error', message: 'Can only rate resolved complaints' });
    }

    complaint.feedback = {
      rating,
      comment: comment || '',
      submittedAt: new Date(),
    };

    await complaint.save();

    res.json({
      status: 'success',
      message: 'Thank you for your feedback!',
      data: { complaint },
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit feedback' });
  }
});

module.exports = router;
