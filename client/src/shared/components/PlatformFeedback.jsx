import { useEffect, useId, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitPlatformFeedback } from '../services/feedbackService';
import './PlatformFeedback.css';

const TOPICS = [
  ['general', 'General feedback'],
  ['suggestion', 'Suggestion'],
  ['system_issue', 'Something is not working'],
  ['routing', 'Report routing'],
  ['coordination', 'Team coordination'],
  ['usability', 'Ease of use'],
];

export default function PlatformFeedback({ open, onClose, source = 'CampusFix', demo = false }) {
  const { user } = useAuth();
  const id = useId();
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape' && !busy) onClose?.(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onClose]);

  useEffect(() => {
    if (open) {
      setTopic('general'); setMessage(''); setContactEmail(''); setError(''); setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const cleanMessage = message.trim();
    if (cleanMessage.length < 8) { setError('Add a little more detail before sending.'); return; }
    setBusy(true);
    try {
      if (!demo) await submitPlatformFeedback({ topic, message: cleanMessage, contactEmail: user ? '' : contactEmail.trim(), source });
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || 'Your feedback could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="cf-feedback-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose?.(); }}>
    <section className="cf-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-copy`}>
      <button className="cf-feedback-close" type="button" aria-label="Close feedback" onClick={onClose} disabled={busy}>×</button>
      {success ? <div className="cf-feedback-success" role="status">
        <span className="portal-kicker">CampusFix · Thank you</span>
        <h2 id={`${id}-title`}>Your voice helps us improve.</h2>
        <p>{demo ? 'Preview only: this sample feedback was not sent or saved.' : 'Your platform feedback has been shared with the CampusFix Admin team.'}</p>
        <button className="portal-button portal-button--primary" type="button" onClick={onClose}>Done</button>
      </div> : <>
        <span className="portal-kicker">CampusFix · Platform feedback</span>
        <h2 id={`${id}-title`}>Help us make this work better.</h2>
        <p id={`${id}-copy`}>Share a suggestion or tell us what made reporting and follow-up harder. This is platform feedback—not a complaint update or resolution rating.</p>
        {user && <p className="cf-feedback-identity">Sending as {user.name} · {user.role === 'staff' ? 'Authority' : user.role === 'student' ? 'Student' : 'Admin'}</p>}
        <form onSubmit={submit}>
          <label htmlFor={`${id}-topic`}>What is this about?</label>
          <select id={`${id}-topic`} className="form-input form-select" value={topic} onChange={(event) => setTopic(event.target.value)}>
            {TOPICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label htmlFor={`${id}-message`}>Your feedback</label>
          <textarea id={`${id}-message`} className="form-input form-textarea" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} minLength={8} rows={5} placeholder="Tell us what happened or what would help." required />
          {!user && <>
            <label htmlFor={`${id}-email`}>Email for a reply <span>(optional)</span></label>
            <input id={`${id}-email`} className="form-input" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} maxLength={254} placeholder="you@example.com" autoComplete="email" />
          </>}
          {error && <p className="cf-feedback-error" role="alert">{error}</p>}
          <div className="cf-feedback-actions"><button className="portal-button portal-button--quiet" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="portal-button portal-button--primary" type="submit" disabled={busy || message.trim().length < 8}>{busy ? 'Sending…' : 'Send feedback'}</button></div>
        </form>
        <small className="cf-feedback-privacy">{demo ? 'Sample mode · nothing leaves this page.' : 'Platform feedback is visible to CampusFix Admin. Do not include emergency or confidential information.'}</small>
      </>}
    </section>
  </div>;
}
