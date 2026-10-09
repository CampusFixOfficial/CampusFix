import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { createComplaint } from './services/complaintService';
import { compressImage, fileToDataUrl } from './utils/imageCompressor';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';
import SpecularButton from '../components/react-bits/SpecularButton';
import Prism from '../components/react-bits/Prism';
import '../shared/components/Auth.css';
import './StudentPortal.css';

const loadPaperModule = () => import('../shaders/3d-paper/ThreeDPaper');
const ThreeDPaper = lazy(() => loadPaperModule().then((module) => ({ default: module.ThreeDPaper })));

const UNDERSTANDING_STEPS = [
  'Understanding the problem',
  'Reading what happened',
  'Finding where the issue is',
  'Understanding what needs attention',
  'Finding the right team',
  'Setting priority',
  'Preparing your report',
];
const TARGET_DURATION = 10200;

function wait(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

function createPreviewReport(description, image = '') {
  const text = description.toLowerCase();
  const block = text.match(/\bblock\s*(\d+[a-z]?)\b/i)?.[1];
  const floor = text.match(/\b(\d{1,2}(?:st|nd|rd|th)?)\s+floor\b/i)?.[0];
  const wing = text.match(/\b([a-z])\s*[- ]?wing\b/i)?.[0];
  const hostel = /men'?s|mens|boys/.test(text) ? "Men's Hostel" : /women'?s|womens|girls/.test(text) ? "Women's Hostel" : /hostel|residence/.test(text) ? 'Hostel' : '';
  const location = [block && `Block ${block.replace(/^./, (letter) => letter.toUpperCase())}`, hostel, floor && floor.replace(/^./, (letter) => letter.toUpperCase()), wing && `${wing[0].toUpperCase()} Wing`].filter(Boolean).join(' · ') || 'Location to be confirmed';
  const department = /dirty|washroom|toilet|bathroom|garbage|cleaning|hygiene/.test(text) ? 'Housekeeping & Hygiene'
    : /food|meal|mess|canteen|menu/.test(text) ? 'Mess / Food Services'
      : /bully|harass|ragging|unsafe|safety|threat/.test(text) ? 'Discipline, Safety & Wellbeing'
        : /allotment|warden|room change|hostel fee/.test(text) ? 'Hostel Administration' : 'Technical & Maintenance';
  const priority = /fire|emergency|immediate danger/.test(text) ? 'urgent' : /dirty|washroom|unsafe|safety|ragging|bully|threat/.test(text) ? 'high' : 'medium';
  return { _id: `preview-${Date.now()}`, title: description.split(/[.!?\n]/)[0].trim().slice(0, 100) || 'Campus issue', description, location, images: image ? [{ url: image }] : [], department: { name: department }, priority, status: 'Assigned', expectedResolutionLabel: department === 'Discipline, Safety & Wellbeing' ? 'Within 6 hours' : department === 'Hostel Administration' ? 'Within 2 days' : 'Within 24 hours', classification: { predictedDepartment: department } };
}

export default function ComplaintNew({ preview = false }) {
  const { user, logout } = useAuth();
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [stage, setStage] = useState('write');
  const [activeStep, setActiveStep] = useState(0);
  const [complaint, setComplaint] = useState(null);
  const [understandingData, setUnderstandingData] = useState(null);
  const [error, setError] = useState('');
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  useEffect(() => {
    if (stage !== 'understanding') return undefined;
    const startedAt = Date.now();
    const timer = window.setInterval(() => setActiveStep(Math.min(UNDERSTANDING_STEPS.length - 1, Math.floor((Date.now() - startedAt) / 1450))), 180);
    return () => window.clearInterval(timer);
  }, [stage]);

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoadingPhoto(true);
    setError('');
    try {
      const compressed = await compressImage(file, { targetSizeBytes: 450 * 1024, maxDimension: 1400 });
      const dataUrl = await fileToDataUrl(compressed);
      setPhoto(dataUrl);
      setPhotoPreview(dataUrl);
    } catch {
      setError('That photo could not be prepared. Try another image.');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const cleanDescription = description.trim();
    if (cleanDescription.length < 8) return setError('Add a little more detail so the right team can help.');
    setError('');
    setActiveStep(0);
    setUnderstandingData(null);
    setStage('understanding');
    const startedAt = Date.now();
    const paperReady = loadPaperModule().catch(() => null);
    try {
      let created;
      if (preview) {
        created = createPreviewReport(cleanDescription, photo);
        sessionStorage.setItem('campusfix_preview_complaint', JSON.stringify(created));
      } else {
        created = await createComplaint({
          title: cleanDescription.split(/[.!?\n]/)[0].trim().slice(0, 100) || 'Campus issue',
          description: cleanDescription,
          images: photo ? [photo] : [],
        });
      }
      setUnderstandingData(created);
      await Promise.all([wait(Math.max(0, TARGET_DURATION - (Date.now() - startedAt))), paperReady]);
      setComplaint(created);
      setStage('created');
    } catch (requestError) {
      setUnderstandingData(null);
      setError(requestError.message || 'Your report could not be sent. Please try again.');
      setStage('write');
    }
  };

  const reset = () => { setStage('write'); setComplaint(null); setUnderstandingData(null); setError(''); setDescription(''); setPhoto(null); setPhotoPreview(''); };
  const report = complaint ? {
    studentName: user?.name || (preview ? 'Pranjal Singh' : 'Student'),
    issueSummary: complaint.title || description,
    location: complaint.location || 'Location to be confirmed',
    category: complaint.department?.name || complaint.classification?.predictedDepartment || 'Being reviewed',
    priority: (complaint.priority || 'Medium').toString().replace(/^./, (letter) => letter.toUpperCase()),
    expectedResolution: complaint.expectedResolutionLabel || 'Timing to be confirmed',
    assignedTeam: complaint.department?.name || complaint.classification?.predictedDepartment || 'Finding the right team',
    status: complaint.status || 'Received',
    evidenceImages: (complaint.images || []).map((image) => typeof image === 'string' ? image : image?.url).filter(Boolean),
  } : {};
  const understandingFacts = [
    { label: 'What happened', revealAt: 1, value: activeStep >= 1 ? (understandingData?.title || description.trim().split(/[.!?\n]/)[0] || 'Reading your description') : 'Reading your description' },
    { label: 'Problem location', revealAt: 2, value: activeStep >= 2 ? (understandingData ? (understandingData.location || 'Location to be confirmed') : 'Still reading the place you described') : 'Looking for the place you described' },
    { label: 'CampusFix team', revealAt: 4, value: activeStep >= 4 ? (understandingData?.department?.name || understandingData?.classification?.predictedDepartment || (understandingData ? 'Needs review' : 'Still reviewing the report')) : 'Finding the right team' },
    { label: 'Priority', revealAt: 5, value: activeStep >= 5 ? (understandingData?.priority ? `${String(understandingData.priority).slice(0, 1).toUpperCase()}${String(understandingData.priority).slice(1)} priority` : (understandingData ? 'Being reviewed' : 'Checking what needs attention')) : 'Checking what needs attention' },
  ];

  return (
    <CinematicAtmosphere mouseInteraction={false} ambientEffects={stage !== 'understanding'} variant="violet">
      <div className="portal-topbar report-topbar"><BrandMark /><nav className="portal-nav"><Link to={preview ? '/__dev/student-dashboard' : '/dashboard'} className="portal-button">Student Dashboard</Link>{!preview && <button type="button" className="portal-button" onClick={logout}>Log out</button>}</nav></div>
      {stage === 'write' && <main className="portal-page campus-report-page">
        <section className="campus-report-intro"><div className="portal-kicker">A clear path starts here</div><h1 className="portal-title">What happened<br /><em>on campus?</em></h1><p className="portal-subtitle">Tell us in your own words. You don’t need to choose a category, team, or priority.</p></section>
        <section className="campus-report-compose" aria-label="Describe a campus issue">
          <form onSubmit={submit} className="campus-report-form">
            <label htmlFor="report-description" className="form-label">What happened?</label>
            <textarea id="report-description" className="form-input form-textarea campus-report-textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="The washrooms of Block 5 men's hostel, 6th floor, B wing are dirty…" maxLength={2000} required autoFocus aria-describedby="report-hint" />
            <div className="campus-report-meta"><span id="report-hint">Write naturally. Include a place if you know it.</span><span>{description.length}/2000</span></div>
            <div className="campus-report-attachment"><div><label htmlFor="report-photo" className="form-label">Add a photo <small>· optional</small></label><p>A photo can help the team understand what needs attention.</p></div><input id="report-photo" type="file" accept="image/*" onChange={handlePhoto} disabled={loadingPhoto} /></div>
            {photoPreview && <div className="campus-report-photo-preview"><img src={photoPreview} alt="Photo attached to your report" /><button type="button" className="portal-button" onClick={() => { setPhoto(null); setPhotoPreview(''); }}>Remove photo</button></div>}
            <div className="campus-report-identity"><span className="campus-report-identity-mark" aria-hidden="true">CF</span><span>This report will be filed under <strong>{user?.name || (preview ? 'Pranjal Singh' : 'your student account')}</strong>.</span></div>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="campus-report-submit"><SpecularButton type="submit" disabled={loadingPhoto || description.trim().length < 8} size="lg" radius={18} tint="#fff" tintOpacity={0.04} blur={8} textColor="#fff" lineColor="#F5D0FE" baseColor="#8B5CF6" intensity={1} shineSize={10} shineFade={40} thickness={1} speed={0.3} followMouse proximity={280} autoAnimate={false}>{loadingPhoto ? 'Preparing your photo…' : 'Send to CampusFix ↗'}</SpecularButton><span>CampusFix will handle the next steps.</span></div>
          </form>
        </section>
      </main>}

      {stage === 'understanding' && <main className="campus-understanding" aria-live="polite">
        <div className="campus-understanding-prism"><Prism animationType="3drotate" timeScale={0.18} height={3.8} baseWidth={5.8} scale={3.5} hueShift={0} colorFrequency={0.85} noise={0.12} glow={2.25} bloom={1.85} transparent={false} suspendWhenOffscreen /></div>
        <div className="campus-understanding-copy"><div className="portal-kicker">CampusFix is listening</div><p className="understanding-raw">“{description.trim()}”</p><h1 className="understanding-heading">{UNDERSTANDING_STEPS[activeStep]}</h1>
          <div className="understanding-stages">{UNDERSTANDING_STEPS.map((item, index) => <div className={`understanding-stage ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'passed' : ''}`} key={item}><span>{index < activeStep ? '✓' : String(index + 1).padStart(2, '0')}</span><span>{item}</span></div>)}</div>
          <div className="understanding-thread" aria-hidden="true"><span style={{ width: `${Math.min(100, ((activeStep + 1) / UNDERSTANDING_STEPS.length) * 100)}%` }} /></div>
        </div>
        <section className="understanding-readout" aria-label="Details coming into focus">
          <div className="understanding-readout-head"><span>DETAILS COMING INTO FOCUS</span><span>{activeStep === UNDERSTANDING_STEPS.length - 1 ? 'REPORT READY' : 'CAMPUSFIX'}</span></div>
          {understandingFacts.map((fact, index) => <div className={`understanding-readout-row ${activeStep >= fact.revealAt ? 'is-current' : 'is-pending'}`} key={fact.label}>
            <span className="understanding-readout-index">0{index + 1}</span>
            <div><span>{fact.label}</span><strong>{fact.value}</strong></div>
            <i aria-hidden="true">{activeStep >= fact.revealAt ? '·' : '—'}</i>
          </div>)}
          <p className="understanding-readout-note">We use the place where the problem happened—not the student’s home or residence.</p>
        </section>
      </main>}

      {stage === 'created' && <main className="campus-report-created">
        <div className="report-created-heading"><div className="portal-kicker">Your report is ready</div><h1>REPORT <em>CREATED</em></h1><p>Tap to open your CampusFix report.</p></div>
        <div className="report-paper-stage">
          <div className="report-paper-watermark" aria-hidden="true">CAMPUSFIX</div>
          <Suspense fallback={<div className="report-paper-loading" role="status">Preparing your report…</div>}><ThreeDPaper className="report-paper-object" report={report} /></Suspense>
        </div>
        <div className="report-created-actions"><Link to={preview ? `/__dev/complaints?selected=${complaint?._id}` : complaint?._id ? `/complaints/${complaint._id}` : '/complaints'} className="report-open-link">Tap to open your CampusFix report <span aria-hidden="true">↗</span></Link><button type="button" className="report-start-another" onClick={reset}>Create another report</button></div>
      </main>}
    </CinematicAtmosphere>
  );
}
