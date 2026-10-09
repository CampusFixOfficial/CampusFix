const CAMPUS_LOCATION_CATALOG = require('../../../shared/campus-locations.json');

function normalizeLocationText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function flattenAliasRules(groups = CAMPUS_LOCATION_CATALOG.groups) {
  const rules = [];
  const visit = (locations) => {
    for (const location of locations || []) {
      for (const alias of location.aliases || []) {
        const normalizedAlias = normalizeLocationText(alias);
        if (normalizedAlias) rules.push({ alias: normalizedAlias, match: location.match || {} });
      }
      visit(location.children);
    }
  };
  for (const group of groups) visit(group.locations);
  return rules.sort((left, right) => right.alias.length - left.alias.length);
}

const CAMPUS_LOCATION_ALIAS_RULES = flattenAliasRules();

function applyNamedLocation(source, structure) {
  const normalizedSource = ` ${normalizeLocationText(source)} `;
  const assigned = new Set();
  for (const rule of CAMPUS_LOCATION_ALIAS_RULES) {
    if (!normalizedSource.includes(` ${rule.alias} `)) continue;
    for (const [field, value] of Object.entries(rule.match)) {
      if (!value || assigned.has(field)) continue;
      if (field === 'areaBuilding' && structure.areaBuilding && structure.areaBuilding !== 'Hostel') continue;
      structure[field] = value;
      assigned.add(field);
    }
  }
}

function parseProblemLocation(text = '', explicitLocation = '') {
  const source = `${text} ${explicitLocation}`.replace(/\s+/g, ' ').trim();
  const hasAcademicBlock = /\bacademic\s+block\s*[-#]?\s*\d\b/i.test(source);
  const blockMatch = hasAcademicBlock ? null : source.match(/\bblock\s*[-#]?\s*(\d+[a-z]?)\b/i);
  const floorMatch = source.match(/\b(\d{1,2})(st|nd|rd|th)?\s+floor\b/i);
  const wingMatch = source.match(/\b([a-z])\s*[- ]?wing\b/i);
  const roomMatch = source.match(/\broom\s+([a-z0-9-]+)\b/i);
  const hostelMatch = source.match(/\b(men'?s|mens|boys'?|boys|women'?s|womens|girls'?|girls)\s+hostel\b/i);

  const structure = {
    campus: '',
    block: blockMatch ? `Block ${blockMatch[1].toUpperCase()}` : '',
    areaBuilding: '',
    floor: floorMatch ? `${floorMatch[1]}${floorMatch[2] || ''} Floor` : '',
    wing: wingMatch ? `${wingMatch[1].toUpperCase()} Wing` : '',
    specificArea: roomMatch ? `Room ${roomMatch[1].toUpperCase()}` : '',
  };

  if (hostelMatch) {
    const kind = hostelMatch[1].toLowerCase();
    structure.areaBuilding = /men|boy/.test(kind) ? "Men's Hostel" : "Women's Hostel";
  } else if (/\b(hostel|residence|dorm)\b/i.test(source)) {
    structure.areaBuilding = 'Hostel';
  }

  applyNamedLocation(source, structure);

  // The canonical VIT Bhopal catalogue identifies Block 5's room-numbered residential
  // locations as the Men's Hostel. A bare "Block 5" is not enough to assume residence;
  // require an explicit room reference before filling that missing structured field.
  if (structure.block === 'Block 5' && !structure.areaBuilding && /\broom\s*[a-z0-9-]+\b/i.test(source)) {
    structure.areaBuilding = "Men's Hostel";
  }

  const parts = [structure.block, structure.areaBuilding, structure.floor, structure.wing, structure.specificArea].filter(Boolean);
  const display = parts.length
    ? parts.join(' · ')
    : (explicitLocation || '').trim();

  return { structure, display };
}

function inferPriority(text = '', departmentName = '') {
  const normalized = text.toLowerCase();
  if (/\b(fire|emergency|life[- ]?threat|serious injury|assault|immediate danger|gas leak)\b/.test(normalized)) return 'urgent';
  if (/\b(unsafe|safety|harass|harassment|ragging|bully|bullying|threat|electric shock|short circuit|leak|flood|overflow|dirty|filthy|washroom|toilet|contaminat)\b/.test(normalized)) return 'high';
  if (departmentName === 'Discipline, Safety & Wellbeing') return 'high';
  return 'medium';
}

function expectedResolutionLabel(priority, departmentSlaHours = 24) {
  const hours = priority === 'urgent' ? Math.min(departmentSlaHours, 6)
    : priority === 'high' ? Math.min(departmentSlaHours, 24)
      : departmentSlaHours;
  if (hours < 24) return `Within ${hours} hours`;
  if (hours === 24) return 'Within 24 hours';
  const days = Math.ceil(hours / 24);
  return `Within ${days} day${days === 1 ? '' : 's'}`;
}

module.exports = { parseProblemLocation, inferPriority, expectedResolutionLabel, normalizeLocationText };
