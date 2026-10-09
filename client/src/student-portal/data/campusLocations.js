import campusLocations from '../../../../shared/campus-locations.json';

export const CAMPUS_LOCATION_GROUPS = campusLocations.groups;
export const CAMPUS_NAME = campusLocations.campus;

export function flattenCampusLocations(groups = CAMPUS_LOCATION_GROUPS) {
  const flattened = [];
  const visit = (locations, group) => {
    for (const location of locations || []) {
      flattened.push({ ...location, groupId: group.id, groupLabel: group.label });
      visit(location.children, group);
    }
  };
  for (const group of groups) visit(group.locations, group);
  return flattened;
}

function normalizeLocationValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesFields(actual = {}, expected = {}) {
  const entries = Object.entries(expected).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return false;
  return entries.every(([key, value]) => normalizeLocationValue(actual[key]) === normalizeLocationValue(value));
}

export function locationMatchesAggregate(row, location) {
  const fields = row?.problemLocation || {};
  if (Array.isArray(location?.matchAny) && location.matchAny.length) {
    return location.matchAny.some((match) => matchesFields(fields, match));
  }
  return matchesFields(fields, location?.match);
}

export function getLocationChildren(location) {
  return Array.isArray(location?.children) ? location.children : [];
}

const locationById = new Map(flattenCampusLocations().map((location) => [location.id, location]));
const boysHostelBlockIds = Array.from({ length: 8 }, (_, index) => `boys-hostel-block-${index + 1}`);

// Warden responsibility is intentionally block-level. Wings and service locations
// remain available to the parser, but never become Admin scope choices.
export const HOSTEL_AUTHORITY_LOCATIONS = [
  ...boysHostelBlockIds,
  'girls-hostel-block-1',
  'mayuri-special-block',
  'dining-hostel',
].map((id) => locationById.get(id)).filter(Boolean).map((location) => ({
  ...location,
  displayName: location.id === 'mayuri-special-block'
    ? 'Girls Accommodation / Special Block'
    : location.id === 'dining-hostel'
      ? 'Large Dining Block'
      : location.displayName,
}));

// Mess Authority access is a separate responsibility from Hostel Warden access.
export const MESS_AUTHORITY_LOCATIONS = [
  { id: 'mess-mayuri', displayName: 'Mayuri' },
  { id: 'mess-safal', displayName: 'Safal' },
  { id: 'mess-jmb', displayName: 'JMB' },
  { id: 'mess-ab', displayName: 'AB' },
  { id: 'mess-dakshin', displayName: 'Dakshin' },
  { id: 'mess-rassannce', displayName: 'Rassannce' },
];

export function readManagedScopeOptions(storageKey, defaults) {
  if (typeof window === 'undefined') return defaults;
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
    return Array.isArray(saved) && saved.length ? saved : defaults;
  } catch {
    return defaults;
  }
}

export function saveManagedScopeOptions(storageKey, options) {
  if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, JSON.stringify(options));
}

export function customScopeId(kind, label, detail = '') {
  const slug = `${label}-${detail}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `custom-${kind}-${slug}`;
}
