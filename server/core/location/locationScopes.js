const campusLocations = require('../../../shared/campus-locations.json');
const { parseProblemLocation } = require('./parseLocation');

const LOCATION_FIELDS = ['campus', 'block', 'areaBuilding', 'floor', 'wing', 'specificArea'];
const hostelScopes = new Map();
const messScopes = new Map();

function addScope(target, locationId, label, match, matchAny) {
  if (!locationId || (!match && !matchAny)) return;
  target.set(locationId, {
    locationId,
    label,
    match: match ? Object.fromEntries(LOCATION_FIELDS.filter((key) => match[key]).map((key) => [key, match[key]])) : null,
    matchAny: Array.isArray(matchAny) ? matchAny.map((entry) => Object.fromEntries(LOCATION_FIELDS.filter((key) => entry[key]).map((key) => [key, entry[key]]))) : null,
  });
}

for (const group of campusLocations.groups || []) {
  for (const location of group.locations || []) {
    const match = location.match || null;
    if (match?.block && /hostel/i.test(match.areaBuilding || '')) {
      addScope(hostelScopes, location.id, location.displayName || location.label, match);
    }
  }
}

// These are the only non-wing Hostel Warden choices. A block scope matches any
// complaint carrying that block, regardless of floor or wing detail.
addScope(hostelScopes, 'girls-hostel-block-1', 'Girls Block 1', { block: 'Block 1', areaBuilding: "Women's Hostel" });
addScope(hostelScopes, 'mayuri-special-block', 'Girls Accommodation / Special Block', { areaBuilding: 'Mayuri / Special Block' });
addScope(hostelScopes, 'dining-hostel', 'Large Dining Block', { areaBuilding: 'Dining Hostel' });

// Mess Authority locations are deliberately separate from the Hostel Warden list.
addScope(messScopes, 'mess-mayuri', 'Mayuri', { areaBuilding: 'Mayuri / Special Block' });
addScope(messScopes, 'mess-safal', 'Safal', { specificArea: 'Safal Mess' });
addScope(messScopes, 'mess-jmb', 'JMB', { specificArea: 'JMB Mess' });
addScope(messScopes, 'mess-ab', 'AB', null, [{ specificArea: 'AB' }, { specificArea: 'Mayuri / AB Dakshin' }]);
addScope(messScopes, 'mess-dakshin', 'Dakshin', null, [{ specificArea: 'Dakshin' }, { specificArea: 'Mayuri / AB Dakshin' }]);
addScope(messScopes, 'mess-rassannce', 'Rassannce', { specificArea: 'Rassannce Mess' });

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
}

function getHostelScope(locationId) {
  return getScope(String(locationId || ''), hostelScopes, 'hostel');
}

function getMessScope(locationId) {
  return getScope(String(locationId || ''), messScopes, 'mess');
}

