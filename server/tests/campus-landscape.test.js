const test = require('node:test');
const assert = require('node:assert/strict');
const { aggregateCampusLandscape, DEPARTMENT_NAMES } = require('../core/analytics/campusLandscape');

const now = new Date('2026-10-05T12:00:00.000Z');

function report(overrides = {}) {
  return {
    status: 'Resolved',
    priority: 'high',
    department: { name: 'Housekeeping & Hygiene' },
    location: "Block 5 · Men's Hostel · 6th Floor · B Wing",
    problemLocation: {
      campus: '',
      block: 'Block 5',
      areaBuilding: "Men's Hostel",
      floor: '6th Floor',
      wing: 'B Wing',
      specificArea: 'Washroom',
    },
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    acknowledgedAt: null,
    statusHistory: [
      { status: 'Received', timestamp: new Date('2026-10-01T10:00:00.000Z') },
      { status: 'Assigned', timestamp: new Date('2026-10-01T16:00:00.000Z') },
      { status: 'Resolved', timestamp: new Date('2026-10-02T10:00:00.000Z') },
    ],
    complainant: { hostel: "Men's Hostel · Block 3" },
    ...overrides,
  };
}

test('aggregates by problem location, not the student’s residence, and omits identity data', () => {
  const data = aggregateCampusLandscape([report()], now);
  assert.equal(data.summary.totalReports, 1);
  assert.equal(data.summary.resolvedReports, 1);
  assert.equal(data.summary.resolutionRate, 100);
  assert.equal(data.summary.averageResponseHours, 6);
  assert.equal(data.locations[0].problemLocation.block, 'Block 5');
  assert.equal(data.locations[0].problemLocation.floor, '6th Floor');
  assert.equal(data.locations[0].problemLocation.wing, 'B Wing');
  assert.equal(Object.hasOwn(data.locations[0], 'complainant'), false);
  assert.equal(Object.hasOwn(data.locations[0], 'description'), false);
});

test('preserves the five primary teams and reports unassigned complaints separately', () => {
  const data = aggregateCampusLandscape([
    report(),
    report({ status: 'Needs Review', department: null, classification: null, createdAt: new Date('2026-10-02T10:00:00.000Z'), statusHistory: [] }),
  ], now);
  assert.deepEqual(data.departments.map((department) => department.name), DEPARTMENT_NAMES);
  assert.equal(data.summary.unassignedReports, 1);
  assert.equal(data.departmentCounts.unassigned, 1);
  assert.equal(data.summary.openReports, 1);
});

test('keeps an unknown problem place in a visible unlocated bucket without using residence data', () => {
  const data = aggregateCampusLandscape([
    report({ location: '', problemLocation: {}, complainant: { hostel: "Men's Hostel · Block 3" } }),
  ], now);
  assert.equal(data.summary.unlocatedReports, 1);
  assert.equal(data.locations[0].label, 'Location to be confirmed');
  assert.deepEqual(data.locations[0].problemLocation, {
    campus: '', block: '', areaBuilding: '', floor: '', wing: '', specificArea: '',
  });
});

test('returns empty-data metrics without inventing a resolution rate or response time', () => {
  const data = aggregateCampusLandscape([], now);
  assert.equal(data.summary.totalReports, 0);
  assert.equal(data.summary.resolutionRate, null);
  assert.equal(data.summary.averageResponseHours, null);
  assert.equal(data.summary.newReports, 0);
  assert.equal(data.summary.waitingReports, 0);
  assert.equal(data.summary.highPriorityReports, 0);
  assert.equal(data.summary.linkedRepeatReports, 0);
  assert.equal(data.summary.recurringIssueCount, 0);
  assert.equal(data.timeline.length, 8);
  assert.ok(data.timeline.every((week) => week.count === 0));
});

test('counts priority and recurrence only from actual report fields and keeps repeat IDs private', () => {
  const data = aggregateCampusLandscape([
    report({ status: 'Received', priority: 'high' }),
    report({ status: 'Assigned', priority: 'urgent', isDuplicate: true, duplicateOf: 'private-root-id' }),
    report({ status: 'In Progress', priority: 'medium', isDuplicate: true, duplicateOf: 'private-root-id' }),
  ], now);

  assert.equal(data.summary.newReports, 1);
  assert.equal(data.summary.waitingReports, 2);
  assert.equal(data.summary.highPriorityReports, 2);
  assert.equal(data.summary.linkedRepeatReports, 2);
  assert.equal(data.summary.recurringIssueCount, 1);
  assert.equal(data.summary.recurringLocationCount, 1);
  assert.equal(data.locations[0].linkedRepeatReports, 2);
  assert.equal(data.locations[0].recurringIssueCount, 1);
  assert.equal(JSON.stringify(data).includes('private-root-id'), false);
});
