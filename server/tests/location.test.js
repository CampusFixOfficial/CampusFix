const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProblemLocation, inferPriority, expectedResolutionLabel } = require('../core/location/parseLocation');
const { DEFAULT_DEPARTMENTS } = require('../config/departments');
const { getHostelScope, normalizeHostelScopeIds, normalizeManagedLocationIds, matchesManagedLocation } = require('../core/location/locationScopes');

test('extracts the structured Block 5 / Men’s Hostel / 6th Floor / B Wing hierarchy', () => {
  const parsed = parseProblemLocation("The washrooms of Block 5 men's hostel, 6th floor, B wing are dirty.");
  assert.deepEqual(parsed.structure, {
    campus: '',
    block: 'Block 5',
    areaBuilding: "Men's Hostel",
    floor: '6th Floor',
    wing: 'B Wing',
    specificArea: '',
  });
  assert.equal(parsed.display, "Block 5 · Men's Hostel · 6th Floor · B Wing");
});

test('captures Room 604 in Block 5 as a hostel location without inferring a hostel from Block 5 alone', () => {
  const room = parseProblemLocation('The fan in Room 604 of Block 5 is not working.');
  assert.deepEqual(room.structure, {
    campus: '', block: 'Block 5', areaBuilding: "Men's Hostel", floor: '', wing: '', specificArea: 'Room 604',
  });
  assert.equal(room.display, "Block 5 · Men's Hostel · Room 604");
  const sharedArea = parseProblemLocation('There is a problem in the Block 5 shared area.');
  assert.equal(sharedArea.structure.areaBuilding, '');
});

test('derives a high priority and within-24-hour expectation for the washroom example', () => {
  const priority = inferPriority("The washrooms of Block 5 men's hostel, 6th floor, B wing are dirty.", 'Housekeeping & Hygiene');
  assert.equal(priority, 'high');
  assert.equal(expectedResolutionLabel(priority, 24), 'Within 24 hours');
});

test('keeps the canonical routing set to five administrator-configurable departments', () => {
  assert.deepEqual(DEFAULT_DEPARTMENTS.map((item) => item.name), [
    'Technical & Maintenance',
    'Housekeeping & Hygiene',
    'Mess / Food Services',
    'Hostel Administration',
    'Discipline, Safety & Wellbeing',
  ]);
});

test('canonicalizes named campus food, clinic, and Mayuri service locations', () => {
  const mess = parseProblemLocation('Food service at Rassannce Mess needs attention.');
  assert.equal(mess.structure.block, 'Block 1');
  assert.equal(mess.structure.areaBuilding, "Men's Hostel");
  assert.equal(mess.structure.specificArea, 'Rassannce Mess');

  const clinic = parseProblemLocation('The Dr. Morepens Clinic inside the Multipurpose Hall needs a repair.');
  assert.equal(clinic.structure.areaBuilding, 'Multipurpose Hall');
  assert.equal(clinic.structure.specificArea, 'Dr. Morepens Clinic');

  const shop = parseProblemLocation('There is an issue at the Mayuri Print Shop.');
  assert.equal(shop.structure.areaBuilding, 'Mayuri / Special Block');
  assert.equal(shop.structure.specificArea, 'Print Shop');
});

test('keeps academic buildings distinct from hostel blocks and maps Cricket Practice Net to Athletic Field', () => {
  const academic = parseProblemLocation('The front-facing Football Field by Academic Block 2 needs attention.');
  assert.equal(academic.structure.block, '');
  assert.equal(academic.structure.areaBuilding, 'Academic Block 2');
  assert.equal(academic.structure.specificArea, 'Football Field');

  const field = parseProblemLocation('The Cricket Practice Net needs repair near Block 1.');
  assert.equal(field.structure.block, 'Block 1');
  assert.equal(field.structure.specificArea, 'Athletic Field');
});

test('Warden scope choices are blocks only and a block matches detailed wings', () => {
  assert.ok(getHostelScope('boys-hostel-block-5'));
  assert.equal(getHostelScope('boys-block-5-b-wing'), null);
  assert.equal(normalizeHostelScopeIds(['boys-block-5-b-wing']).valid, false);
  assert.equal(matchesManagedLocation(
    { department: { name: 'Hostel Administration' }, managedLocations: ['boys-hostel-block-5'] },
    { problemLocation: { block: 'Block 5', areaBuilding: "Men's Hostel", floor: '6th Floor', wing: 'B Wing' } },
  ), true);
});

test('Mess Authority scopes use a separate named-location list', () => {
  assert.deepEqual(normalizeManagedLocationIds(['mess-mayuri', 'mess-rassannce'], 'Mess / Food Services').values, ['mess-mayuri', 'mess-rassannce']);
  assert.equal(normalizeManagedLocationIds(['boys-hostel-block-5'], 'Mess / Food Services').valid, false);
  assert.equal(matchesManagedLocation(
    { department: { name: 'Mess / Food Services' }, managedLocations: ['mess-rassannce'] },
    { problemLocation: { block: 'Block 1', areaBuilding: "Men's Hostel", specificArea: 'Rassannce Mess' } },
  ), true);
});

test('Admin-added block and mess IDs resolve to matching report locations', () => {
  assert.equal(normalizeManagedLocationIds(['custom-hostel-block-9-boys-hostel'], 'Hostel Administration').valid, true);
  assert.equal(matchesManagedLocation(
    { department: { name: 'Hostel Administration' }, managedLocations: ['custom-hostel-block-9-boys-hostel'] },
    { problemLocation: { block: 'Block 9', areaBuilding: "Men's Hostel", floor: '1st Floor' } },
  ), true);
  assert.equal(normalizeManagedLocationIds(['custom-mess-north-dining-hall'], 'Mess / Food Services').valid, true);
  assert.equal(matchesManagedLocation(
    { department: { name: 'Mess / Food Services' }, managedLocations: ['custom-mess-north-dining-hall'] },
    { problemLocation: { specificArea: 'North Dining Hall' } },
  ), true);
});