function titleFromSlug(value) {
  return String(value || '').split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function getScope(locationId, scopes, kind) {
  if (scopes.has(locationId)) return scopes.get(locationId);
  if (kind === 'hostel' && locationId.startsWith('custom-hostel-')) {
    const raw = locationId.slice('custom-hostel-'.length);
    const girls = raw.endsWith('-girls-hostel');
    const block = titleFromSlug(girls ? raw.slice(0, -'-girls-hostel'.length) : raw.slice(0, -'-boys-hostel'.length));
    if (block) return { locationId, label: block, match: { block, areaBuilding: girls ? "Women's Hostel" : "Men's Hostel" } };
  }
  if (kind === 'mess' && locationId.startsWith('custom-mess-')) {
    const specificArea = titleFromSlug(locationId.slice('custom-mess-'.length));
    if (specificArea) return { locationId, label: specificArea, match: { specificArea } };
  }
  return null;
}

function scopeMapForDepartment(departmentName) {
  return departmentName === 'Mess / Food Services' ? messScopes : hostelScopes;
}

function normalizeManagedLocationIds(values, departmentName = 'Hostel Administration') {
  if (!Array.isArray(values)) return { valid: false, values: [], message: 'Choose locations from the CampusFix location list.' };
  const unique = [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
  const scopes = scopeMapForDepartment(departmentName);
  if (unique.length > 40) return { valid: false, values: [], message: 'Choose no more than 40 managed locations.' };
  const kind = departmentName === 'Mess / Food Services' ? 'mess' : 'hostel';
  if (unique.some((id) => !getScope(id, scopes, kind))) return { valid: false, values: [], message: departmentName === 'Mess / Food Services' ? 'Choose Mess Authority locations from the mess list.' : 'Choose Hostel Warden blocks from the hostel list.' };
  return { valid: true, values: unique };
}

function normalizeHostelScopeIds(values) {
  return normalizeManagedLocationIds(values, 'Hostel Administration');
}

function fieldsForComplaint(complaint) {
  const structure = complaint?.problemLocation && typeof complaint.problemLocation === 'object' ? complaint.problemLocation : {};
  const values = LOCATION_FIELDS.map((field) => structure[field] || '');
  if (values.some(Boolean)) return structure;
  return parseProblemLocation('', complaint?.location || '').structure || {};
}

function matchesFields(actual, expected) {
  return Object.entries(expected || {}).every(([field, expectedValue]) => normalize(actual[field]) === normalize(expectedValue));
}

function scopeMatches(scope, actual) {
  if (scope?.match && matchesFields(actual, scope.match)) return true;
  return Array.isArray(scope?.matchAny) && scope.matchAny.some((match) => matchesFields(actual, match));
}

function matchesLocationMap(user, complaint, scopes) {
  const ids = Array.isArray(user?.managedLocations) ? user.managedLocations : [];
  const actual = fieldsForComplaint(complaint);
  return ids.some((id) => {
    const scope = getScope(String(id || ''), scopes, scopes === messScopes ? 'mess' : 'hostel');
    return scope ? scopeMatches(scope, actual) : false;
  });
}

function matchesHostelLocation(user, complaint) {
  return matchesLocationMap(user, complaint, hostelScopes);
}

function matchesManagedLocation(user, complaint) {
  const departmentName = user?.department?.name || user?.departmentName || 'Hostel Administration';
  return matchesLocationMap(user, complaint, scopeMapForDepartment(departmentName));
}

function departmentId(value) {
  return String(value?._id || value || '');
}

function isStaffAssignedToReport(user, complaint) {
  if (!user || user.role !== 'staff' || !complaint) return false;
  const departmentName = user.department?.name || user.departmentName || '';
  const scopes = scopeMapForDepartment(departmentName);
  const kind = scopes === messScopes ? 'mess' : 'hostel';
  const scopedLocations = Array.isArray(user.managedLocations) ? user.managedLocations.filter((id) => getScope(String(id), scopes, kind)) : [];
  if (scopedLocations.length) return matchesLocationMap({ ...user, managedLocations: scopedLocations }, complaint, scopes);
  const departmentMatches = departmentId(complaint.department) !== '' && departmentId(complaint.department) === departmentId(user.department);
  return Boolean(departmentMatches);
}

function clauseForScope(scope) {
  const variants = scope.matchAny?.length ? scope.matchAny : [scope.match];
  return variants.map((match) => {
    const exact = Object.fromEntries(Object.entries(match).map(([field, value]) => [`problemLocation.${field}`, new RegExp(`^${String(value).replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}$`, 'i')]));
    const fallbackText = Object.values(match).map((value) => String(value).replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')).join('.*');
    return { $or: [exact, { location: new RegExp(fallbackText, 'i') }] };
  });
}

function buildStaffReportFilter(user) {
  const clauses = [];
  const teamId = departmentId(user?.department);
  const departmentName = user?.department?.name || user?.departmentName || '';
  const scopes = scopeMapForDepartment(departmentName);
  const kind = scopes === messScopes ? 'mess' : 'hostel';
  const scopedLocations = (user?.managedLocations || []).filter((id) => getScope(String(id), scopes, kind));
  if (!scopedLocations.length && teamId) clauses.push({ department: teamId });
  for (const id of scopedLocations) {
    const scope = getScope(String(id), scopes, kind);
    if (scope) clauses.push(...clauseForScope(scope));
  }
  if (!clauses.length) return { _id: { $exists: false } };
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

module.exports = {
  getHostelScope,
  getMessScope,
  normalizeHostelScopeIds,
  normalizeManagedLocationIds,
  matchesHostelLocation,
  matchesManagedLocation,
  isStaffAssignedToReport,
  buildStaffReportFilter,
  HOSTEL_GROUP_IDS: new Set(['boys-hostels', 'girls-residence-and-mayuri']),
};
