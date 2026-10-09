import { CAMPUSFIX_DEPARTMENTS } from '../../shared/constants/departments';

export function createDemoCampusLandscape() {
  return {
    updatedAt: new Date().toISOString(),
    departments: CAMPUSFIX_DEPARTMENTS.map((name) => ({ name, count: 0 })),
    summary: {
      totalReports: 0, openReports: 0, newReports: 0, waitingReports: 0,
      inProgressReports: 0, resolvedReports: 0, closedReports: 0,
      resolutionRate: null, averageResponseHours: null, responseTimeSamples: 0,
      unassignedReports: 0, unlocatedReports: 0, highPriorityReports: 0,
      linkedRepeatReports: 0, recurringIssueCount: 0, recurringLocationCount: 0,
    },
    statusCounts: { Received: 0, Assigned: 0, 'In Progress': 0, Resolved: 0, Closed: 0, Escalated: 0, 'Needs Review': 0 },
    departmentCounts: Object.fromEntries([...CAMPUSFIX_DEPARTMENTS.map((name) => [name, 0]), ['unassigned', 0]]),
    priorityCounts: { low: 0, medium: 0, high: 0, urgent: 0 },
    locations: [],
    timeline: [],
  };
}
