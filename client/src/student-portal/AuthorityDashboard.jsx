import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../shared/context/AuthContext';
import { acknowledgeComplaint, getDepartmentComplaints, submitAuthorityRemark, updateComplaintStatus } from './services/complaintService';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';
import SoftAurora from '../components/react-bits/SoftAurora';
import BorderGlow from '../components/react-bits/BorderGlow';
import SpecularButton from '../components/react-bits/SpecularButton';
import BlurText from '../components/react-bits/BlurText';
import ScrollReveal from '../components/react-bits/ScrollReveal';
import PlatformFeedback from '../shared/components/PlatformFeedback';
import { buildAuthorityWhatsAppMessage } from './utils/authorityShare';
import './StudentPortal.css';

const DEMO_REPORTS = [];

const HISTORY_STATUSES = new Set(['Resolved', 'Closed']);

const DEMO_WARDEN_REPORTS = [];

function reportCopy(item) {
  const student = item.complainant || {};
  return [
    'CampusFix report',
    `Issue: ${item.title || 'Campus issue'}`,
    `Description: ${item.description || 'Not provided'}`,
    `Problem location: ${item.location || 'Not specified'}`,
    `Team: ${item.department?.name || 'Needs review'}`,
    `Priority: ${item.priority || 'medium'}`,
    `Status: ${item.status || 'Received'}`,
    `Student: ${student.name || 'Not available'}`,
    `Registration number: ${student.registrationNumber || student.rollNumber || 'Not available'}`,
    `Email: ${student.email || 'Not available'}`,
  ].join('\n');
}

function imageSource(image) {
  return typeof image === 'string' ? image : image?.url || '';
}

function reportAge(value) {
  if (!value) return 'Time unavailable';
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return 'Time unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function priorityTone(priority) {
  return ['low', 'medium', 'high', 'urgent'].includes(String(priority || '').toLowerCase())
    ? String(priority).toLowerCase() : 'medium';
}

function nextAction(item) {
  if (!item.acknowledgedAt && ['Received', 'Assigned'].includes(item.status)) return 'acknowledge';
  if (['Assigned', 'Escalated'].includes(item.status)) return 'progress';
  if (item.status === 'In Progress') return 'resolved';
  return '';
}

function actionLabel(action) {
  if (action === 'acknowledge') return 'Acknowledge report';
  if (action === 'progress') return 'Mark work in progress';
  if (action === 'resolved') return 'Mark as resolved';
  return '';
}

function actionGuidance(item, locationWarden = false) {
  const action = nextAction(item);
  if (action === 'acknowledge') return locationWarden ? 'Confirm that you have reviewed the report and will coordinate follow-up with its assigned operational team. The student will see the updated status.' : 'Confirm your team has reviewed and accepted this report. The student will see the updated status.';
  if (action === 'progress') return locationWarden ? 'Choose this after the assigned operational team has actually started work, so the student has a clear update.' : 'Choose this once your team has actually started the work, so the student has a clear update.';
  if (action === 'resolved') return locationWarden ? 'Use this only after the assigned team has completed the work and the issue has been checked. The student can then leave feedback.' : 'Use this only after the reported issue has been fixed. The student can then leave feedback.';
  if (item.status === 'Resolved' || item.status === 'Closed') return 'This report is in the history view. Reopen it only through the appropriate Admin process.';
  return 'Review the location and details, then ask an Admin to confirm the assignment if it needs another team.';
}

function QueueFilter({ value, onChange, counts }) {
  const options = [
    { id: 'todo', label: 'To do', count: counts.todo },
    { id: 'progress', label: 'In progress', count: counts.progress },
    { id: 'history', label: 'History', count: counts.history },
  ];
  return <div className="authority-queue-filters" role="tablist" aria-label="Filter reports">
    {options.map((option) => <button key={option.id} type="button" role="tab" aria-selected={value === option.id} className={value === option.id ? 'is-active' : ''} onClick={() => onChange(option.id)}>
      <span>{option.label}</span><strong>{option.count}</strong>
    </button>)}
  </div>;
}

