import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { getComplaintById, submitFeedback } from './services/complaintService';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';
import './StudentPortal.css';

const STATUS_STEPS = ['Received', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
function labelDate(value) { return value ? new Date(value).toLocaleString() : ''; }

export default function ComplaintDetail({ demo = false, demoItem = null, previewBackHref = '/__dev/student-dashboard' }) {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError(''); setLoading(true);
    if (demo) { setItem(demoItem); setLoading(false); return; }
    try { setItem(await getComplaintById(id)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, [id, demo, demoItem]);
  useEffect(() => { load(); }, [load]);

  const feedback = async (event) => {
    event.preventDefault(); setError('');
    try { setItem(await submitFeedback(id, rating, comment)); setSaved(true); }
    catch (requestError) { setError(requestError.message); }
  };
  const back = demo ? previewBackHref : user?.role === 'staff' ? '/authority' : user?.role === 'admin' ? '/admin' : '/complaints';
  const history = item?.statusHistory || [];
  const authorityRemarks = [...(item?.authorityRemarks || [])].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  const currentStep = STATUS_STEPS.indexOf(item?.status);
  const isResolved = item?.status === 'Resolved';
  const hasFeedback = Boolean(item?.feedback?.submittedAt);
  const evidenceImages = (item?.images || []).map((image) => typeof image === 'string' ? image : image?.url).filter(Boolean);

  return <CinematicAtmosphere variant="violet"><div className="portal-topbar"><BrandMark /><nav className="portal-nav"><Link to={back} className="portal-button">{demo ? 'Back to My Reports' : user?.role === 'staff' ? 'Back to team queue' : user?.role === 'admin' ? 'Back to CampusFix overview' : 'Student Dashboard'}</Link>{user?.role === 'student' && <button type="button" className="portal-button" onClick={logout}>Log out</button>}</nav></div>
    <main className="portal-page complaint-detail-page"><div className="complaint-detail-shell">
      {error && <div className="alert alert-error" role="alert">{error}<button type="button" onClick={load}>Try again</button></div>}
      {loading ? <p className="portal-muted">Loading your report…</p> : !item ? <section className="authority-empty"><h1>Report unavailable</h1><p>{error || 'This report could not be found.'}</p></section> : <>
        <div className="portal-kicker">CampusFix report · {item.status}</div><h1 className="complaint-detail-title">{item.title}</h1><p className="complaint-detail-description">{item.description}</p>
        {evidenceImages.length > 0 && <section className="complaint-detail-evidence" aria-labelledby="complaint-evidence-title"><div className="portal-kicker">Attached evidence</div><h2 id="complaint-evidence-title">Photos from your report</h2><div className="complaint-detail-evidence-grid">{evidenceImages.map((src, index) => <a href={src} target="_blank" rel="noreferrer" key={`${src}-${index}`}><img src={src} alt={`Evidence photo ${index + 1} for this report`} /><span>Open photo {index + 1}</span></a>)}</div></section>}
        <div className="complaint-detail-layout">
          <section className="complaint-detail-card"><div className="portal-kicker">Report progress</div><h2>Where things stand</h2>
            <div className="detail-timeline">{history.map((event, index) => <div className={`timeline-step ${STATUS_STEPS.indexOf(event.status) >= 0 && STATUS_STEPS.indexOf(event.status) <= currentStep ? 'done' : ''}`} key={`${event.status}-${index}`}><div className="timeline-dot"/><div><h4>{event.status}</h4><p>{event.remarks || 'CampusFix is keeping this step visible.'}</p>{event.timestamp && <time>{labelDate(event.timestamp)}</time>}</div></div>)}</div>
            <section className="complaint-authority-updates" aria-labelledby="complaint-authority-updates-title">
              <div className="portal-kicker">Updates from your Authority</div>
              <h2 id="complaint-authority-updates-title">What’s happening next</h2>
              {authorityRemarks.length ? <ol className="complaint-authority-update-list">{authorityRemarks.map((remark, index) => <li key={`${remark.timestamp || index}-${index}`}><span className="complaint-authority-update-mark" aria-hidden="true"/><div><div className="complaint-authority-update-meta"><strong>{remark.authorLabel || 'Authority'}</strong>{remark.timestamp && <time>{labelDate(remark.timestamp)}</time>}</div><p>{remark.message}</p></div></li>)}</ol> : <p className="complaint-authority-updates-empty">If your Authority shares an update, you’ll see it here. This is separate from the report’s status and any resolution rating.</p>}
            </section>
          </section>
          <aside className="complaint-detail-card complaint-detail-facts"><div className="portal-kicker">Your report</div><h2>At a glance</h2>
            <dl><div><dt>Problem location</dt><dd>{item.location || 'Being confirmed'}</dd></div><div><dt>Team</dt><dd>{item.department?.name || item.classification?.predictedDepartment || 'Finding the right team'}</dd></div><div><dt>Priority</dt><dd className={`priority-${item.priority || 'medium'}`}>{(item.priority || 'medium').toString().replace(/^./, (letter) => letter.toUpperCase())}</dd></div><div><dt>Expected resolution</dt><dd>{item.expectedResolutionLabel || (item.expectedResolutionAt ? labelDate(item.expectedResolutionAt) : 'To be confirmed')}</dd></div><div><dt>Submitted</dt><dd>{labelDate(item.createdAt) || 'Recently'}</dd></div>{item.resolvedAt && <div><dt>Resolved</dt><dd>{labelDate(item.resolvedAt)}</dd></div>}</dl>
            {user?.role !== 'student' && item.complainant && <div className="authority-student complaint-detail-student"><span>Student</span><strong>{item.complainant.name}</strong><span>{item.complainant.registrationNumber || item.complainant.rollNumber} · {item.complainant.email}</span></div>}
            {user?.role === 'student' && isResolved && !hasFeedback && <form className="complaint-feedback" onSubmit={feedback}><h3>How did we do?</h3><p>Your feedback helps make the next report better.</p><div className="complaint-rating" role="group" aria-label="Choose a rating from one to five">{[1,2,3,4,5].map((number) => <button type="button" key={number} aria-pressed={rating === number} aria-label={`${number} out of 5`} className={number <= rating ? 'selected' : ''} onClick={() => setRating(number)}>{number}</button>)}</div><label htmlFor="feedback-comment">Optional note</label><textarea id="feedback-comment" className="form-input form-textarea" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} /><button type="submit" className="portal-button portal-button--primary" disabled={!rating}>Send feedback</button></form>}
            {hasFeedback && <div className="authority-notice complaint-feedback-thanks" role="status">Thank you for your feedback.</div>}{saved && !hasFeedback && <div className="authority-notice" role="status">Thank you for your feedback.</div>}
          </aside>
        </div>
      </>}
    </div></main>
  </CinematicAtmosphere>;
}
