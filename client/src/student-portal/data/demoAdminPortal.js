import { CAMPUSFIX_DEPARTMENTS } from '../../shared/constants/departments';

const TEAM_META = {
  'Technical & Maintenance': {
    slug: 'technical-maintenance',
    description: 'Repairs, electrical, plumbing, infrastructure and campus maintenance.',
    keywords: ['fan', 'light', 'electrical', 'plumbing', 'leak', 'repair', 'projector', 'lift'],
    slaHours: 24,
  },
  'Housekeeping & Hygiene': {
    slug: 'housekeeping-hygiene',
    description: 'Cleanliness, sanitation, waste, washrooms and pest concerns.',
    keywords: ['dirty', 'cleaning', 'washroom', 'toilet', 'garbage', 'hygiene', 'sanitation', 'drain'],
    slaHours: 24,
  },
  'Mess / Food Services': {
    slug: 'mess-food-services',
    description: 'Mess meals, food quality, dining service and drinking-water service.',
    keywords: ['food', 'meal', 'mess', 'breakfast', 'lunch', 'dinner', 'menu', 'drinking water'],
    slaHours: 24,
  },
  'Hostel Administration': {
    slug: 'hostel-administration',
    description: 'Hostel room allocation, resident services, facilities and administration.',
    keywords: ['room allotment', 'hostel office', 'warden', 'room change', 'hostel rules'],
    slaHours: 48,
  },
  'Discipline, Safety & Wellbeing': {
    slug: 'discipline-safety-wellbeing',
    description: 'Safety, harassment, anti-ragging, wellbeing and conduct concerns.',
    keywords: ['bullying', 'harassment', 'ragging', 'unsafe', 'safety', 'wellbeing'],
    slaHours: 6,
    isSensitive: true,
  },
};

const EMPTY_LANDSCAPE = {
  summary: {
    totalReports: 0, openReports: 0, newReports: 0, waitingReports: 0,
    inProgressReports: 0, resolvedReports: 0, closedReports: 0,
    resolutionRate: null, averageResponseHours: null, responseTimeSamples: 0,
    unassignedReports: 0, unlocatedReports: 0, highPriorityReports: 0,
    linkedRepeatReports: 0, recurringIssueCount: 0, recurringLocationCount: 0,
  },
  departments: CAMPUSFIX_DEPARTMENTS.map((name) => ({ name, count: 0 })),
  departmentCounts: Object.fromEntries([...CAMPUSFIX_DEPARTMENTS.map((name) => [name, 0]), ['unassigned', 0]]),
  statusCounts: { Received: 0, Assigned: 0, 'In Progress': 0, Resolved: 0, Closed: 0, Escalated: 0, 'Needs Review': 0 },
  priorityCounts: { low: 0, medium: 0, high: 0, urgent: 0 },
  locations: [],
  timeline: [],
};

export function createDemoAdminData() {
  const departments = CAMPUSFIX_DEPARTMENTS.map((name) => {
    const meta = TEAM_META[name];
    return {
      _id: `team-${meta.slug}`,
      name,
      description: meta.description,
      keywords: [...meta.keywords],
      slaHours: meta.slaHours,
      isSensitive: Boolean(meta.isSensitive),
      isActive: true,
    };
  });

  // The Admin workspace starts empty until real MongoDB records are created.
  return {
    departments,
    authorities: [],
    complaints: [],
    platformFeedback: [],
    landscape: EMPTY_LANDSCAPE,
  };
}
