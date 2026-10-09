// =============================================================
// CampusFix - Student Portal Dashboard
// =============================================================
// Console-style operational hub for students.
// Integrated telemetry metrics, live activity stream, and dispatch actions.
// Zero emojis — pure typography, SVG indicators, and atmospheric glass.
// Owner: Pranjal Singh (Student Portal)
// =============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { getMyComplaints, getNotifications } from './services/complaintService';
import {
  PlusCircleIcon,
  ListIcon,
  ClockIcon,
  CheckCircleIcon,
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  RefreshIcon,
  InboxIcon,
  BuildingIcon,
  CalendarIcon,
  MapPinIcon,
  ShieldIcon,
} from './components/Icons';
import './StudentPortal.css';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';
import BlurText from '../components/react-bits/BlurText';
import BorderGlow from '../components/react-bits/BorderGlow';
import SpecularButton from '../components/react-bits/SpecularButton';
import PlatformFeedback from '../shared/components/PlatformFeedback';

export default function StudentDashboard({ preview = false, previewUser = null, initialComplaints = null }) {
  const { user: authenticatedUser, logout } = useAuth();
  const user = previewUser || authenticatedUser;
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch real complaints data for the authenticated student
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (initialComplaints) {
      setComplaints(initialComplaints);
      setLoading(false);
      return;
    }
    try {
      const data = await getMyComplaints();
      setComplaints(data || []);
    } catch (err) {
      setError(err.message || 'Your reports could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [initialComplaints]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);
  useEffect(() => {
    if (preview) return undefined;
    getNotifications().then((data) => setNotifications(data.notifications || [])).catch(() => {});
    return undefined;
  }, [preview]);

  // Compute live statistics dynamically from real API data
  const stats = useMemo(() => {
    const total = complaints.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;

    complaints.forEach((item) => {
      const status = item.status;
      if (status === 'In Progress') {
        inProgress++;
      } else if (status === 'Resolved' || status === 'Closed') {
        resolved++;
      } else {
        pending++;
      }
    });

    return { total, pending, inProgress, resolved };
  }, [complaints]);

  // Extract up to 5 most recent complaints
  const recentComplaints = useMemo(() => {
    return complaints.slice(0, 5);
  }, [complaints]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  // Status badge class mapper
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Received':
        return 'sp-status-chip received';
      case 'Assigned':
        return 'sp-status-chip assigned';
      case 'In Progress':
        return 'sp-status-chip in-progress';
      case 'Resolved':
        return 'sp-status-chip resolved';
      case 'Escalated':
        return 'sp-status-chip escalated';
      case 'Needs Review':
        return 'sp-status-chip review';
      case 'Closed':
        return 'sp-status-chip closed';
      default:
        return 'sp-status-chip received';
    }
  };

  // Priority indicator rail helper
  const getPriorityRailClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'sp-priority-rail urgent';
      case 'high':
        return 'sp-priority-rail high';
      case 'medium':
        return 'sp-priority-rail medium';
      case 'low':
        return 'sp-priority-rail low';
      default:
        return 'sp-priority-rail medium';
    }
  };

  const studentName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <CinematicAtmosphere showDock={!preview} variant="blue">
      <div className="portal-topbar"><BrandMark /><div className="portal-nav"><Link to={preview ? '/__dev/complaints' : '/complaints'}>My reports</Link><Link to={preview ? '/__dev/report-issue' : '/complaints/new'}>Report issue</Link><button type="button" className="sp-feedback-nav" onClick={() => setFeedbackOpen(true)}>Feedback</button>{!preview && <button type="button" className="sp-feedback-nav" onClick={logout}>Log out</button>}</div></div>
      <PlatformFeedback open={feedbackOpen} onClose={() => setFeedbackOpen(false)} source="student-portal" demo={preview} />
    <div className="sp-page">
      <div className="sp-container">

        {/* =============================================================
            1. Console Header: Clean Typography & Telemetry Eyebrow
           ============================================================= */}
        <header className="sp-console-header sp-animate-fade">
          <div className="sp-console-info">
            <div className="sp-console-eyebrow">
              <span className="sp-live-pulse" />
              <span>Your CampusFix space</span>
            </div>
            <h1 className="sp-console-title"><BlurText text={`Welcome back, ${studentName}`} delay={55} className="sp-dashboard-blur-title" /></h1>
            <p className="sp-console-subtitle">
              Everything you have reported, understood, and moving toward resolution.
            </p>
          </div>

          <div className="sp-console-actions">
            <SpecularButton size="md" radius={14} tint="#fff" tintOpacity={0.04} blur={7} textColor="#fff" lineColor="#9EDBFF" baseColor="#2563EB" intensity={0.9} speed={0.3} proximity={220} onClick={() => navigate(preview ? '/__dev/report-issue' : '/complaints/new')}><PlusCircleIcon size={16} /> <span>Report an issue</span></SpecularButton>
            <Link to={preview ? '/__dev/complaints' : '/complaints'} className="btn btn-secondary">
              <ListIcon size={16} />
              <span>All reports</span>
            </Link>
          </div>
        </header>

        {/* =============================================================
            Error State Banner (if API fetch fails)
           ============================================================= */}
        {error && (
          <div className="sp-error-banner sp-animate-fade" role="alert">
            <div className="sp-error-left">
              <div className="sp-error-icon-box">
                <AlertCircleIcon size={20} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <h4>Your reports could not load</h4>
                <p>{error}</p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadComplaints}>
              <RefreshIcon size={14} /> Try again
            </button>
          </div>
        )}
        {!preview && notifications.length > 0 && <section className="sp-notification-panel" aria-labelledby="student-notifications-title"><div className="sp-notification-heading"><div><div className="sp-console-eyebrow">Latest updates</div><h2 id="student-notifications-title">Notifications</h2></div><span>{notifications.filter((item) => !item.readAt).length} unread</span></div><div className="sp-notification-list">{notifications.slice(0, 4).map((item) => <Link to={item.complaint ? `/complaints/${item.complaint}` : '/dashboard'} className={`sp-notification-item ${item.readAt ? '' : 'unread'}`} key={item._id}><strong>{item.title}</strong><span>{item.message}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently'}</small></Link>)}</div></section>}

        {/* =============================================================
            2. Integrated Telemetry Deck (Unified metrics deck)
           ============================================================= */}
        <section className="sp-telemetry-deck sp-animate-fade" aria-label="Your report overview"><BorderGlow className="sp-telemetry-shell" edgeSensitivity={28} glowColor="210 85 75" backgroundColor="rgba(10, 24, 52, .42)" borderRadius={22} glowRadius={28} glowIntensity={0.48} colors={['#60A5FA', '#38BDF8', '#A78BFA']}>
          {loading ? (
            <div className="sp-skeleton" style={{ height: '110px', width: '100%' }} />
          ) : (
            <div className="sp-telemetry-grid">

              {/* Bay 1: Total */}
              <div className="sp-telemetry-bay">
                <div className="sp-bay-header">
                  <span className="sp-bay-label">Total Filed</span>
                  <ListIcon size={16} className="sp-bay-icon" />
                </div>
                <div className="sp-bay-val">{stats.total}</div>
                <span className="sp-bay-tag">Reports submitted</span>
              </div>

              {/* Bay 2: Pending Triage */}
              <div className="sp-telemetry-bay">
                <div className="sp-bay-header">
                  <span className="sp-bay-label">Being Reviewed</span>
                  <ClockIcon size={16} className="sp-bay-icon warning" />
                </div>
                <div className="sp-bay-val">{stats.pending}</div>
                <span className="sp-bay-tag warning">Waiting for the next step</span>
              </div>

              {/* Bay 3: Active Remediation */}
              <div className="sp-telemetry-bay">
                <div className="sp-bay-header">
                  <span className="sp-bay-label">In Progress</span>
                  <ActivityIcon size={16} className="sp-bay-icon info" />
                </div>
                <div className="sp-bay-val">{stats.inProgress}</div>
                <span className="sp-bay-tag info">The team is working on it</span>
              </div>

              {/* Bay 4: Verified Resolution */}
              <div className="sp-telemetry-bay">
                <div className="sp-bay-header">
                  <span className="sp-bay-label">Resolved</span>
                  <CheckCircleIcon size={16} className="sp-bay-icon success" />
                </div>
                <div className="sp-bay-val">{stats.resolved}</div>
                <span className="sp-bay-tag success">Successfully Resolved</span>
              </div>

            </div>
          )}
        </BorderGlow>
        </section>

        {/* =============================================================
            3. Workspace: Activity Stream & Dispatch Hub
           ============================================================= */}
        <div className="sp-workspace-grid">

          {/* Left Column: Live Activity Stream */}
          <main className="sp-feed-column">
            <div className="sp-feed-header">
              <div className="sp-feed-title-group">
                <h2 className="sp-feed-title">Recent reports</h2>
                <span className="sp-feed-count">{complaints.length} in your space</span>
              </div>

              {complaints.length > 0 && (
                <Link to={preview ? '/__dev/complaints' : '/complaints'} className="sp-feed-link">
                  View all reports &rarr;
                </Link>
              )}
            </div>

            {/* Loading Skeleton */}
            {loading && (
              <div className="sp-feed-stream">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="sp-feed-item sp-skeleton" style={{ height: '88px' }} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && complaints.length === 0 && (
              <div className="sp-empty-feed sp-animate-fade">
                <div className="sp-empty-icon-box">
                  <InboxIcon size={32} />
                </div>
                <h3 className="sp-empty-heading">No reports yet</h3>
                <p className="sp-empty-subtext">
                  When you share a campus issue, its next steps will appear here.
                </p>
                <Link to={preview ? '/__dev/report-issue' : '/complaints/new'} className="btn btn-primary">
                  <PlusCircleIcon size={16} />
                  Submit Your First Report
                </Link>
              </div>
            )}

            {/* Activity Items Feed */}
            {!loading && complaints.length > 0 && (
              <div className="sp-feed-stream sp-animate-fade">
                {recentComplaints.map((item) => {
                  const deptName = item.department?.name || item.classification?.predictedDepartment || 'Finding the right team';
                  const detailPath = preview ? `/__dev/complaints?selected=${encodeURIComponent(item._id)}` : `/complaints/${item._id}`;

                  return (
                    <article
                      key={item._id}
                      className="sp-feed-item"
                      onClick={() => navigate(detailPath)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(detailPath);
                        }
                      }}
                      aria-label={`Complaint: ${item.title}`}
                    >
                      {/* Priority left rail indicator */}
                      <span className={getPriorityRailClass(item.priority)} aria-hidden="true" />

                      <div className="sp-feed-body">
                        <div className="sp-feed-top">
                          <span className="sp-priority-label">{item.priority || 'medium'}</span>
                          <h3 className="sp-item-title">{item.title}</h3>
                          <span className={getStatusBadgeClass(item.status)}>
                            <span className="sp-status-dot" />
                            {item.status}
                          </span>
                        </div>

                        <div className="sp-feed-meta">
                          <span className="sp-meta-chip">
                            <BuildingIcon size={12} />
                            {deptName}
                          </span>
                          <span className="sp-meta-chip">
                            <CalendarIcon size={12} />
                            {formatDate(item.createdAt)}
                          </span>
                          {item.location && (
                            <span className="sp-meta-chip">
                              <MapPinIcon size={12} />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="sp-feed-arrow" aria-hidden="true">
                        <ArrowRightIcon size={16} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {/* Right Column: Dispatch Hub & SLA Matrix */}
          <aside className="sp-dispatch-column" aria-label="Dispatch and Institutional SLA targets">

            {/* Quick Dispatch Card */}
            <Link to={preview ? '/__dev/report-issue' : '/complaints/new'} className="sp-dispatch-card">
              <div className="sp-dispatch-icon-box">
                <PlusCircleIcon size={20} />
              </div>
              <div className="sp-dispatch-text">
                  <span className="sp-dispatch-eyebrow">START HERE</span>
                  <h3 className="sp-dispatch-title">Report a campus issue</h3>
                <p className="sp-dispatch-desc">
                  Tell us what happened and CampusFix will help find the right path.
                </p>
              </div>
              <span className="sp-dispatch-action">
                Launch Form <ArrowRightIcon size={14} />
              </span>
            </Link>

            {/* Department SLA Coverage Matrix */}
            <div className="sp-sla-card">
              <div className="sp-sla-card-header">
                <ShieldIcon size={16} className="sp-sla-shield" />
                <div>
                  <h3 className="sp-sla-card-title">What happens next</h3>
                  <span className="sp-sla-card-sub">CampusFix keeps you in the loop</span>
                </div>
              </div>

              <div className="sp-sla-table">
                <div className="sp-sla-item">
                  <span className="sp-sla-name">Discipline, Safety &amp; Wellbeing</span>
                  <span className="sp-sla-clock urgent">6 hours</span>
                </div>
                <div className="sp-sla-item">
                  <span className="sp-sla-name">Housekeeping &amp; Hygiene</span>
                  <span className="sp-sla-clock fast">24 hours</span>
                </div>
                <div className="sp-sla-item">
                  <span className="sp-sla-name">Technical &amp; Maintenance</span>
                  <span className="sp-sla-clock">24 hours</span>
                </div>
                <div className="sp-sla-item">
                  <span className="sp-sla-name">Mess / Food Services</span>
                  <span className="sp-sla-clock">24 hours</span>
                </div>
                <div className="sp-sla-item">
                  <span className="sp-sla-name">Hostel Administration</span>
                  <span className="sp-sla-clock">48 hours</span>
                </div>
              </div>
            </div>

          </aside>
        </div>

      </div>
    </div>
    </CinematicAtmosphere>
  );
}
