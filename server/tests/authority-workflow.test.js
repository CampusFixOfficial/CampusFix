const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Department = require('../models/Department');
const { DEFAULT_DEPARTMENTS } = require('../config/departments');
const { classifyByKeywords } = require('../core/classifier/keywordClassifier');
const { parseProblemLocation, inferPriority } = require('../core/location/parseLocation');
const { getHostelScope, isStaffAssignedToReport, buildStaffReportFilter } = require('../core/location/locationScopes');

const shareSource = fs.readFileSync(path.resolve(__dirname, '../../client/src/student-portal/utils/authorityShare.js'), 'utf8');
const shareModuleUrl = `data:text/javascript;base64,${Buffer.from(shareSource).toString('base64')}`;

async function withMockDepartments(run) {
  const originalFind = Department.find;
  Department.find = async () => DEFAULT_DEPARTMENTS.map((department, index) => ({
    ...department,
    _id: `demo-department-${index}`,
    isActive: true,
  }));
  try { return await run(); }
  finally { Department.find = originalFind; }
}

test('washroom report routes to Housekeeping & Hygiene and is visible only to the matching Block 5 Warden', async () => {
  await withMockDepartments(async () => {
    const description = "The washrooms of Block 5 Men's Hostel, 6th floor, B wing are dirty.";
    const [routing] = await Promise.all([classifyByKeywords(description)]);
    const location = parseProblemLocation(description);
    const warden = { role: 'staff', department: 'demo-department-3', managedLocations: ['boys-hostel-block-5'] };
    const complaint = { department: routing.departmentId, problemLocation: location.structure };

    assert.equal(routing.departmentName, 'Housekeeping & Hygiene');
    assert.equal(inferPriority(description, routing.departmentName), 'high');
    assert.equal(location.display, "Block 5 · Men's Hostel · 6th Floor · B Wing");
    assert.equal(isStaffAssignedToReport(warden, complaint), true);
    assert.equal(isStaffAssignedToReport(warden, { ...complaint, problemLocation: { ...location.structure, block: 'Block 6' } }), false);
    assert.ok(getHostelScope('boys-hostel-block-5'));
    const filter = buildStaffReportFilter(warden);
    assert.ok(!Object.hasOwn(filter, 'department'), 'scoped Warden must not inherit the whole Hostel Administration queue');
  });
});

test('Room 604 fan report routes to Technical & Maintenance and reaches the Block 5 Warden without a Technical Head account', async () => {
  await withMockDepartments(async () => {
    const description = 'The fan in Room 604 of Block 5 is not working.';
    const routing = await classifyByKeywords(description);
    const location = parseProblemLocation(description);
    const warden = { role: 'staff', department: 'demo-department-3', managedLocations: ['boys-hostel-block-5'] };
    assert.equal(routing.departmentName, 'Technical & Maintenance');
    assert.equal(inferPriority(description, routing.departmentName), 'medium');
    assert.equal(location.display, "Block 5 · Men's Hostel · Room 604");
    assert.equal(isStaffAssignedToReport(warden, { department: routing.departmentId, problemLocation: location.structure }), true);
  });
});

test('Hostel Warden access follows problem location, never the student residence', async () => {
  const warden = { role: 'staff', department: 'hostel-admin', managedLocations: ['boys-hostel-block-5'] };
  const blockFiveReport = {
    department: 'technical-team',
    problemLocation: { block: 'Block 5', areaBuilding: "Men's Hostel", specificArea: 'Room 504' },
    complainant: { hostel: "Men's Hostel · Block 5" },
  };
  const blockSixReportForBlockFiveResident = {
    department: 'technical-team',
    problemLocation: { block: 'Block 6', areaBuilding: "Men's Hostel", specificArea: 'Room 604' },
    complainant: { hostel: "Men's Hostel · Block 5" },
  };

  assert.equal(isStaffAssignedToReport(warden, blockFiveReport), true);
  assert.equal(isStaffAssignedToReport(warden, blockSixReportForBlockFiveResident), false);
  const filter = buildStaffReportFilter(warden);
  assert.equal(filter.$or[0]['problemLocation.block'].toString(), '/^Block 5$/i');
  assert.equal(filter.$or[0]['problemLocation.areaBuilding'].toString(), "/^Men's Hostel$/i");
  assert.equal(filter.$or[1].location.toString(), "/Block 5.*Men's Hostel/i");
});

test('WhatsApp drafts are professional, issue-specific and omit student identity details', async () => {
  const { buildAuthorityWhatsAppMessage } = await import(shareModuleUrl);
  const studentPrivateData = { name: 'Demo Student', email: 'student@example.invalid', registrationNumber: 'DEMO-001' };
  const washroom = buildAuthorityWhatsAppMessage({
    _id: 'report-cleaning-001',
    description: "The washrooms of Block 5 Men's Hostel, 6th floor, B wing are dirty.",
    location: "Block 5 · Men's Hostel · 6th Floor · B Wing",
    problemLocation: { block: 'Block 5', areaBuilding: "Men's Hostel", floor: '6th Floor', wing: 'B Wing' },
    department: { name: 'Housekeeping & Hygiene' }, priority: 'high', status: 'Assigned', complainant: studentPrivateData,
  }, { hostelWarden: true });
  assert.match(washroom, /CampusFix — Hostel Complaint/);
  assert.match(washroom, /A cleanliness issue has been reported/);
  assert.match(washroom, /6th Floor, B Wing/);
  assert.match(washroom, /Housekeeping & Hygiene/);
  assert.match(washroom, /Please arrange for the concerned cleaning team/);
  assert.match(washroom, /CampusFix \/ Hostel Warden/);
  assert.doesNotMatch(washroom, /student@example\.invalid|DEMO-001|Demo Student/);

  const technical = buildAuthorityWhatsAppMessage({
    _id: 'report-fan-604',
    description: 'The fan in Room 604 of Block 5 is not working.',
    problemLocation: { block: 'Block 5', areaBuilding: "Men's Hostel", specificArea: 'Room 604' },
    department: { name: 'Technical & Maintenance' }, priority: 'medium',
  }, { hostelWarden: true });
  assert.match(technical, /CampusFix — Hostel Maintenance Complaint/);
  assert.match(technical, /maintenance issue/);
  assert.match(technical, /Room 604/);
  assert.match(technical, /Priority: Normal/);
  assert.match(technical, /Technical & Maintenance/);
  assert.match(technical, /CF-REPORT-FAN-604/);
});
