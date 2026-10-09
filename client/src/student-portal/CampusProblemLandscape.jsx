import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CAMPUSFIX_DEPARTMENTS } from '../shared/constants/departments';
import { BrandMark, CinematicAtmosphere } from '../shared/components/CinematicAtmosphere';
import { getCampusLandscape } from './services/complaintService';
import { CAMPUS_LOCATION_GROUPS, flattenCampusLocations, locationMatchesAggregate } from './data/campusLocations';
import './StudentPortal.css';
import './CampusProblemLandscape.css';

const EMPTY_DATA = {
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

const DEPARTMENT_COLORS = {
  'Technical & Maintenance': '#a78bfa',
  'Housekeeping & Hygiene': '#f472b6',
  'Mess / Food Services': '#fbbf24',
  'Hostel Administration': '#67e8f9',
  'Discipline, Safety & Wellbeing': '#fb7185',
  unassigned: '#a1a1aa',
};

const STATUS_LABELS = [
  ['Received', 'Received'], ['Assigned', 'Assigned'], ['In Progress', 'In progress'],
  ['Resolved', 'Resolved'], ['Closed', 'Closed'], ['Escalated', 'Escalated'], ['Needs Review', 'Needs review'],
];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function number(value) {
  return new Intl.NumberFormat('en').format(Number(value || 0));
}

function hours(value) {
  if (value === null || value === undefined) return 'Not enough response history yet';
  if (value < 1) return `${Math.max(1, Math.round(value * 60))} min`;
  return `${Number(value).toFixed(value >= 10 ? 0 : 1)} hr`;
}

function percentage(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value)}%`;
}

function sumLocationRows(rows = []) {
  const departmentCounts = Object.fromEntries([...CAMPUSFIX_DEPARTMENTS.map((name) => [name, 0]), ['unassigned', 0]]);
  const statusCounts = Object.fromEntries(STATUS_LABELS.map(([key]) => [key, 0]));
  const priorityCounts = Object.fromEntries(PRIORITIES.map((key) => [key, 0]));
  let total = 0;
  let responseTotal = 0;
  let responseSamples = 0;
  let linkedRepeatReports = 0;
  let recurringIssueCount = 0;
  for (const row of rows) {
    total += Number(row.total || 0);
    for (const [name, count] of Object.entries(row.departmentCounts || {})) {
      if (Object.hasOwn(departmentCounts, name)) departmentCounts[name] += Number(count || 0);
    }
    for (const [status, count] of Object.entries(row.statusCounts || {})) {
      if (Object.hasOwn(statusCounts, status)) statusCounts[status] += Number(count || 0);
    }
    for (const [priority, count] of Object.entries(row.priorityCounts || {})) {
      if (Object.hasOwn(priorityCounts, priority)) priorityCounts[priority] += Number(count || 0);
    }
    linkedRepeatReports += Number(row.linkedRepeatReports || 0);
    recurringIssueCount += Number(row.recurringIssueCount || 0);
    const samples = Number(row.responseTimeSamples || 0);
    if (samples && Number.isFinite(Number(row.averageResponseHours))) {
      responseTotal += Number(row.averageResponseHours) * samples;
      responseSamples += samples;
    }
  }
  const resolved = statusCounts.Resolved + statusCounts.Closed;
  const highPriority = priorityCounts.high + priorityCounts.urgent;
  return {
    total, departmentCounts, statusCounts, priorityCounts, linkedRepeatReports, recurringIssueCount,
    open: Math.max(0, total - resolved), resolved, inProgress: statusCounts['In Progress'], highPriority,
    resolutionRate: total ? (resolved / total) * 100 : null,
    averageResponseHours: responseSamples ? responseTotal / responseSamples : null,
    responseSamples,
  };
}

function LocationNode({ location, selectedId, expanded, stats, attention, onSelect }) {
  const active = selectedId === location.id;
  const tier = attention >= 0.66 ? 'high' : attention >= 0.3 ? 'mid' : attention > 0 ? 'low' : 'none';
  return <button
    type="button"
    className={`landscape-node ${active ? 'is-selected' : ''} ${expanded ? 'has-children' : ''} activity-${tier}`}
    style={{ '--activity': Math.max(0, Math.min(1, attention)) }}
    onClick={() => onSelect(location)}
    aria-pressed={active}
    aria-label={`${location.displayName || location.label}, ${number(stats.total)} reports, ${number(stats.open)} open, ${number(stats.highPriority)} high priority${active ? ', selected' : ''}`}
    title={`${location.context || location.displayName || location.label} · ${number(stats.total)} reports · ${number(stats.open)} open · ${number(stats.highPriority)} high priority`}
  >
    <span className="landscape-node-label">{location.label}</span>
    <span className="landscape-node-count">{number(stats.total)} <small>{stats.total === 1 ? 'report' : 'reports'}</small></span>
    {stats.total > 0 && <span className="landscape-node-signal" aria-hidden="true"><i /><i /><i /></span>}
  </button>;
}

function Trendline({ weeks = [] }) {
  const maximum = Math.max(1, ...weeks.map((week) => Number(week.count || 0)));
  return <div className="landscape-trend" aria-label="Report volume over the last eight weeks">
    <div className="landscape-trend-bars">
      {weeks.map((week) => {
        const height = Math.max(3, Math.round((Number(week.count || 0) / maximum) * 100));
        return <div className="landscape-trend-week" key={week.weekStart}>
          <span className="landscape-trend-count">{number(week.count)}</span>
          <span className="landscape-trend-bar" style={{ height: `${height}%` }} title={`${week.label}: ${number(week.count)} reports`} />
          <span className="landscape-trend-label">{week.label}</span>
        </div>;
      })}
    </div>
  </div>;
}

function StatusProgression({ summary, statusCounts, loading }) {
  const total = Number(summary.totalReports || 0);
  const stages = [
    { label: 'New', detail: 'Received', value: Number(summary.newReports ?? statusCounts.Received ?? 0), tone: 'new' },
    { label: 'In progress', detail: 'Work underway', value: Number(summary.inProgressReports || 0), tone: 'progress' },
    { label: 'Resolved', detail: 'Resolved or closed', value: Number(summary.resolvedReports || 0) + Number(summary.closedReports || 0), tone: 'resolved' },
  ];
  return <section className="landscape-progression" aria-label="Current report status mix">
    <div className="landscape-progression-head"><span className="landscape-subtitle">CURRENT STATUS MIX</span><span>Each count is a current report state—not a funnel.</span></div>
    <div className="landscape-progress-stages">
      {stages.map((stage, index) => <div className={`landscape-progress-stage stage-${stage.tone}`} key={stage.label}>
        <div className="landscape-progress-stage-copy"><span>{stage.label}<small>{stage.detail}</small></span><strong>{loading ? '—' : number(stage.value)}</strong></div>
        <div className="landscape-progress-track"><span style={{ width: `${total ? Math.min(100, stage.value / total * 100) : 0}%` }} /></div>
        {index < stages.length - 1 && <span className="landscape-progress-connector" aria-hidden="true">›</span>}
      </div>)}
    </div>
  </section>;
}

function LocationStory({ selectedLocation, selectedSummary, selectedChildren, data, selectedId, onSelect, groupId }) {
  if (!selectedLocation) return <aside className="landscape-story landscape-story-empty" aria-live="polite" aria-label="Location details">
    <div className="landscape-story-topline"><span>PLACE DETAILS</span><span>READY TO EXPLORE</span></div>
    <div className="landscape-story-empty-mark" aria-hidden="true"><i /><i /><i /></div>
    <h2>Choose a place.</h2>
    <p>Select any campus location to see its reports, team pattern, current status and response history.</p>
    <span className="landscape-story-hint">The directory is structured by place—not by coordinates.</span>
  </aside>;

  return <aside className="landscape-story" aria-live="polite" aria-label="Selected location report pattern">
    <div className="landscape-story-topline"><span>SELECTED PLACE</span><span>{selectedSummary.total ? `${number(selectedSummary.total)} REPORTS` : 'NO REPORTS'}</span></div>
    <div className="landscape-story-path">Campus <i>›</i> {selectedLocation.groupLabel || 'Location'} <i>›</i> {selectedLocation.label}</div>
    <h2>{selectedLocation.displayName || selectedLocation.label}</h2>
    {selectedLocation.context && <p className="landscape-story-context">{selectedLocation.context}</p>}

    {selectedChildren.length > 0 && <div className="landscape-child-branch">
      <span className="landscape-subtitle">OPEN A MORE SPECIFIC PLACE</span>
      <div className="landscape-child-list">
        {selectedChildren.map((child) => {
          const rows = (data.locations || []).filter((row) => locationMatchesAggregate(row, child));
          const stats = sumLocationRows(rows);
          return <button key={child.id} className={selectedId === child.id ? 'is-selected' : ''} type="button" aria-pressed={selectedId === child.id} onClick={() => onSelect(child, groupId)}><span>{child.label}</span><strong>{number(stats.total)}</strong></button>;
        })}
      </div>
    </div>}

    <div className="landscape-location-stats">
      <div><span>Open now</span><strong>{number(selectedSummary.open)}</strong></div>
      <div><span>Resolved</span><strong>{number(selectedSummary.resolved)}</strong></div>
      <div><span>Resolution</span><strong>{percentage(selectedSummary.resolutionRate)}</strong></div>
      <div><span>First response</span><strong>{hours(selectedSummary.averageResponseHours)}</strong></div>
    </div>

    <section className="landscape-team-mix" aria-label="Report counts by CampusFix team">
      <div className="landscape-subsection-head"><span className="landscape-subtitle">TEAM PATTERN</span><span>{number(selectedSummary.total)} total</span></div>
      {CAMPUSFIX_DEPARTMENTS.map((team) => {
        const count = selectedSummary.departmentCounts[team] || 0;
        const share = selectedSummary.total ? (count / selectedSummary.total) * 100 : 0;
        return <div className="landscape-team-row" key={team}>
          <div className="landscape-team-row-label"><span><i style={{ backgroundColor: DEPARTMENT_COLORS[team] }} />{team}</span><strong>{number(count)}</strong></div>
          <div className="landscape-team-track"><span style={{ width: `${share}%`, backgroundColor: DEPARTMENT_COLORS[team] }} /></div>
        </div>;
      })}
      <div className="landscape-team-row landscape-unassigned-row">
        <div className="landscape-team-row-label"><span><i style={{ backgroundColor: DEPARTMENT_COLORS.unassigned }} />Awaiting a team</span><strong>{number(selectedSummary.departmentCounts.unassigned || 0)}</strong></div>
        <div className="landscape-team-track"><span style={{ width: `${selectedSummary.total ? ((selectedSummary.departmentCounts.unassigned || 0) / selectedSummary.total) * 100 : 0}%`, backgroundColor: DEPARTMENT_COLORS.unassigned }} /></div>
      </div>
    </section>

    <section className="landscape-status-section" aria-label="Report status counts at this location">
      <div className="landscape-subsection-head"><span className="landscape-subtitle">STATUS & RESPONSE</span><span>{number(selectedSummary.inProgress)} in progress</span></div>
      <div className="landscape-status-rail" aria-hidden="true">
        {STATUS_LABELS.map(([key]) => <span key={key} style={{ width: `${selectedSummary.total ? ((selectedSummary.statusCounts[key] || 0) / selectedSummary.total) * 100 : 0}%` }} className={`status-${key.toLowerCase().replace(/\s+/g, '-')}`} />)}
      </div>
      <div className="landscape-status-list">
        {STATUS_LABELS.filter(([key]) => selectedSummary.statusCounts[key] > 0).map(([key, label]) => <span key={key}><i className={`status-${key.toLowerCase().replace(/\s+/g, '-')}`} />{label}<strong>{number(selectedSummary.statusCounts[key])}</strong></span>)}
        {!selectedSummary.total && <span className="landscape-no-status">Status detail appears when reports are recorded here.</span>}
      </div>
      <div className="landscape-repeat-note"><span>HIGH PRIORITY</span><strong>{number(selectedSummary.highPriority)}</strong><span>LINKED REPEATS</span><strong>{number(selectedSummary.linkedRepeatReports)}</strong></div>
    </section>
  </aside>;
}

export default function CampusProblemLandscape({ demo = false, demoData = null, embedded = false }) {
  const [data, setData] = useState(demoData || EMPTY_DATA);
  const [loading, setLoading] = useState(!demoData);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [expandedGroup, setExpandedGroup] = useState('boys-hostels');
  const allLocations = useMemo(() => flattenCampusLocations(), []);
  const selectedLocation = useMemo(() => allLocations.find((item) => item.id === selectedId) || null, [allLocations, selectedId]);
  const summary = { ...EMPTY_DATA.summary, ...(data.summary || {}) };

  const load = useCallback(async () => {
    if (demo) {
      if (!demoData) setError('The illustrative preview dataset was not supplied.');
      else { setData(demoData); setError(''); }
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setData(await getCampusLandscape());
    } catch (requestError) {
      setError(requestError.message || 'The live campus landscape could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [demo, demoData]);

  useEffect(() => { load(); }, [load]);

  const locationStats = useCallback((location) => {
    const rows = (data.locations || []).filter((row) => locationMatchesAggregate(row, location));
    return sumLocationRows(rows);
  }, [data.locations]);

  const locationVisuals = useMemo(() => {
    const entries = allLocations.map((location) => {
      const stats = sumLocationRows((data.locations || []).filter((row) => locationMatchesAggregate(row, location)));
      const attention = stats.open + stats.priorityCounts.high + stats.priorityCounts.urgent * 1.6 + stats.linkedRepeatReports * 1.8 + stats.total * 0.2;
      return [location.id, { stats, attention }];
    });
    const maximum = Math.max(0, ...entries.map(([, value]) => value.attention));
    return new Map(entries.map(([id, value]) => [id, { ...value, intensity: maximum ? value.attention / maximum : 0 }]));
  }, [allLocations, data.locations]);

  const locationRows = useMemo(() => selectedLocation
    ? (data.locations || []).filter((row) => locationMatchesAggregate(row, selectedLocation))
    : [], [data.locations, selectedLocation]);
  const selectedSummary = useMemo(() => sumLocationRows(locationRows), [locationRows]);
  const selectedChildren = selectedLocation?.children || [];
  const selectLocation = (location, groupId) => {
    setSelectedId(location.id);
    if (groupId) setExpandedGroup(groupId);
  };
  const statusCounts = { ...EMPTY_DATA.statusCounts, ...(data.statusCounts || {}) };

  const page = <main className={`portal-page landscape-page${embedded ? ' landscape-page--embedded' : ''}`}>
    <header className="landscape-heading">
      <div>
        <div className="portal-kicker">CampusFix · campus-wide view</div>
        <h1 className="portal-title">Campus Problem<br /><em>Landscape.</em></h1>
        <p className="portal-subtitle">See where reports are coming from, what needs attention, and how work is moving across VIT Bhopal.</p>
      </div>
      <div className="landscape-heading-aside">
        <span className="landscape-index">PLACE · PATTERN · RESPONSE</span>
        <p>Explore campus locations as connected report places—not as map pins.</p>
        {!demo && <button className="portal-button landscape-refresh" type="button" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh landscape'}</button>}
      </div>
    </header>

    {error && <div className="landscape-error" role="alert"><strong>{demo ? 'Demo preview unavailable.' : 'Live landscape unavailable.'}</strong><span>{demo ? error : `${error} Check that the API and MongoDB are connected; this protected page does not substitute sample figures.`}</span>{!demo && import.meta.env.DEV && <Link to="/__dev/campus-problem-landscape">Open the labelled demo view</Link>}<button type="button" onClick={load}>Try again</button></div>}

    {!error && <>
      <section className="landscape-metrics" aria-label="Campus report overview">
        <div className="landscape-metric"><span>All reports</span><strong>{loading ? '—' : number(summary.totalReports)}</strong><small>Records submitted</small></div>
        <div className="landscape-metric"><span>New</span><strong>{loading ? '—' : number(summary.newReports)}</strong><small>Received, awaiting review</small></div>
        <div className="landscape-metric"><span>In progress</span><strong>{loading ? '—' : number(summary.inProgressReports)}</strong><small>Work marked as started</small></div>
        <div className="landscape-metric"><span>Resolved</span><strong>{loading ? '—' : number(Number(summary.resolvedReports) + Number(summary.closedReports))}</strong><small>Resolved or closed</small></div>
        <div className="landscape-metric"><span>Waiting</span><strong>{loading ? '—' : number(summary.waitingReports)}</strong><small>Not yet marked in progress</small></div>
        <div className="landscape-metric"><span>Resolution</span><strong>{loading ? '—' : percentage(summary.resolutionRate)}</strong><small>Of all recorded reports</small></div>
      </section>

      <section className="landscape-signal-strip" aria-label="Campus attention signals">
        <div><span className="landscape-signal-label">HIGH PRIORITY</span><strong>{loading ? '—' : number(summary.highPriorityReports)}</strong><small>High or urgent reports</small></div>
        <div><span className="landscape-signal-label">LINKED REPEATS</span><strong>{loading ? '—' : number(summary.linkedRepeatReports)}</strong><small>Reports explicitly linked as repeats</small></div>
        <div><span className="landscape-signal-label">REPEAT LOCATIONS</span><strong>{loading ? '—' : number(summary.recurringLocationCount)}</strong><small>Places with linked repeat reports</small></div>
        <div><span className="landscape-signal-label">FIRST RESPONSE</span><strong>{loading ? '—' : hours(summary.averageResponseHours)}</strong><small>{number(summary.responseTimeSamples || 0)} reports with response history</small></div>
      </section>

      <StatusProgression summary={summary} statusCounts={statusCounts} loading={loading} />

      {!loading && Number(summary.totalReports) === 0 && <div className="landscape-empty" role="status"><span className="portal-kicker">A new picture starts here</span><h2>No campus reports have been recorded yet.</h2><p>When the first report is submitted, this view will use its actual problem location and status. A student’s residence is never used as a substitute for where the issue happened.</p></div>}

      {loading ? <div className="landscape-loading" role="status">Gathering the campus picture…</div> : <>
        <div className="landscape-section-heading">
          <div><span className="portal-kicker">Location network</span><h2>Places, in context.</h2></div>
          <p>Select a place to reveal its team mix, status, response health and recent volume. Stronger signals reflect recorded open, high-priority and explicitly linked repeat reports.</p>
        </div>

        <div className="landscape-layout">
          <section className="landscape-field" aria-label="Structured CampusFix location groups">
            <div className="landscape-field-head"><span>VIT BHOPAL · PLACE DIRECTORY</span><span>Not to scale · no geographic coordinates</span></div>
            <div className="landscape-lanes">
              {CAMPUS_LOCATION_GROUPS.map((group, groupIndex) => {
                const open = expandedGroup === group.id;
                return <section className={`landscape-lane ${open ? 'is-open' : ''}`} key={group.id}>
                  <button type="button" className="landscape-lane-heading" aria-expanded={open} onClick={() => setExpandedGroup(open ? '' : group.id)}>
                    <span className="landscape-lane-index">{String(groupIndex + 1).padStart(2, '0')}</span>
                    <span className="landscape-lane-title">{group.label}<small>{group.caption}</small></span>
                    <span className="landscape-lane-toggle" aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  {open && <div className="landscape-lane-nodes">
                    {group.locations.map((location) => {
                      const visual = locationVisuals.get(location.id) || { stats: locationStats(location), intensity: 0 };
                      return <LocationNode key={location.id} location={location} selectedId={selectedId} expanded={selectedId === location.id} stats={visual.stats} attention={visual.intensity} onSelect={(item) => selectLocation(item, group.id)} />;
                    })}
                  </div>}
                </section>;
              })}
            </div>
            <div className="landscape-field-foot"><span className="landscape-live-dot" />Locations group reports by the problem place—not by a student’s home or hostel assignment.{summary.unlocatedReports > 0 && <strong>{number(summary.unlocatedReports)} {summary.unlocatedReports === 1 ? 'report needs' : 'reports need'} a confirmed problem location.</strong>}</div>
          </section>

          <LocationStory selectedLocation={selectedLocation} selectedSummary={selectedSummary} selectedChildren={selectedChildren} data={data} selectedId={selectedId} onSelect={selectLocation} groupId={selectedLocation?.groupId} />
        </div>

        <section className="landscape-volume" aria-labelledby="landscape-volume-title">
          <div className="landscape-volume-heading"><div><span className="portal-kicker">A moving picture</span><h2 id="landscape-volume-title">Campus report volume.</h2></div><span>Last 8 weeks · all known problem locations</span></div>
          <Trendline weeks={data.timeline || []} />
        </section>
      </>}

      <footer className="landscape-data-note">
        <span>DATA BOUNDARY</span>
        <p>This view contains aggregate report counts, priority, status and structured problem locations only. It does not include student names, report descriptions, photos or residence fields. A “linked repeat” is counted only when a report has an explicit duplicate link; proximity in a shared location alone is not treated as recurrence.</p>
      </footer>
    </>}
  </main>;

  if (embedded) return page;
  return <CinematicAtmosphere variant="violet" ambientEffects={false}>
    <div className="portal-topbar">
      <BrandMark />
      <nav className="portal-nav" aria-label="Admin navigation">
        {demo ? <Link to="/">CampusFix home</Link> : <><Link to="/admin">Admin overview</Link><Link to="/">CampusFix home</Link></>}
      </nav>
    </div>
    {page}
  </CinematicAtmosphere>;
}
