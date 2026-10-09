const cron = require('node-cron');
const Complaint = require('../../models/Complaint');

const OPEN_STATUSES = ['Received', 'Assigned', 'In Progress', 'Needs Review'];

async function escalateOverdueComplaints(now = new Date()) {
  const overdue = await Complaint.find({
    status: { $in: OPEN_STATUSES },
    expectedResolutionAt: { $ne: null, $lt: now },
  });
  if (!overdue.length) return 0;
  await Promise.all(overdue.map(async (complaint) => {
    complaint.status = 'Escalated';
    complaint.statusHistory.push({ status: 'Escalated', remarks: 'The expected resolution time has passed. CampusFix escalated this report for attention.' });
    await complaint.save();
  }));
  return overdue.length;
}

function startEscalationScheduler() {
  const task = cron.schedule('*/15 * * * *', async () => {
    try {
      const count = await escalateOverdueComplaints();
      if (count) console.log(`[CampusFix] Escalated ${count} overdue report(s).`);
    } catch (error) {
      console.error('[CampusFix] SLA escalation failed:', error.message);
    }
  });
  return task;
}

module.exports = { OPEN_STATUSES, escalateOverdueComplaints, startEscalationScheduler };
