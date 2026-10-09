const express = require('express');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const { protect, studentOnly, staffOrAdmin, staffOnly, adminOnly } = require('../core/auth/middleware');
const { classifyByKeywords } = require('../core/classifier/keywordClassifier');
const { parseProblemLocation, inferPriority, expectedResolutionLabel } = require('../core/location/parseLocation');
const { buildStaffReportFilter, isStaffAssignedToReport, matchesManagedLocation } = require('../core/location/locationScopes');
const { notifyStudent } = require('../core/notifications/notificationService');
const { sendComplaintUpdateEmail } = require('../core/notifications/emailService');
const { uploadEvidenceImages } = require('../core/storage/cloudinaryService');

const router = express.Router();
const STATUSES = ['Received', 'Assigned', 'In Progress', 'Resolved', 'Escalated', 'Needs Review', 'Closed'];
const TRANSITIONS = {
  Received: ['Assigned', 'Needs Review', 'Escalated'],
  Assigned: ['In Progress', 'Escalated', 'Needs Review'],
  'In Progress': ['Resolved', 'Escalated'],
  Escalated: ['Assigned', 'In Progress', 'Needs Review'],
  'Needs Review': ['Assigned', 'Escalated'],
  Resolved: ['Closed'],
  Closed: [],
};

function safeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.slice(0, 3).map((image) => typeof image === 'string' ? { url: image } : image).filter((image) => {
    const url = String(image?.url || '');
    return url.length <= 700000 && (/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(url) || /^https:\/\//i.test(url));
  });
}

function departmentId(value) {
  return String(value?._id || value || '');
}

function accessLabel(user, complaint) {
  const hasLocationScope = Array.isArray(user?.managedLocations) && user.managedLocations.length > 0;
  const locationMatches = hasLocationScope && matchesManagedLocation(user, complaint);
  const isTeamAuthority = !hasLocationScope && departmentId(user.department) && departmentId(user.department) === departmentId(complaint.department);
  return locationMatches || !isTeamAuthority ? 'location' : 'team';
}

router.post('/', protect, studentOnly, async (req, res) => {
  try {
    const description = String(req.body.description || '').trim();
    if (description.length < 8) return res.status(400).json({ status: 'error', message: 'Add a little more detail about what happened.' });
    if (description.length > 2000) return res.status(400).json({ status: 'error', message: 'Keep your description under 2,000 characters.' });
    const title = String(req.body.title || description.split(/[.!?\n]/)[0].slice(0, 100) || 'Campus issue').trim();
    const explicitLocation = String(req.body.location || '').trim();
    const { structure, display } = parseProblemLocation(description, explicitLocation);
    const classification = await classifyByKeywords(`${title} ${description}`);
    const priority = inferPriority(`${title} ${description}`, classification.departmentName);
    const department = classification.departmentId ? await Department.findById(classification.departmentId) : null;
    const slaHours = department?.slaHours || classification.slaHours || 24;
    const status = department ? 'Assigned' : 'Needs Review';
    const createdAt = new Date();
    const uploadedImages = await uploadEvidenceImages(req.body.images, `pending-${req.user._id}`);
    const complaint = new Complaint({
      title,
      description,
      complainant: req.user._id,
      location: display,
      problemLocation: structure,
      priority,
      images: safeImages(uploadedImages),
      department: department?._id || null,
      status,
      expectedResolutionAt: new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000),
      expectedResolutionLabel: expectedResolutionLabel(priority, slaHours),
      classification: { method: classification.method, confidence: classification.confidence, predictedDepartment: classification.departmentName || 'Needs Review' },
      statusHistory: department
        ? [
            { status: 'Received', changedBy: req.user._id, remarks: 'Your report was received by CampusFix.' },
            { status: 'Assigned', changedBy: req.user._id, remarks: 'CampusFix found the right team for your report.' },
          ]
        : [{ status: 'Needs Review', changedBy: req.user._id, remarks: 'CampusFix is finding the right team to review your report.' }],
    });
    await complaint.save();
    const populated = await Complaint.findById(complaint._id).populate('department', 'name').populate('complainant', 'name email registrationNumber rollNumber studentType hostel');
    const recipients = [sendComplaintUpdateEmail(populated.complainant, populated, 'Your report was received', 'Your CampusFix report has been submitted successfully and is now in the CampusFix workflow.')];
    if (populated.department?._id) {
      const authorities = await User.find({ role: 'staff', department: populated.department._id, isActive: true }).select('name email').lean();
      recipients.push(...authorities.map((authority) => sendComplaintUpdateEmail(authority, populated, 'New report assigned to your team', `A new report has been assigned to ${populated.department.name}. Please review it in the Authority dashboard.`)));
    }
    await Promise.all(recipients);
    res.status(201).json({ status: 'success', message: 'Your report has been created.', data: { complaint: populated } });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ status: 'error', message: Object.values(error.errors).map((item) => item.message).join('. ') });
    console.error('Submit complaint error:', error);
    res.status(500).json({ status: 'error', message: 'Could not submit your report. Please try again.' });
  }
});