function StatusPill({ status }) {
  const tone = String(status || 'received').toLowerCase().replace(/\s+/g, '-');
  return <span className={`authority-status authority-status--${tone}`}>{status || 'Received'}</span>;
}

function PriorityPill({ priority }) {
  const tone = priorityTone(priority);
  return <span className={`authority-priority priority-${tone}`}><i aria-hidden="true" />{tone} priority</span>;
}

export default function AuthorityDashboard({ demo = false }) {
  const { user, logout } = useAuth();
  const [items, setItems] = useState(demo ? DEMO_REPORTS : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState('todo');
  const [selectedId, setSelectedId] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [demoPerspective, setDemoPerspective] = useState('team');
  const [remarkDraft, setRemarkDraft] = useState('');
  const [shareReady, setShareReady] = useState(null);
  const [preparedPhotoShare, setPreparedPhotoShare] = useState(null);
  const [preparingPhotoShareId, setPreparingPhotoShareId] = useState('');
  const [remarkBusy, setRemarkBusy] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync(); query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  const load = useCallback(async () => {
    if (demo) {
      setItems(demoPerspective === 'warden' ? DEMO_WARDEN_REPORTS : DEMO_REPORTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try { setItems(await getDepartmentComplaints()); }
    catch (requestError) { setError(requestError.message || 'Could not load the team queue.'); }
    finally { setLoading(false); }
  }, [demo, demoPerspective]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    todo: items.filter((item) => !HISTORY_STATUSES.has(item.status)).length,
    progress: items.filter((item) => item.status === 'In Progress').length,
    history: items.filter((item) => HISTORY_STATUSES.has(item.status)).length,
  }), [items]);
  const overview = useMemo(() => ({
    new: items.filter((item) => item.status === 'Received').length,
    high: items.filter((item) => ['high', 'urgent'].includes(priorityTone(item.priority))).length,
    underway: items.filter((item) => item.status === 'In Progress').length,
  }), [items]);
  const visibleItems = useMemo(() => items.filter((item) => {
    if (filter === 'progress') return item.status === 'In Progress';
    if (filter === 'history') return HISTORY_STATUSES.has(item.status);
    return !HISTORY_STATUSES.has(item.status);
  }), [items, filter]);
  const selected = selectedId ? items.find((item) => String(item._id) === String(selectedId)) : null;

  const act = async (item, action) => {
    setBusyId(item._id);
    setError('');
    setNotice('');
    try {
      if (demo) {
        const now = new Date().toISOString();
        const nextStatus = action === 'acknowledge' ? 'Assigned' : action === 'progress' ? 'In Progress' : action === 'resolved' ? 'Resolved' : 'Escalated';
        const remarks = action === 'acknowledge' ? 'The team acknowledged this report.' : action === 'progress' ? 'The team is working on the report.' : action === 'resolved' ? 'The team marked the report as resolved.' : 'The report was flagged for additional attention.';
        setItems((current) => current.map((report) => report._id !== item._id ? report : {
          ...report,
          status: nextStatus,
          acknowledgedAt: action === 'acknowledge' ? report.acknowledgedAt || now : report.acknowledgedAt,
          resolvedAt: action === 'resolved' ? now : report.resolvedAt,
          statusHistory: [...(report.statusHistory || []), { status: nextStatus, remarks, timestamp: now }],
        }));
        setNotice('Preview only: the status change is local to this page and is not saved.');
      } else {
        if (action === 'acknowledge') await acknowledgeComplaint(item._id);
        else if (action === 'progress') await updateComplaintStatus(item._id, 'In Progress', 'The concerned team is working on this report.');
        else if (action === 'resolved') await updateComplaintStatus(item._id, 'Resolved', 'The team marked this issue as resolved.');
        else if (action === 'escalate') await updateComplaintStatus(item._id, 'Escalated', 'This report needs additional attention.');
        await load();
        setNotice('Report updated. The student can see the new status.');
      }
    } catch (requestError) { setError(requestError.message || 'The report could not be updated.'); }
    finally { setBusyId(''); }
  };

  const copy = async (item) => {
    if (demo) { setNotice('Preview only: report copying is disabled and no student details were copied.'); return; }
    try {
      await navigator.clipboard.writeText(reportCopy(item));
      setNotice('Report details copied.');
    } catch { setNotice('Copy is not available in this browser.'); }
  };

  const share = (item) => {
    const text = buildAuthorityWhatsAppMessage(item, { hostelWarden: isLocationWarden });
    const photos = (Array.isArray(item.images) ? item.images : []).map(imageSource).filter(Boolean);
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    setShareReady({ id: item._id, text, href, photos });
    if (demo) { setNotice('Preview only: message and any photos stay in this page; nothing is sent.'); return; }

    const priorPreparation = preparedPhotoShare?.id === item._id ? preparedPhotoShare : null;
    let supportsFileShare = false;
    try {
      const sampleFile = typeof File === 'function' ? new File(['photo'], 'campusfix-check.jpg', { type: 'image/jpeg' }) : null;
      supportsFileShare = Boolean(photos.length && sampleFile && typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function' && navigator.canShare({ files: [sampleFile] }));
    } catch { supportsFileShare = false; }

    if (supportsFileShare && priorPreparation?.files?.length && typeof navigator.canShare === 'function' && navigator.canShare({ files: priorPreparation.files })) {
      try {
        // Call the native share sheet directly inside the click gesture. Images were
        // prepared on the earlier tap so mobile browsers do not lose user activation.
        const pendingShare = navigator.share({ title: 'CampusFix report', text, files: priorPreparation.files });
        setNotice('The share sheet is opening. Choose WhatsApp and send only when ready; CampusFix cannot confirm delivery.');
        Promise.resolve(pendingShare).then(() => {
          setNotice('The share sheet was closed. CampusFix cannot confirm whether a message was sent.');
        }).catch((shareError) => {
          if (shareError.name === 'AbortError') setNotice('Sharing was cancelled. No message was sent.');
          else setNotice('The share sheet could not open. The original-photo links and WhatsApp draft are available below.');
        });
        return;
      } catch (shareError) {
        if (shareError.name === 'AbortError') { setNotice('Sharing was cancelled. No message was sent.'); return; }
      }
    }

    if (photos.length && supportsFileShare && !priorPreparation && preparingPhotoShareId !== item._id) {
      setPreparingPhotoShareId(item._id);
      setNotice('Preparing the original complaint photo. Once ready, tap “Share report and photo” again to attach it.');
      Promise.all(photos.map(async (src, index) => {
        const response = await fetch(src);
        if (!response.ok) throw new Error('The report photo could not be prepared.');
        const blob = await response.blob();
        const extension = blob.type.includes('png') ? 'png' : 'jpg';
        return new File([blob], `campusfix-report-${index + 1}.${extension}`, { type: blob.type || 'image/jpeg' });
      })).then((files) => {
        setPreparedPhotoShare({ id: item._id, files });
        setNotice('Original photo ready. Tap “Share report and photo” again to open your device share sheet.');
      }).catch(() => {
        setPreparedPhotoShare({ id: item._id, files: [], failed: true });
        setNotice('This browser could not prepare the photo for direct attachment. The original-photo links and WhatsApp draft are available below.');
      }).finally(() => setPreparingPhotoShareId(''));
      return;
    }

    const popup = window.open(href, '_blank');
    if (popup) popup.opener = null;
    setNotice(photos.length
      ? (popup ? 'A WhatsApp draft is open. Add the original photo from the links below before sending; no photo was attached automatically.' : 'Your WhatsApp draft is ready below. Open/save the original photo links and add the photo before sending; nothing has been sent.')
      : (popup ? 'A WhatsApp draft is open. Review it and choose whether to send; CampusFix does not send automatically.' : 'Your message is ready below. Open the WhatsApp draft yourself; nothing has been sent.'));
  };

  const addRemark = async (event) => {
    event.preventDefault();
    if (!selected || !remarkDraft.trim()) return;
    setRemarkBusy(true); setError(''); setNotice('');
    try {
      if (demo) {
        const remark = { authorLabel: isLocationWarden ? 'Hostel Warden' : 'Authority', message: remarkDraft.trim(), timestamp: new Date().toISOString() };
        setItems((current) => current.map((item) => item._id === selected._id
          ? { ...item, authorityRemarks: [...(item.authorityRemarks || []), remark] }
          : item));
        setNotice('Preview only: this update is visible in the demo but is not saved to a real complaint.');
      } else {
        await submitAuthorityRemark(selected._id, remarkDraft);
        await load();
        setNotice('Update saved. The student can see it in their report.');
      }
      setRemarkDraft('');
    } catch (requestError) { setError(requestError.message || 'The update could not be saved.'); }
    finally { setRemarkBusy(false); }
  };

  const currentAction = selected ? nextAction(selected) : '';
  const photoSources = selected ? (Array.isArray(selected.images) ? selected.images : []).map(imageSource).filter(Boolean) : [];
  const isLocationWarden = demo
    ? demoPerspective === 'warden'
    : user?.department?.name === 'Hostel Administration' && (user?.managedLocations || []).length > 0;
  const hasHighPriority = (item) => ['high', 'urgent'].includes(priorityTone(item.priority));

  return <CinematicAtmosphere variant="violet" ambientEffects={false}>
    {!reducedMotion && <div className="authority-aurora" aria-hidden="true"><SoftAurora speed={0.14} scale={1.8} brightness={0.28} color1="#C084FC" color2="#F472B6" noiseFrequency={2.1} noiseAmplitude={0.7} bandHeight={0.42} bandSpread={0.82} octaveDecay={0.12} layerOffset={1.1} colorSpeed={0.22} enableMouseInteraction={false} /></div>}
    <div className="portal-topbar authority-topbar">
      <BrandMark />
      <nav className="portal-nav" aria-label="Authority navigation">
        <span className="authority-team-chip">{demo ? (demoPerspective === 'warden' ? 'Hostel Warden · Block 5' : 'Housekeeping & Hygiene') : user?.department?.name || 'Assigned team'}</span>
        <button type="button" onClick={() => setFeedbackOpen(true)}>Feedback</button>
        {!demo && <button type="button" onClick={logout}>Log out</button>}
      </nav>
    </div>

    <main className="portal-page authority-page authority-workspace">
        <PlatformFeedback open={feedbackOpen} onClose={() => setFeedbackOpen(false)} source="authority-portal" demo={demo} />
      {notice && <div className="authority-notice" role="status">{notice}</div>}
      {error && <div className="alert alert-error" role="alert">{error} <button type="button" onClick={load}>Try again</button></div>}

      {demo && !selected && <div className="authority-demo-perspectives" role="group" aria-label="Choose Authority view"><span>View</span><button type="button" aria-pressed={demoPerspective === 'team'} onClick={() => { setDemoPerspective('team'); setFilter('todo'); }}>Housekeeping team</button><button type="button" aria-pressed={demoPerspective === 'warden'} onClick={() => { setDemoPerspective('warden'); setFilter('todo'); }}>Block 5 Hostel Warden</button></div>}

      {selected ? <>
        <button type="button" className="authority-back-link" onClick={() => setSelectedId('')}><span aria-hidden="true">←</span> Back to report queue</button>
        <article className={`authority-detail priority-surface-${priorityTone(selected.priority)}`}>
          <header className="authority-detail-head">
            <div className="authority-detail-eyebrow"><StatusPill status={selected.status} /><PriorityPill priority={selected.priority} /><span className="authority-age">Reported {reportAge(selected.createdAt)}</span></div>
            <BlurText text={selected.title || 'Campus issue report'} delay={35} stepDuration={0.22} className="authority-detail-title" />
            <p className="authority-detail-location"><span>PROBLEM LOCATION</span><strong>{selected.location || 'Location to be confirmed'}</strong></p>
          </header>

          <div className="authority-detail-layout">
            <div className="authority-detail-main">
              <section className="authority-detail-section authority-student-words">
                <ScrollReveal enableBlur={false} baseOpacity={0.72} baseRotation={1} rotationEnd="top 60%" wordAnimationEnd="top 45%">What the student reported</ScrollReveal>
                <p>{selected.description || 'No additional description was provided.'}</p>
              </section>

              <section className="authority-detail-section authority-understood">
                <ScrollReveal enableBlur={false} baseOpacity={0.72} baseRotation={1} rotationEnd="top 60%" wordAnimationEnd="top 45%">What CampusFix understood</ScrollReveal>
                <div className="authority-understood-grid">
                  <div><span>Assigned team</span><strong>{selected.department?.name || selected.classification?.predictedDepartment || 'Needs confirmation'}</strong></div>
                  <div><span>Priority</span><strong className={`priority-text-${priorityTone(selected.priority)}`}>{priorityTone(selected.priority)}</strong></div>
                  <div><span>Expected response</span><strong>{selected.expectedResolutionLabel || 'To be confirmed by the team'}</strong></div>
                  <div><span>Current status</span><strong>{selected.status || 'Received'}</strong></div>
                </div>
                {selected.authorityAccess === 'location' && <div className="authority-coordinator-note"><strong>Location-based coordination</strong><p>This complaint has been identified as a {selected.department?.name || selected.classification?.predictedDepartment || 'campus operations'} issue. Because the reported location is within your assigned hostel/block, please coordinate with the appropriate team to ensure the issue is resolved. The assigned operational team remains responsible for the work.</p></div>}
                {(selected.status === 'Needs Review' || !selected.department?.name) && <p className="authority-confirmation-note">This report still needs a team or location check. Ask an Admin to confirm the assignment before updating the student.</p>}
              </section>

              <section className="authority-detail-section authority-evidence" aria-label="Report photos">
                <div className="authority-section-heading"><span>Photo evidence</span><small>{photoSources.length ? `${photoSources.length} attached` : 'No photos attached'}</small></div>
                {photoSources.length ? <div className="authority-image-grid">{photoSources.map((src, index) => <figure className="authority-image-card" key={`${selected._id}-image-${index}`}><a href={src} target="_blank" rel="noreferrer"><img src={src} alt={`Uploaded photo ${index + 1} for ${selected.title || 'this report'}`} loading="lazy" /></a><figcaption>Photo {index + 1} · open full size</figcaption></figure>)}</div> : <p className="authority-no-image">No image available.</p>}
              </section>

              <section className="authority-detail-section authority-remarks" aria-labelledby="authority-remarks-title">
                <div className="authority-section-heading"><span id="authority-remarks-title">Remarks / comments</span><small>Visible to the student</small></div>
                {selected.authorityRemarks?.length ? <ol className="authority-remark-list">{[...selected.authorityRemarks].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)).map((remark, index) => <li key={`${remark.timestamp || index}-${index}`}><div><strong>{remark.authorLabel || 'Authority'}</strong><time>{remark.timestamp ? new Date(remark.timestamp).toLocaleString() : 'Time not recorded'}</time></div><p>{remark.message}</p></li>)}</ol> : <p className="authority-no-history">No updates have been shared with the student yet.</p>}
                <form className="authority-remark-form" onSubmit={addRemark}><label htmlFor={`authority-remark-${selected._id}`}>Add an update for the student</label><textarea id={`authority-remark-${selected._id}`} className="form-input form-textarea" value={remarkDraft} onChange={(event) => setRemarkDraft(event.target.value)} minLength={3} maxLength={1200} placeholder="For example: The cleaning team has been informed and will inspect the washroom." required /><small>This becomes part of the student’s report updates. Do not include private or internal administrative information.</small><button type="submit" className="portal-button portal-button--primary" disabled={remarkBusy || remarkDraft.trim().length < 3}>{remarkBusy ? 'Saving update…' : 'Share update with student'}</button></form>
              </section>

              <section className="authority-detail-section authority-history">
                <ScrollReveal enableBlur={false} baseOpacity={0.72} baseRotation={1} rotationEnd="top 60%" wordAnimationEnd="top 45%">Report history</ScrollReveal>
                {selected.statusHistory?.length ? <ol className="authority-history-list">{selected.statusHistory.map((event, index) => <li key={`${event.status}-${event.timestamp || index}`}>
                  <span className="authority-history-dot" aria-hidden="true" />
                  <div><strong>{event.status}</strong><p>{event.remarks || 'Report status updated.'}</p><time>{event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Time not recorded'}</time></div>
                </li>)}</ol> : <p className="authority-no-history">No status changes have been recorded yet.</p>}
              </section>
            </div>

            <aside className="authority-detail-aside">
              <section className="authority-next-action">
                <span className="portal-kicker">{selected.authorityAccess === 'location' ? 'COORDINATE WITH THE OPERATIONAL TEAM' : 'NEXT FOR YOUR TEAM'}</span>
                <h2>{currentAction ? actionLabel(currentAction) : 'Review report status'}</h2>
                <p>{actionGuidance(selected, selected.authorityAccess === 'location')}</p>
                {currentAction ? <SpecularButton size="md" className="authority-primary-action" textColor="#fff" lineColor="#f0c2ff" baseColor="#5b3b78" intensity={0.82} speed={0.22} onClick={() => act(selected, currentAction)} disabled={busyId === selected._id}>{busyId === selected._id ? 'Updating…' : actionLabel(currentAction)}</SpecularButton> : <span className="authority-action-complete">No status action is available for this report.</span>}
                {currentAction !== 'resolved' && !['Resolved', 'Closed', 'Escalated'].includes(selected.status) && <button type="button" className="portal-button authority-secondary-action" disabled={busyId === selected._id} onClick={() => act(selected, 'escalate')}>Escalate for extra attention</button>}
                {selected.status === 'In Progress' && <button type="button" className="portal-button authority-secondary-action" disabled={busyId === selected._id} onClick={() => act(selected, 'escalate')}>Escalate for extra attention</button>}
                <p className="authority-action-reminder">A status change is shared with the student. Keep it true to work already done.</p>
              </section>

              <section className="authority-detail-section authority-contact">
                <div className="authority-section-heading"><span>Student contact</span><small>For follow-up only</small></div>
                <strong>{selected.complainant?.name || 'Student account'}</strong>
                <span>{selected.complainant?.registrationNumber || selected.complainant?.rollNumber || 'Registration number unavailable'}</span>
                <a href={selected.complainant?.email ? `mailto:${selected.complainant.email}` : undefined}>{selected.complainant?.email || 'Email unavailable'}</a>
                {selected.complainant?.hostel && <span>Student residence: {selected.complainant.hostel}</span>}
              </section>

              <section className="authority-detail-section authority-share-actions">
                <button type="button" className="portal-button" onClick={() => copy(selected)}>Copy report</button>
                <button type="button" className="portal-button authority-whatsapp" onClick={() => share(selected)} disabled={preparingPhotoShareId === selected._id}>{preparingPhotoShareId === selected._id ? 'Preparing photo…' : photoSources.length ? 'Share report and photo' : 'Prepare WhatsApp message'}</button>
                <p>Where supported, the device share sheet includes the original complaint photos. Otherwise, open or save the original-photo links below and attach them in WhatsApp. CampusFix never sends automatically or claims delivery.</p>
                {photoSources.length > 0 && <div className="authority-share-photos"><strong>Original photos to include</strong>{photoSources.map((src, index) => <a href={src} target="_blank" rel="noreferrer" download={`CampusFix-report-photo-${index + 1}`} key={`${selected._id}-share-photo-${index}`}>Open or save photo {index + 1}</a>)}</div>}
                {shareReady?.id === selected._id && <div className="authority-share-preview"><strong>Prepared message</strong><pre>{shareReady.text}</pre>{!demo && <a className="authority-open-whatsapp" href={shareReady.href} target="_blank" rel="noreferrer">Open WhatsApp draft</a>}</div>}
                <p>Copying includes contact details. The WhatsApp message excludes student contact details.</p>
              </section>
            </aside>
          </div>
        </article>
      </> : <>
        <header className="authority-heading authority-heading-refined">
          <div><div className="portal-kicker">Authority space · {demo ? (isLocationWarden ? 'Hostel Warden · demo' : 'Housekeeping & Hygiene · demo') : user?.department?.name || 'Assigned team'}</div><h1 className="portal-title">{isLocationWarden ? <>Your hostel,<br /><em>in coordination.</em></> : <>Your team’s<br /><em>report queue.</em></>}</h1><p className="portal-subtitle">{isLocationWarden ? 'See reports from your assigned hostel locations. Each report still shows which operational team is responsible for the repair or service.' : 'Start with what needs attention. Open a report for the student’s words, location, photos and the next appropriate action.'}</p></div>
          <div className="authority-queue-count"><strong>{loading ? '—' : items.length}</strong><span>{isLocationWarden ? 'reports in your assigned locations' : 'reports assigned to this team'}</span></div>
        </header>

        <div className="authority-queue-overview" aria-label="Queue summary">
          <div><span>New</span><strong>{loading ? '—' : overview.new}</strong><small>Received</small></div>
          <div className={overview.high > 0 ? 'is-attention' : ''}><span>High priority</span><strong>{loading ? '—' : overview.high}</strong><small>High or urgent</small></div>
          <div><span>In progress</span><strong>{loading ? '—' : overview.underway}</strong><small>Work underway</small></div>
        </div>

        <QueueFilter value={filter} onChange={setFilter} counts={counts} />
        {loading ? <div className="authority-empty" role="status">Loading your team’s reports…</div>
          : visibleItems.length === 0 ? <div className="authority-empty authority-empty-refined"><span className="portal-kicker">{filter === 'history' ? 'A clean close' : 'Nothing waiting'}</span><h2>{filter === 'history' ? 'No completed reports yet.' : filter === 'progress' ? 'No work is marked in progress.' : 'Your team’s queue is clear.'}</h2><p>Reports assigned to this team will appear here. Select another queue view to check its current state.</p></div>
            : <div className="authority-queue authority-queue-refined">{visibleItems.map((item) => {
              const urgent = hasHighPriority(item);
              const card = <article className={`authority-report-card${urgent ? ' authority-report-card--attention' : ''}`} key={item._id}>
                <button type="button" className="authority-card-open" onClick={() => setSelectedId(item._id)} aria-label={`Open report: ${item.title || 'Campus issue'}`}>
                  <span className="authority-card-top"><span className="authority-detail-eyebrow"><StatusPill status={item.status} /><PriorityPill priority={item.priority} /></span><time>{reportAge(item.createdAt)}</time></span>
                  <strong className="authority-card-title">{item.title || 'Campus issue report'}</strong>
                  <span className="authority-card-description">{item.description || 'No additional description was provided.'}</span>
                  <span className="authority-card-facts"><span><small>LOCATION</small><strong>{item.location || 'Location to be confirmed'}</strong></span><span><small>TEAM</small><strong>{item.department?.name || item.classification?.predictedDepartment || 'Needs confirmation'}</strong></span></span>
                  <span className="authority-card-footer"><span>{item.images?.length ? `${item.images.length} photo${item.images.length === 1 ? '' : 's'} attached` : 'No image available'}</span><strong>Open report <i aria-hidden="true">↗</i></strong></span>
                </button>
              </article>;
              return <div className="authority-card-wrap" key={item._id}>{urgent
                ? <BorderGlow className="authority-priority-glow" glowColor="355 88 70" backgroundColor="#15101f" borderRadius={21} glowRadius={20} glowIntensity={0.62} coneSpread={36} fillOpacity={0.12}>{card}</BorderGlow>
                : card}</div>;
            })}</div>}
      </>}
    </main>
  </CinematicAtmosphere>;
}
