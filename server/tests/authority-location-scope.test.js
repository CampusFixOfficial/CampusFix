const test = require('node:test');
const assert = require('node:assert/strict');
const { getHostelScope, normalizeHostelScopeIds, matchesHostelLocation, isStaffAssignedToReport, buildStaffReportFilter } = require('../core/location/locationScopes');
const { parseProblemLocation } = require('../core/location/parseLocation');

test('Block 5 warden scope comes from the canonical catalogue and matches nested report locations', () => {
  const scope = getHostelScope('boys-hostel-block-5');
  assert.ok(scope);
  assert.equal(scope.match.block, 'Block 5');
  assert.equal(scope.match.areaBuilding, "Men's Hostel");
  const warden = { role: 'staff', department: 'hostel-admin-id', managedLocations: [scope.locationId] };
  const report = { department: 'housekeeping-id', location: "Block 5 · Men's Hostel · 6th Floor · B Wing · Washroom", problemLocation: { block: 'Block 5', areaBuilding: "Men's Hostel", floor: '6th Floor', wing: 'B Wing', specificArea: 'Washroom' } };
  assert.equal(matchesHostelLocation(warden, report), true);
  assert.equal(isStaffAssignedToReport(warden, report), true);
});

test('the two requested student descriptions structure to Block 5 Hostel Warden-visible locations', () => {
  const warden = { role: 'staff', department: 'hostel-admin-id', managedLocations: ['boys-hostel-block-5'] };
  const cases = [
    ["The washrooms of Block 5 Men's Hostel, 6th floor, B wing are dirty.", { block: 'Block 5', areaBuilding: "Men's Hostel", floor: '6th Floor', wing: 'B Wing' }],
    ['The fan in Room 604 of Block 5 is not working.', { block: 'Block 5', areaBuilding: "Men's Hostel", specificArea: 'Room 604' }],
  ];
  for (const [description, expected] of cases) {
    const location = parseProblemLocation(description).structure;
    for (const [field, value] of Object.entries(expected)) assert.equal(location[field], value, `${field} should parse for: ${description}`);
    const report = { department: 'operational-team-id', problemLocation: location };
    assert.equal(matchesHostelLocation(warden, report), true);
    assert.equal(isStaffAssignedToReport(warden, report), true);
  }
});

test('location-based authority does not get reports from a different hostel/block', () => {
  const warden = { role: 'staff', department: 'hostel-admin-id', managedLocations: ['boys-hostel-block-5'] };
  assert.equal(matchesHostelLocation(warden, { problemLocation: { block: 'Block 6', areaBuilding: "Men's Hostel" } }), false);
});

test('invalid or non-hostel location IDs cannot be attached as a warden scope', () => {
  assert.equal(normalizeHostelScopeIds(['boys-hostel-block-5']).valid, true);
  assert.equal(normalizeHostelScopeIds(['academic-block-2']).valid, false);
  assert.equal(normalizeHostelScopeIds(['fake-location']).valid, false);
});

test('a location-scoped Warden sees only explicit locations, while ordinary Authorities retain team queues', () => {
  const filter = buildStaffReportFilter({ department: 'hostel-admin-id', managedLocations: ['boys-hostel-block-5'] });
  assert.ok(!Object.hasOwn(filter, 'department'));
  assert.ok(Array.isArray(filter.$or));
  assert.ok(filter.$or.some((clause) => clause['problemLocation.block']));
  assert.deepEqual(buildStaffReportFilter({ department: 'hygiene-team-id' }), { department: 'hygiene-team-id' });
});