router.get('/mine', protect, studentOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find({ complainant: req.user._id }).populate('department', 'name').sort({ createdAt: -1 });
    res.json({ status: 'success', results: complaints.length, data: { complaints } });
  } catch (error) {
    console.error('Fetch student reports error:', error);
    res.status(500).json({ status: 'error', message: 'Could not load your reports.' });
  }
});

router.get('/department', protect, staffOrAdmin, async (req, res) => {
  try {
    const filter = req.user.role === 'staff' ? buildStaffReportFilter(req.user) : {};
    const complaints = await Complaint.find(filter)
      .populate('department', 'name')
      .populate('complainant', 'name email registrationNumber rollNumber studentType hostel')
      .sort({ createdAt: -1 });
    const data = req.user.role === 'staff'
      ? complaints.map((complaint) => ({ ...complaint.toObject(), authorityAccess: accessLabel(req.user, complaint) }))
      : complaints;
    res.json({ status: 'success', results: data.length, data: { complaints: data } });
  } catch (error) {
    console.error('Fetch authority queue error:', error);
    res.status(500).json({ status: 'error', message: 'Could not load the complaint queue.' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('department', 'name')
      .populate('complainant', 'name email registrationNumber rollNumber studentType hostel')
      .populate('statusHistory.changedBy', 'name role');
    if (!complaint) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    const ownerId = complaint.complainant?._id?.toString();
    const isOwner = ownerId === req.user._id.toString();
    const isAuthority = isStaffAssignedToReport(req.user, complaint);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAuthority && !isAdmin) return res.status(403).json({ status: 'error', message: 'You do not have access to this report.' });
    const safeComplaint = complaint.toObject();
    // Student-visible remarks intentionally expose only the display role, text and time.
    safeComplaint.authorityRemarks = (safeComplaint.authorityRemarks || []).map(({ authorLabel, message, timestamp }) => ({ authorLabel, message, timestamp }));
    if (req.user.role === 'staff') safeComplaint.authorityAccess = accessLabel(req.user, complaint);
    res.json({ status: 'success', data: { complaint: safeComplaint } });
  } catch (error) {
    console.error('Fetch report error:', error);
    res.status(400).json({ status: 'error', message: 'Could not load this report.' });
  }
});

router.post('/:id/remarks', protect, staffOnly, async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (message.length < 3) return res.status(400).json({ status: 'error', message: 'Write a short update before adding it.' });
    if (message.length > 1200) return res.status(400).json({ status: 'error', message: 'Keep the update under 1,200 characters.' });
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    if (!isStaffAssignedToReport(req.user, complaint)) return res.status(403).json({ status: 'error', message: 'This report is outside your team and assigned hostel locations.' });
    const isWarden = req.user.department?.name === 'Hostel Administration' && matchesManagedLocation(req.user, complaint);
    complaint.authorityRemarks.push({
      author: req.user._id,
      authorLabel: isWarden ? 'Hostel Warden' : 'Authority',
      message,
      timestamp: new Date(),
    });
    await complaint.save();
    await notifyStudent(complaint, { type: 'remark', title: 'New update on your report', message: 'An Authority added a new update to your CampusFix report.' });
    const remarks = complaint.authorityRemarks.map(({ authorLabel, message: text, timestamp }) => ({ authorLabel, message: text, timestamp }));
    res.status(201).json({ status: 'success', message: 'The student can see this update.', data: { remarks } });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ status: 'error', message: Object.values(error.errors).map((item) => item.message).join('. ') });
    console.error('Authority remark error:', error);
    res.status(500).json({ status: 'error', message: 'The update could not be saved.' });
  }
});

