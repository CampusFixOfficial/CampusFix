const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const CampusSettings = require('../models/CampusSettings');
const { protect, adminOnly } = require('../core/auth/middleware');
const { normalizeManagedLocationIds } = require('../core/location/locationScopes');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/location-catalogue', async (req, res) => {
  try {
    const settings = await CampusSettings.findOne({ key: 'location-catalogue' }).lean();
    res.json({ status: 'success', data: { hostelLocations: settings?.hostelLocations || [], messLocations: settings?.messLocations || [] } });
  } catch (error) {
    console.error('Location catalogue load error:', error);
    res.status(500).json({ status: 'error', message: 'Could not load the campus location catalogue.' });
  }
});

router.put('/location-catalogue', async (req, res) => {
  try {
    const hostelLocations = Array.isArray(req.body.hostelLocations) ? req.body.hostelLocations.slice(0, 200) : [];
    const messLocations = Array.isArray(req.body.messLocations) ? req.body.messLocations.slice(0, 200) : [];
    if (hostelLocations.some((item) => !item?.id || !item?.displayName) || messLocations.some((item) => !item?.id || !item?.displayName)) {
      return res.status(400).json({ status: 'error', message: 'Every location needs an ID and display name.' });
    }
    const settings = await CampusSettings.findOneAndUpdate(
      { key: 'location-catalogue' },
      { $set: { hostelLocations, messLocations, updatedBy: req.user._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.json({ status: 'success', data: { hostelLocations: settings.hostelLocations, messLocations: settings.messLocations } });
  } catch (error) {
    console.error('Location catalogue save error:', error);
    res.status(400).json({ status: 'error', message: 'Could not save the campus location catalogue.' });
  }
});

const normalizeEmployeeId = (value) => String(value || '').trim().toUpperCase();
const isValidEmployeeId = (value) => /^[A-Z0-9][A-Z0-9._/-]{1,39}$/.test(value);

router.get('/authorities', async (req, res) => {
  try {
    const authorities = await User.find({ role: 'staff' })
      .select('name email employeeId department managedLocations isActive createdAt')
      .populate('department', 'name')
      .sort({ name: 1 });
    res.json({ status: 'success', results: authorities.length, data: { authorities } });
  } catch (error) {
    console.error('Authority list error:', error);
    res.status(500).json({ status: 'error', message: 'Could not load authority accounts.' });
  }
});

router.post('/authorities', async (req, res) => {
  try {
    const { name, email, password, departmentId } = req.body;
    const employeeId = normalizeEmployeeId(req.body.employeeId);
    if (!name || !email || !password || password.length < 8 || !isValidEmployeeId(employeeId) || !mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({ status: 'error', message: 'Provide a name, valid email, employee ID, department and password of at least 8 characters.' });
    }

    const department = await Department.findOne({ _id: departmentId, isActive: true });
    if (!department) return res.status(400).json({ status: 'error', message: 'Choose an active CampusFix department.' });

    const scopeSelection = normalizeManagedLocationIds(req.body.managedLocations || [], department.name);
    if (!scopeSelection.valid) return res.status(400).json({ status: 'error', message: scopeSelection.message });

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) return res.status(409).json({ status: 'error', message: 'An account already uses this email.' });
    const existingEmployeeId = await User.findOne({ employeeId });
    if (existingEmployeeId) return res.status(409).json({ status: 'error', message: 'That employee ID is already assigned to an account.' });

    const managedLocations = ['Hostel Administration', 'Mess / Food Services'].includes(department.name) ? scopeSelection.values : [];
    const authority = await User.create({ name, email, employeeId, password, role: 'staff', department: department._id, managedLocations, isActive: true });
    res.status(201).json({ status: 'success', data: { authority: { id: authority._id, name: authority.name, email: authority.email, employeeId: authority.employeeId, department, managedLocations } } });
  } catch (error) {
    if (error.code === 11000 && (error.keyPattern?.employeeId || error.keyValue?.employeeId)) {
      return res.status(409).json({ status: 'error', message: 'That employee ID is already assigned to an account.' });
    }
    console.error('Authority creation error:', error);
    res.status(400).json({ status: 'error', message: 'Could not create the authority account.' });
  }
});

router.patch('/authorities/:id', async (req, res) => {
  try {
    const { departmentId, isActive } = req.body;
    const update = {};
    const currentAuthority = await User.findOne({ _id: req.params.id, role: 'staff' }).populate('department', 'name');
    if (!currentAuthority) return res.status(404).json({ status: 'error', message: 'Authority account not found.' });

    if (req.body.employeeId !== undefined) {
      const employeeId = normalizeEmployeeId(req.body.employeeId);
      if (!isValidEmployeeId(employeeId)) return res.status(400).json({ status: 'error', message: 'Enter an employee ID using 2–40 letters, numbers or . _ / - characters.' });
      const duplicate = await User.exists({ employeeId, _id: { $ne: req.params.id } });
      if (duplicate) return res.status(409).json({ status: 'error', message: 'That employee ID is already assigned to another account.' });
      update.employeeId = employeeId;
    }
    if (departmentId !== undefined) {
      const nextDepartment = mongoose.isValidObjectId(departmentId) ? await Department.findOne({ _id: departmentId, isActive: true }) : null;
      if (!nextDepartment) {
        return res.status(400).json({ status: 'error', message: 'Choose an active CampusFix department.' });
      }
      update.department = departmentId;
      if (!['Hostel Administration', 'Mess / Food Services'].includes(nextDepartment.name)) update.managedLocations = [];
    }
    const effectiveDepartmentName = departmentId !== undefined
      ? (await Department.findById(departmentId))?.name
      : currentAuthority.department?.name;
    if (req.body.managedLocations !== undefined) {
      const scopeSelection = normalizeManagedLocationIds(req.body.managedLocations, effectiveDepartmentName);
      if (!scopeSelection.valid) return res.status(400).json({ status: 'error', message: scopeSelection.message });
      update.managedLocations = ['Hostel Administration', 'Mess / Food Services'].includes(effectiveDepartmentName) ? scopeSelection.values : [];
    }
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const authority = await User.findOneAndUpdate({ _id: req.params.id, role: 'staff' }, { $set: update }, { new: true }).populate('department', 'name');
    if (!authority) return res.status(404).json({ status: 'error', message: 'Authority account not found.' });
    res.json({ status: 'success', data: { authority: { id: authority._id, name: authority.name, email: authority.email, employeeId: authority.employeeId, department: authority.department, managedLocations: authority.managedLocations || [], isActive: authority.isActive } } });
  } catch (error) {
    if (error.code === 11000 && (error.keyPattern?.employeeId || error.keyValue?.employeeId)) {
      return res.status(409).json({ status: 'error', message: 'That employee ID is already assigned to another account.' });
    }
    console.error('Authority update error:', error);
    res.status(400).json({ status: 'error', message: 'Could not update this authority account.' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const [total, active, resolved, needsAttention] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
      Complaint.countDocuments({ status: { $in: ['Received', 'Needs Review', 'Escalated'] } }),
    ]);
    res.json({ status: 'success', data: { total, active, resolved, needsAttention } });
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({ status: 'error', message: 'Could not load the CampusFix overview.' });
  }
});

module.exports = router;
