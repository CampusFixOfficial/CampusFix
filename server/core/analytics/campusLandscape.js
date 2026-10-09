const { DEFAULT_DEPARTMENTS } = require('../../config/departments');
const { parseProblemLocation } = require('../location/parseLocation');

const DEPARTMENT_NAMES = DEFAULT_DEPARTMENTS.map((department) => department.name);
const STATUSES = ['Received', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Escalated', 'Needs Review'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const RESPONSE_STATUSES = new Set(['Assigned', 'In Progress', 'Resolved', 'Closed', 'Escalated']);

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function round(value, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function problemLocationFor(complaint) {
  const stored = complaint?.problemLocation && typeof complaint.problemLocation === 'object'
    ? complaint.problemLocation
    : {};
  // Never infer the problem site from report prose or the student profile; use the structured site or location field only.
  const parsed = parseProblemLocation('', complaint?.location || '').structure;
  const problemLocation = {
    campus: clean(stored.campus) || clean(parsed.campus),
    block: clean(stored.block) || clean(parsed.block),
    areaBuilding: clean(stored.areaBuilding) || clean(parsed.areaBuilding),
    floor: clean(stored.floor) || clean(parsed.floor),
    wing: clean(stored.wing) || clean(parsed.wing),
    specificArea: clean(stored.specificArea) || clean(parsed.specificArea),
  };
  const parts = [problemLocation.block, problemLocation.areaBuilding, problemLocation.floor, problemLocation.wing, problemLocation.specificArea].filter(Boolean);
  return { problemLocation, label: parts.join(' · ') || 'Location to be confirmed' };
}

function locationKey(problemLocation) {
  const fields = ['block', 'areaBuilding', 'floor', 'wing', 'specificArea'];
  const values = fields.map((field) => clean(problemLocation[field]).toLowerCase().replace(/\s+/g, ' '));
  return values.some(Boolean) ? values.map((value) => encodeURIComponent(value)).join('|') : '__location-to-be-confirmed__';
}

function startOfUtcWeek(date) {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysAfterMonday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - daysAfterMonday);
  return monday;
}

function responseMilliseconds(complaint, createdAt) {
  const candidates = [];
  const acknowledgedAt = asDate(complaint?.acknowledgedAt);
  if (acknowledgedAt) candidates.push(acknowledgedAt);
  for (const event of complaint?.statusHistory || []) {
    if (!RESPONSE_STATUSES.has(event?.status)) continue;
    const timestamp = asDate(event.timestamp);
    if (timestamp) candidates.push(timestamp);
  }
  const responseAt = candidates
    .filter((date) => date >= createdAt)
    .sort((left, right) => left - right)[0];
  return responseAt ? responseAt.getTime() - createdAt.getTime() : null;
}

function emptyDepartmentCounts() {
  return Object.fromEntries([...DEPARTMENT_NAMES.map((name) => [name, 0]), ['unassigned', 0]]);
}

function emptyStatusCounts() {
  return Object.fromEntries(STATUSES.map((status) => [status, 0]));
}

function emptyPriorityCounts() {
  return Object.fromEntries(PRIORITIES.map((priority) => [priority, 0]));
}

function addResponse(bucket, responseMs) {
  if (responseMs === null) return;
  bucket.responseTimeTotalMs += responseMs;
  bucket.responseTimeSamples += 1;
}

function finishBucket(bucket) {
  return {
    ...bucket,
    averageResponseHours: bucket.responseTimeSamples
      ? round(bucket.responseTimeTotalMs / bucket.responseTimeSamples / 3_600_000)
      : null,
  };
}

function aggregateCampusLandscape(complaints = [], now = new Date()) {
  const currentTime = asDate(now) || new Date();
  const departmentCounts = emptyDepartmentCounts();
  const statusCounts = emptyStatusCounts();
  const priorityCounts = emptyPriorityCounts();
  const locationMap = new Map();
  let responseTimeTotalMs = 0;
  let responseTimeSamples = 0;
  let resolved = 0;
  let closed = 0;
  let inProgress = 0;
  let unlocatedReports = 0;
  let linkedRepeatReports = 0;

  const currentWeek = startOfUtcWeek(currentTime);
  const firstWeek = new Date(currentWeek);
  firstWeek.setUTCDate(firstWeek.getUTCDate() - 7 * 7);
  const timeline = Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(firstWeek);
    weekStart.setUTCDate(weekStart.getUTCDate() + index * 7);
    return {
      weekStart: weekStart.toISOString(),
      label: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      count: 0,
    };
  });
  const timelineIndex = new Map(timeline.map((week, index) => [week.weekStart, index]));

  for (const complaint of complaints) {
    const { problemLocation, label } = problemLocationFor(complaint);
    const key = locationKey(problemLocation);
    let location = locationMap.get(key);
    if (!location) {
      location = {
        id: key,
        label,
        problemLocation,
        total: 0,
        departmentCounts: emptyDepartmentCounts(),
        statusCounts: emptyStatusCounts(),
        priorityCounts: emptyPriorityCounts(),
        linkedRepeatReports: 0,
        recurringGroupIds: new Set(),
        responseTimeTotalMs: 0,
        responseTimeSamples: 0,
      };
      locationMap.set(key, location);
    }

    location.total += 1;
    const departmentName = complaint?.department?.name || complaint?.classification?.predictedDepartment || '';
    const departmentKey = DEPARTMENT_NAMES.includes(departmentName) ? departmentName : 'unassigned';
    location.departmentCounts[departmentKey] += 1;
    departmentCounts[departmentKey] += 1;

    const status = STATUSES.includes(complaint?.status) ? complaint.status : 'Needs Review';
    location.statusCounts[status] += 1;
    statusCounts[status] += 1;
    if (status === 'Resolved') resolved += 1;
    if (status === 'Closed') closed += 1;
    if (status === 'In Progress') inProgress += 1;

    const priority = PRIORITIES.includes(String(complaint?.priority || '').toLowerCase())
      ? String(complaint.priority).toLowerCase()
      : 'medium';
    location.priorityCounts[priority] += 1;
    priorityCounts[priority] += 1;

    const duplicateRootId = complaint?.duplicateOf ? String(complaint.duplicateOf) : '';
    if (complaint?.isDuplicate || duplicateRootId) {
      location.linkedRepeatReports += 1;
      linkedRepeatReports += 1;
    }
    if (duplicateRootId) location.recurringGroupIds.add(duplicateRootId);

    const createdAt = asDate(complaint?.createdAt);
    if (createdAt) {
      const weekStart = startOfUtcWeek(createdAt).toISOString();
      const index = timelineIndex.get(weekStart);
      if (index !== undefined) timeline[index].count += 1;
      const responseMs = responseMilliseconds(complaint, createdAt);
      if (responseMs !== null) {
        responseTimeTotalMs += responseMs;
        responseTimeSamples += 1;
        addResponse(location, responseMs);
      }
    }

    if (label === 'Location to be confirmed') unlocatedReports += 1;
  }

  const totalReports = complaints.length;
  const averageResponseHours = responseTimeSamples
    ? round(responseTimeTotalMs / responseTimeSamples / 3_600_000)
    : null;
  const locations = [...locationMap.values()]
    .map((bucket) => {
      const recurringIssueCount = bucket.recurringGroupIds.size;
      const finished = finishBucket(bucket);
      const { responseTimeTotalMs: _sum, recurringGroupIds: _privateGroupIds, ...location } = finished;
      return { ...location, recurringIssueCount };
    })
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label));
  const recurringIssueCount = [...locationMap.values()]
    .reduce((total, location) => total + location.recurringGroupIds.size, 0);
  const recurringLocationCount = [...locationMap.values()]
    .filter((location) => location.linkedRepeatReports > 0).length;
  const highPriorityReports = priorityCounts.high + priorityCounts.urgent;

  return {
    updatedAt: currentTime.toISOString(),
    departments: DEPARTMENT_NAMES.map((name) => ({ name, count: departmentCounts[name] })),
    summary: {
      totalReports,
      openReports: Math.max(0, totalReports - resolved - closed),
      newReports: statusCounts.Received,
      waitingReports: statusCounts.Received + statusCounts.Assigned + statusCounts.Escalated + statusCounts['Needs Review'],
      inProgressReports: inProgress,
      resolvedReports: resolved,
      closedReports: closed,
      resolutionRate: totalReports ? round(((resolved + closed) / totalReports) * 100, 0) : null,
      averageResponseHours,
      responseTimeSamples,
      unassignedReports: departmentCounts.unassigned,
      unlocatedReports,
      highPriorityReports,
      linkedRepeatReports,
      recurringIssueCount,
      recurringLocationCount,
    },
    statusCounts,
    departmentCounts,
    priorityCounts,
    locations,
    timeline,
  };
}

module.exports = { aggregateCampusLandscape, DEPARTMENT_NAMES, STATUSES };
