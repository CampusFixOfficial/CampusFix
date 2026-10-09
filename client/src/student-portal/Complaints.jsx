import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyComplaints } from './services/complaintService';
import { useAuth } from '../shared/context/AuthContext';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';

function dateLabel(value) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
}

export default function Complaints() {
  const { logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try { setItems(await getMyComplaints()); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...items].filter((item) => {
      const searchable = [item.title, item.description, item.location, item.department?.name, item.classification?.predictedDepartment].filter(Boolean).join(' ').toLowerCase();
      return (!needle || searchable.includes(needle)) && (statusFilter === 'all' || item.status === statusFilter) && (priorityFilter === 'all' || item.priority === priorityFilter);
    }).sort((a, b) => sortOrder === 'oldest' ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0) : sortOrder === 'priority' ? ({ urgent: 0, high: 1, medium: 2, low: 3 }[a.priority] ?? 4) - ({ urgent: 0, high: 1, medium: 2, low: 3 }[b.priority] ?? 4) : new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [items, priorityFilter, query, sortOrder, statusFilter]);

  return <CinematicAtmosphere showDock variant="violet"><div className="portal-topbar"><BrandMark /><nav className="portal-nav" aria-label="Student navigation"><Link to="/dashboard" className="portal-button">Student Dashboard</Link><Link to="/complaints/new" className="portal-button portal-button--primary">Report an issue ↗</Link><button type="button" className="portal-button" onClick={logout}>Log out</button></nav></div><main className="portal-page"><div className="portal-wrap"><div className="portal-kicker">Your CampusFix space</div><h1 className="portal-title">My <em>reports.</em></h1><p className="portal-subtitle">Every report stays visible from the moment it is received to the latest update.</p><div className="portal-panel portal-card" style={{ marginTop: '2.5rem' }}>
    {loading ? <p className="portal-muted" role="status">Loading your reports…</p> : error ? <div className="alert alert-error" role="alert">{error} <button type="button" className="portal-button" onClick={load}>Try again</button></div> : items.length === 0 ? <div><h2>No reports yet.</h2><p className="portal-muted">When you report a campus issue, its progress will appear here.</p><Link to="/complaints/new" className="portal-button portal-button--primary">Report your first issue</Link></div> : <><div className="complaints-filter-bar" aria-label="Filter reports"><label><span>Search</span><input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, place, or team" /></label><label><span>Status</span><select className="form-input form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{['Received', 'Assigned', 'In Progress', 'Needs Review', 'Escalated', 'Resolved', 'Closed'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label><span>Priority</span><select className="form-input form-select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priorities</option>{['urgent', 'high', 'medium', 'low'].map((priority) => <option key={priority} value={priority}>{priority[0].toUpperCase() + priority.slice(1)}</option>)}</select></label><label><span>Sort</span><select className="form-input form-select" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="priority">Highest priority</option></select></label></div><p className="complaints-result-count">Showing {visibleItems.length} of {items.length} reports</p>{visibleItems.length === 0 ? <div className="authority-empty"><p>No reports match these filters.</p></div> : <div className="portal-list">{visibleItems.map((item) => <Link to={`/complaints/${item._id}`} className="portal-list-item" key={item._id}><div><strong>{item.title}</strong><small>{item.department?.name || item.classification?.predictedDepartment || 'Finding the right team'} · {item.location || 'Location pending'} · {dateLabel(item.createdAt)}</small></div><span className={`status-chip ${item.status === 'Resolved' || item.status === 'Closed' ? 'resolved' : item.status === 'In Progress' ? 'progress' : ''}`}>{item.status}</span></Link>)}</div>}</>}
  </div></div></main></CinematicAtmosphere>;
}
