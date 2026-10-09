import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { createAuthority, getAuthorities, getDepartments, getDepartmentComplaints, getLocationCatalogue, getPlatformFeedback, reassignComplaint, seedDepartments, updateAuthority, updateDepartment, updateLocationCatalogue } from './services/complaintService';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';
import CampusProblemLandscape from './CampusProblemLandscape';
import { createDemoAdminData } from './data/demoAdminPortal';
import { HOSTEL_AUTHORITY_LOCATIONS, MESS_AUTHORITY_LOCATIONS, customScopeId, readManagedScopeOptions, saveManagedScopeOptions } from './data/campusLocations';
import './StudentPortal.css';

function mappingDraftsFor(departments) {
  return Object.fromEntries(departments.map((department) => [department._id, {
    description: department.description || '', keywords: (department.keywords || []).join(', '), slaHours: String(department.slaHours || 24),
  }]));
}

export default function AdminDashboard({ demo = false }) {
  const { logout } = useAuth();
  const [demoSample] = useState(() => demo ? createDemoAdminData() : null);
  const [authorities, setAuthorities] = useState(() => demoSample?.authorities || []);
  const [departments, setDepartments] = useState(() => demoSample?.departments || []);
  const [complaints, setComplaints] = useState(() => demoSample?.complaints || []);
  const [platformFeedback, setPlatformFeedback] = useState(() => demoSample?.platformFeedback || []);
  const [mappingDrafts, setMappingDrafts] = useState(() => mappingDraftsFor(demoSample?.departments || []));
  const [form, setForm] = useState({ name: '', email: '', employeeId: '', password: '', departmentId: '', managedLocations: [] });
  const [locationScopeDrafts, setLocationScopeDrafts] = useState({});
  const [employeeIdDrafts, setEmployeeIdDrafts] = useState({});
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [hostelLocations, setHostelLocations] = useState(() => readManagedScopeOptions('campusfix_hostel_scope_options', HOSTEL_AUTHORITY_LOCATIONS));
  const [messLocations, setMessLocations] = useState(() => readManagedScopeOptions('campusfix_mess_scope_options', MESS_AUTHORITY_LOCATIONS));
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockType, setNewBlockType] = useState('Boys Hostel');
  const [newMessName, setNewMessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (demo) { setLoading(false); setError(''); return; }
    setLoading(true); setError('');
    const results = await Promise.allSettled([getAuthorities(), getDepartments(), getDepartmentComplaints(), getPlatformFeedback(), getLocationCatalogue()]);
    const [authorityList, departmentList, reportList, feedbackList, catalogue] = results;
    if (authorityList.status === 'fulfilled') {
      setAuthorities(authorityList.value);
      setEmployeeIdDrafts(Object.fromEntries(authorityList.value.map((authority) => [authority._id || authority.id, authority.employeeId || ''])));
      setLocationScopeDrafts(Object.fromEntries(authorityList.value.map((authority) => [authority._id || authority.id, [...(authority.managedLocations || [])]])));
    }
    if (departmentList.status === 'fulfilled') {
      setDepartments(departmentList.value);
      setMappingDrafts(Object.fromEntries(departmentList.value.map((department) => [department._id, {
        description: department.description || '', keywords: (department.keywords || []).join(', '), slaHours: String(department.slaHours || 24),
      }])));
    }
    if (reportList.status === 'fulfilled') setComplaints(reportList.value);
    if (feedbackList.status === 'fulfilled') setPlatformFeedback(feedbackList.value);
    if (catalogue.status === 'fulfilled') {
      if (catalogue.value.hostelLocations?.length) setHostelLocations(catalogue.value.hostelLocations);
      if (catalogue.value.messLocations?.length) setMessLocations(catalogue.value.messLocations);
    }
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) setError(failed.reason?.message || 'Some CampusFix data could not be loaded.');
    setLoading(false);
  }, [demo]);
  useEffect(() => { load(); }, [load]);

  const prepareTeams = async () => {
    if (demo) { setNotice('Preview only: the five fictional teams are already loaded; nothing is saved.'); return; }
    setBusy(true); setError(''); setNotice('');
    try { await seedDepartments(); setNotice('The five CampusFix teams are ready.'); await load(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const addAuthority = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    if (demo) {
      if (authorities.some((authority) => authority.employeeId?.toLowerCase() === form.employeeId.trim().toLowerCase())) {
        setError('That demo employee ID is already in use.'); return;
      }
      const department = departments.find((item) => item._id === form.departmentId);
      setAuthorities((current) => [{
        _id: `demo-authority-${Date.now()}`,
        name: form.name.trim(), email: form.email.trim(), employeeId: form.employeeId.trim(),
        department: department ? { _id: department._id, name: department.name } : null,
        managedLocations: ['Hostel Administration', 'Mess / Food Services'].includes(department?.name) ? [...form.managedLocations] : [],
        isActive: true,
      }, ...current]);
      setForm({ name: '', email: '', employeeId: '', password: '', departmentId: '', managedLocations: [] });
      setNotice('Preview only: the fictional Authority account was added on this page and was not saved.');
      return;
    }
    setBusy(true);
    try {
      await createAuthority(form);
      setForm({ name: '', email: '', employeeId: '', password: '', departmentId: '', managedLocations: [] });
      setNotice('Authority account created and assigned to its team.');
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const changeAuthority = async (authority, patch) => {
    if (demo) {
      const id = authority._id || authority.id;
      const { departmentId, ...fields } = patch;
      const selectedDepartment = departmentId ? departments.find((item) => item._id === departmentId) : authority.department;
      const managedLocations = ['Hostel Administration', 'Mess / Food Services'].includes(selectedDepartment?.name)
        ? (fields.managedLocations || authority.managedLocations || [])
        : [];
      setAuthorities((current) => current.map((item) => String(item._id || item.id) === String(id)
        ? { ...item, ...fields, managedLocations, department: selectedDepartment ? { _id: selectedDepartment._id, name: selectedDepartment.name } : null }
        : item));
      setLocationScopeDrafts((current) => ({ ...current, [id]: [...managedLocations] }));
      setNotice('Preview only: Authority details changed in this page; nothing was saved.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try { await updateAuthority(authority._id || authority.id, patch); setNotice('Authority access settings updated.'); await load(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const saveEmployeeId = (authority) => {
    const id = authority._id || authority.id;
    const employeeId = String(employeeIdDrafts[id] || '').trim();
    if (employeeId.length < 2) return setError('Enter an employee ID with at least 2 characters.');
    changeAuthority(authority, { employeeId });
  };
  const saveLocationScopes = (authority) => {
    const id = authority._id || authority.id;
    changeAuthority(authority, { managedLocations: locationScopeDrafts[id] || [] });
  };
  const saveMapping = async (department) => {
    const draft = mappingDrafts[department._id];
    if (!draft) return;
    if (demo) {
      setDepartments((current) => current.map((item) => item._id !== department._id ? item : {
        ...item,
        description: draft.description.trim(),
        keywords: draft.keywords.split(',').map((word) => word.trim()).filter(Boolean),
        slaHours: Number(draft.slaHours),
      }));
      setNotice('Preview only: the team mapping changed in this page; nothing was saved.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await updateDepartment(department._id, {
        description: draft.description.trim(),
        keywords: draft.keywords.split(',').map((word) => word.trim()).filter(Boolean),
        slaHours: Number(draft.slaHours),
        isSensitive: department.isSensitive,
      });
      setNotice(`${department.name} mapping saved.`);
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const assignReport = async (item) => {
    const departmentId = assignmentDrafts[item._id] || item.department?._id;
    if (!departmentId) return setError('Choose a team before assigning this report.');
    if (demo) {
      const department = departments.find((entry) => entry._id === departmentId);
      if (!department) return setError('Choose one of the five demo teams.');
      setComplaints((current) => current.map((report) => report._id !== item._id ? report : {
        ...report,
        department: { _id: department._id, name: department.name },
        classification: { ...report.classification, predictedDepartment: department.name },
        status: 'Assigned',
      }));
      setNotice('Preview only: the report was assigned on this page; nothing was saved.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try { await reassignComplaint(item._id, departmentId); setNotice('Report assigned to the selected team.'); await load(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const editMapping = (id, field, value) => setMappingDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  const updateScopeOptions = async (kind, next) => {
    if (kind === 'hostel') { setHostelLocations(next); saveManagedScopeOptions('campusfix_hostel_scope_options', next); }
    else { setMessLocations(next); saveManagedScopeOptions('campusfix_mess_scope_options', next); }
    if (demo) { setNotice('Preview only: this catalogue change was not saved.'); return; }
    setBusy(true); setError('');
    try {
      await updateLocationCatalogue({ hostelLocations: kind === 'hostel' ? next : hostelLocations, messLocations: kind === 'mess' ? next : messLocations });
      setNotice(`${kind === 'hostel' ? 'Hostel Warden blocks' : 'Mess Authority locations'} saved for all Admin users.`);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const addBlock = (event) => {
    event.preventDefault();
    const label = newBlockName.trim();
    if (!label) return;
    const displayName = `${newBlockType} ${label}`;
    if (hostelLocations.some((location) => location.displayName.toLowerCase() === displayName.toLowerCase())) return setError('That hostel block is already listed.');
    updateScopeOptions('hostel', [...hostelLocations, { id: customScopeId('hostel', label, newBlockType), displayName, custom: true }]);
    setNewBlockName('');
  };
  const addMess = (event) => {
    event.preventDefault();
    const displayName = newMessName.trim();
    if (!displayName) return;
    if (messLocations.some((location) => location.displayName.toLowerCase() === displayName.toLowerCase())) return setError('That mess is already listed.');
    updateScopeOptions('mess', [...messLocations, { id: customScopeId('mess', displayName), displayName, custom: true }]);
    setNewMessName('');
  };

  return <CinematicAtmosphere variant="violet">
    <div className="portal-topbar">
      <BrandMark />
      <nav className="portal-nav" aria-label="Admin navigation">
        <a href="#admin-overview">Campus picture</a>
        <a href="#admin-mapping">Team routing</a>
        <a href="#admin-authorities">Authority accounts</a>
        <a href="#admin-feedback">Platform feedback</a>
        <a href="#admin-reports">Report oversight</a>
        {!demo && <Link to="/authority/login">Authority sign in</Link>}
        {!demo && <button type="button" onClick={logout}>Log out</button>}
      </nav>
    </div>
    <main className="portal-page admin-page admin-campus-page">
      <div className="admin-heading">
        <div><div className="portal-kicker">CampusFix · operational oversight</div><h1 className="portal-title">The campus,<br /><em>in perspective.</em></h1><p className="portal-subtitle">Start with the campus-wide report picture. Team, access and assignment controls remain close at hand below.</p></div>
        <button type="button" className="portal-button admin-seed-button" disabled={busy} onClick={prepareTeams}>{busy ? 'Working…' : 'Prepare five teams'}</button>
      </div>
      {notice && <div className="authority-notice" role="status">{notice}</div>}
      {error && <div className="alert alert-error" role="alert">{error}<button type="button" onClick={load}>Retry</button></div>}

      <section id="admin-overview" className="admin-overview" aria-label="Campus Problem Landscape">
        <CampusProblemLandscape embedded={true} demo={demo} demoData={demo ? demoSample?.landscape : null} />
      </section>

      <section id="admin-mapping" className="admin-section">
        <div className="admin-section-heading"><div><div className="portal-kicker">Department mapping</div><h2>Five teams, clear paths</h2></div><span>Routing words and expected timelines</span></div>
        {departments.length === 0 ? <div className="authority-empty"><p>Prepare the five CampusFix teams to configure report routing.</p></div> : <div className="admin-mapping-list">{departments.map((department) => { const draft = mappingDrafts[department._id] || {}; return <article className="admin-mapping-card" key={department._id}><div className="admin-mapping-title"><span className="portal-kicker">CampusFix team</span><h3>{department.name}</h3></div><label><span>What this team handles</span><textarea className="form-input form-textarea" value={draft.description || ''} onChange={(event) => editMapping(department._id, 'description', event.target.value)} maxLength={500} /></label><label><span>Routing words · separate with commas</span><textarea className="form-input form-textarea" value={draft.keywords || ''} onChange={(event) => editMapping(department._id, 'keywords', event.target.value)} maxLength={3000} /></label><div className="admin-mapping-footer"><label><span>Expected hours</span><input className="form-input" type="number" min="1" max="720" value={draft.slaHours || ''} onChange={(event) => editMapping(department._id, 'slaHours', event.target.value)} required /></label><button type="button" className="portal-button" disabled={busy || !draft.keywords?.trim() || Number(draft.slaHours) < 1} onClick={() => saveMapping(department)}>Save team mapping</button></div></article>; })}</div>}
      </section>

      <section id="admin-authorities" className="admin-section">
        <div className="admin-section-heading"><div><div className="portal-kicker">Controlled access</div><h2>Authority accounts</h2></div><span>{authorities.length} created</span></div>
        <p className="admin-authority-help">Authority logins are optional and are for real, authorized staff who need portal access. The five operational teams remain available for routing without a named team head; no Technical Head or Hygiene Head details are required. Hostel Administration accounts can be scoped to one or more campus-listed hostel locations.</p>
        <section className="admin-scope-manager" aria-labelledby="admin-scope-manager-title"><div className="admin-section-heading"><div><div className="portal-kicker">Location catalogue</div><h3 id="admin-scope-manager-title">Manage Warden blocks and messes</h3></div><span>{hostelLocations.length} blocks · {messLocations.length} messes</span></div><p className="admin-authority-help">Remove locations that are not active and add new ones. These lists control the choices available when assigning location-scoped Authority accounts.</p><div className="admin-scope-manager-grid"><div className="admin-scope-manager-card"><strong>Hostel Warden blocks</strong><div className="admin-scope-manager-list">{hostelLocations.map((location) => <div className="admin-scope-manager-row" key={location.id}><span>{location.displayName}</span><button type="button" className="portal-button" onClick={() => updateScopeOptions('hostel', hostelLocations.filter((entry) => entry.id !== location.id))}>Remove</button></div>)}</div><form className="admin-scope-add-form" onSubmit={addBlock}><input className="form-input" value={newBlockName} onChange={(event) => setNewBlockName(event.target.value)} placeholder="e.g. Block 9" aria-label="New hostel block name" /><select className="form-input form-select" value={newBlockType} onChange={(event) => setNewBlockType(event.target.value)} aria-label="New hostel block type"><option>Boys Hostel</option><option>Girls Hostel</option></select><button type="submit" className="portal-button portal-button--primary">Add block</button></form></div><div className="admin-scope-manager-card"><strong>Mess Authority locations</strong><div className="admin-scope-manager-list">{messLocations.map((location) => <div className="admin-scope-manager-row" key={location.id}><span>{location.displayName}</span><button type="button" className="portal-button" onClick={() => updateScopeOptions('mess', messLocations.filter((entry) => entry.id !== location.id))}>Remove</button></div>)}</div><form className="admin-scope-add-form" onSubmit={addMess}><input className="form-input" value={newMessName} onChange={(event) => setNewMessName(event.target.value)} placeholder="e.g. North Dining Hall" aria-label="New mess name" /><button type="submit" className="portal-button portal-button--primary">Add mess</button></form></div></div></section>
        <form className="admin-authority-form" onSubmit={addAuthority}>
          <label><span>Full name</span><input className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label><span>Work email</span><input className="form-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></label>
          <label><span>Employee ID</span><input className="form-input" value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} autoComplete="off" required /></label>
          <label><span>Temporary password</span><input className="form-input" type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required /></label>
          <label><span>Assigned team</span><select className="form-input form-select" value={form.departmentId} onChange={(event) => { const department = departments.find((item) => item._id === event.target.value); setForm((current) => ({ ...current, departmentId: event.target.value, managedLocations: ['Hostel Administration', 'Mess / Food Services'].includes(department?.name) ? current.managedLocations : [] })); }} required><option value="">Choose a team</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label>
          <p className="admin-authority-help admin-authority-form-note">The assigned operational team remains responsible for the work. Location-scoped accounts coordinate visibility without replacing the operational team that solves the issue.</p>
          {departments.find((department) => department._id === form.departmentId)?.name === 'Hostel Administration' && <fieldset className="admin-location-scope-fieldset"><legend>Hostel Warden blocks this account may coordinate · optional</legend><p>Select whole blocks only. A selected block includes its floors and wings; leave blank for a department-wide Hostel Administration account.</p><div className="admin-location-scope-grid">{hostelLocations.map((location) => <label className="admin-location-scope-option" key={location.id}><input type="checkbox" checked={form.managedLocations.includes(location.id)} onChange={(event) => setForm((current) => ({ ...current, managedLocations: event.target.checked ? [...new Set([...current.managedLocations, location.id])] : current.managedLocations.filter((id) => id !== location.id) }))} /><span>{location.displayName || location.label}</span></label>)}</div></fieldset>}
          {departments.find((department) => department._id === form.departmentId)?.name === 'Mess / Food Services' && <fieldset className="admin-location-scope-fieldset"><legend>Mess Authority locations · optional</legend><p>Keep mess responsibility separate from Hostel Warden blocks. Select the named mess locations this account coordinates, or leave blank for the department-wide queue.</p><div className="admin-location-scope-grid">{messLocations.map((location) => <label className="admin-location-scope-option" key={location.id}><input type="checkbox" checked={form.managedLocations.includes(location.id)} onChange={(event) => setForm((current) => ({ ...current, managedLocations: event.target.checked ? [...new Set([...current.managedLocations, location.id])] : current.managedLocations.filter((id) => id !== location.id) }))} /><span>{location.displayName}</span></label>)}</div></fieldset>}
          <button type="submit" className="portal-button portal-button--primary" disabled={busy || !departments.length}>Create authority access</button>
        </form>
        {authorities.length > 0 && <div className="admin-authority-list">{authorities.map((authority) => {
          const authorityId = authority._id || authority.id;
          const employeeDraft = String(employeeIdDrafts[authorityId] ?? authority.employeeId ?? '').trim();
          const employeeUnchanged = employeeDraft.toUpperCase() === String(authority.employeeId || '').toUpperCase();
          const assignedLocationIds = authority.managedLocations || [];
          const locationDraft = locationScopeDrafts[authorityId] || assignedLocationIds;
          const scopesChanged = [...locationDraft].sort().join('|') !== [...assignedLocationIds].sort().join('|');
          return <div className="admin-authority-row" key={authorityId}>
            <div className="admin-authority-identity"><strong>{authority.name}</strong><span>{authority.email}</span><label className="admin-employee-editor"><span>Employee ID</span><input className="form-input" value={employeeIdDrafts[authorityId] ?? authority.employeeId ?? ''} onChange={(event) => setEmployeeIdDrafts((current) => ({ ...current, [authorityId]: event.target.value }))} autoComplete="off" /></label><button type="button" className="portal-button" disabled={busy || employeeDraft.length < 2 || employeeUnchanged} onClick={() => saveEmployeeId(authority)}>Save employee ID</button></div>
            <select className="form-input form-select" aria-label={`Team for ${authority.name}`} value={authority.department?._id || ''} onChange={(event) => changeAuthority(authority, { departmentId: event.target.value })}><option value="">No team assigned</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select>
            <button type="button" className="portal-button" disabled={busy} onClick={() => changeAuthority(authority, { isActive: !authority.isActive })}>{authority.isActive ? 'Deactivate' : 'Reactivate'}</button>
            <span className={authority.isActive ? 'admin-account-active' : 'admin-account-paused'}>{authority.isActive ? 'Active' : 'Inactive'}</span>
            {['Hostel Administration', 'Mess / Food Services'].includes(authority.department?.name) && <details className="admin-location-scope-editor"><summary>{authority.department.name === 'Hostel Administration' ? 'Hostel Warden blocks' : 'Mess locations'} · {assignedLocationIds.length || 'none'} selected</summary><p>{authority.department.name === 'Hostel Administration' ? 'Selected whole blocks include their floors and wings. No selected locations means the department-wide queue.' : 'Selected named mess locations restrict this account to those places. No selected locations means the department-wide queue.'}</p><div className="admin-location-scope-grid">{(authority.department.name === 'Hostel Administration' ? hostelLocations : messLocations).map((location) => <label className="admin-location-scope-option" key={location.id}><input type="checkbox" checked={locationDraft.includes(location.id)} onChange={(event) => setLocationScopeDrafts((current) => ({ ...current, [authorityId]: event.target.checked ? [...new Set([...(current[authorityId] || assignedLocationIds), location.id])] : (current[authorityId] || assignedLocationIds).filter((id) => id !== location.id) }))} /><span>{location.displayName || location.label}</span></label>)}</div><button type="button" className="portal-button" disabled={busy || !scopesChanged} onClick={() => saveLocationScopes(authority)}>Save location access</button></details>}
          </div>;
        })}</div>}
      </section>

      <section id="admin-reports" className="admin-section">
        <div className="admin-section-heading"><div><div className="portal-kicker">Accountability</div><h2>Campus reports</h2></div><span>{loading ? 'Loading records…' : `${complaints.length} records`}</span></div>
        {loading ? <div className="authority-empty">Loading reports…</div> : complaints.length === 0 ? <div className="authority-empty">No reports have been submitted yet.</div> : <div className="admin-report-list">{complaints.map((item) => <article className="admin-report-row" key={item._id}><div><span className="authority-status">{item.status}</span><h3>{item.title}</h3><p>{item.description}</p><small>{item.location || 'Location not identified'} · {item.complainant?.name || 'Student'} · {item.complainant?.registrationNumber || item.complainant?.rollNumber || 'No registration number'}</small></div><div className="admin-assign-control"><select className="form-input form-select" value={assignmentDrafts[item._id] || item.department?._id || ''} onChange={(event) => setAssignmentDrafts((current) => ({ ...current, [item._id]: event.target.value }))} aria-label={`Assign ${item.title}`}><option value="">Needs review</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select><button type="button" className="portal-button" disabled={busy || !departments.length} onClick={() => assignReport(item)}>Assign</button></div></article>)}</div>}
      </section>

      <section id="admin-feedback" className="admin-section admin-feedback-section" aria-labelledby="admin-feedback-title">
        <div className="admin-section-heading"><div><div className="portal-kicker">A separate inbox</div><h2 id="admin-feedback-title">CampusFix platform feedback</h2></div><span>{platformFeedback.length} received</span></div>
        <p className="admin-authority-help">This is general feedback about CampusFix. It is not a complaint remark shown to a student, and it is not a rating of a resolved report.</p>
        {loading ? <div className="authority-empty">Loading feedback…</div> : platformFeedback.length === 0 ? <div className="authority-empty">No platform feedback has been submitted yet.</div> : <div className="admin-feedback-list">{platformFeedback.map((entry) => {
          const senderType = ['authority', 'staff'].includes(entry.senderType) ? 'Authority' : entry.senderType === 'admin' ? 'Admin' : entry.senderType === 'student' ? 'Student' : 'Visitor';
          const sourceName = ({ 'landing-page': 'Landing page', 'student-portal': 'Student portal', 'authority-portal': 'Authority portal', other: 'CampusFix' })[entry.source] || 'CampusFix';
          const senderName = entry.sender?.name || (entry.contactEmail ? 'Visitor · reply address provided' : 'Visitor · anonymous');
          return <article className="admin-feedback-card" key={entry._id || entry.id}><header><span className="admin-feedback-topic">{String(entry.topic || 'general').replace(/[-_]+/g, ' ')}</span><time>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Time unavailable'}</time></header><p>{entry.message}</p><footer><span>{sourceName}</span><span>{senderType}{entry.sender?.name ? ` · ${senderName}` : ''}</span>{entry.contactEmail && <a href={`mailto:${entry.contactEmail}`}>{entry.contactEmail}</a>}{entry.complaintId && <span>Related report: {entry.complaintId}</span>}</footer></article>;
        })}</div>}
      </section>
    </main>
  </CinematicAtmosphere>;
}