router.patch('/:id/acknowledge', protect, staffOrAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    if (req.user.role === 'staff' && !isStaffAssignedToReport(req.user, complaint)) return res.status(403).json({ status: 'error', message: 'This report is outside your team and assigned hostel locations.' });
    if (!['Received', 'Assigned'].includes(complaint.status)) return res.status(400).json({ status: 'error', message: 'This report has already moved beyond acknowledgement.' });
    complaint.acknowledgedAt = complaint.acknowledgedAt || new Date();
    if (complaint.status === 'Received') complaint.status = 'Assigned';
    complaint.statusHistory.push({ status: complaint.status, changedBy: req.user._id, remarks: 'The assigned team has acknowledged this report.' });
    await complaint.save();
    await notifyStudent(complaint, { type: 'status', title: 'Your report was acknowledged', message: 'The assigned CampusFix team has acknowledged your report.' });
    res.json({ status: 'success', data: { complaint } });
  } catch (error) {
    console.error('Acknowledge error:', error);
    res.status(400).json({ status: 'error', message: 'Could not acknowledge this report.' });
  }
});

router.patch('/:id/status', protect, staffOrAdmin, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!STATUSES.includes(status)) return res.status(400).json({ status: 'error', message: 'Choose a valid report status.' });
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    if (req.user.role === 'staff' && !isStaffAssignedToReport(req.user, complaint)) return res.status(403).json({ status: 'error', message: 'This report is outside your team and assigned hostel locations.' });
    if (req.user.role !== 'admin' && !TRANSITIONS[complaint.status]?.includes(status)) return res.status(400).json({ status: 'error', message: `This report cannot move from ${complaint.status} to ${status}.` });
    complaint.status = status;
    complaint.statusHistory.push({ status, changedBy: req.user._id, remarks: String(remarks || '').trim() || `The report is now ${status.toLowerCase()}.` });
    if (status === 'Resolved') complaint.resolvedAt = new Date();
    await complaint.save();
    await notifyStudent(complaint, { type: 'status', title: `Report ${status.toLowerCase()}`, message: `Your CampusFix report is now marked as ${status}.` });
    res.json({ status: 'success', message: 'Report status updated.', data: { complaint } });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(400).json({ status: 'error', message: 'Could not update this report.' });
  }
});

router.patch('/:id/reassign', protect, adminOnly, async (req, res) => {
  try {
    const { departmentId, remarks } = req.body;
    const [complaint, department] = await Promise.all([Complaint.findById(req.params.id), Department.findOne({ _id: departmentId, isActive: true })]);
    if (!complaint) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    if (!department) return res.status(400).json({ status: 'error', message: 'Choose an active CampusFix team.' });
    complaint.department = department._id;
    complaint.status = 'Assigned';
    complaint.classification.predictedDepartment = department.name;
    complaint.statusHistory.push({ status: 'Assigned', changedBy: req.user._id, remarks: String(remarks || 'The report has been assigned to the appropriate team.').trim() });
    await complaint.save();
    await notifyStudent(complaint, { type: 'assignment', title: 'Your report was reassigned', message: `Your report is now assigned to ${department.name}.` });
    res.json({ status: 'success', message: 'Report reassigned.', data: { complaint } });
  } catch (error) {
    console.error('Reassign error:', error);
    res.status(400).json({ status: 'error', message: 'Could not reassign this report.' });
  }
});

router.patch('/:id/feedback', protect, studentOnly, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    if (complaint.complainant.toString() !== req.user._id.toString()) return res.status(403).json({ status: 'error', message: 'You can only rate your own reports.' });
    if (complaint.status !== 'Resolved') return res.status(400).json({ status: 'error', message: 'Feedback is available after a report is resolved.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ status: 'error', message: 'Choose a rating from 1 to 5.' });
    if (complaint.feedback?.submittedAt) return res.status(409).json({ status: 'error', message: 'Feedback has already been submitted.' });
    complaint.feedback = { rating, comment: String(req.body.comment || '').trim(), submittedAt: new Date() };
    await complaint.save();
    res.json({ status: 'success', message: 'Thank you for your feedback.', data: { complaint } });
  } catch (error) {
    console.error('Resolution feedback error:', error);
    res.status(400).json({ status: 'error', message: 'Could not save your feedback.' });
  }
});

module.exports = router;
