import { Link } from 'react-router-dom';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';
import './StudentPortal.css';

export default function DevComplaintsPreview() {
  return <CinematicAtmosphere variant="violet"><div className="portal-topbar"><BrandMark /><nav className="portal-nav" aria-label="Student report navigation"><Link className="portal-button" to="/__dev/report-issue">Report an issue</Link><Link className="portal-button" to="/__dev/student-dashboard">Student Dashboard</Link></nav></div><main className="portal-page dev-complaints-page"><div className="portal-kicker">Your CampusFix space</div><h1 className="portal-title">Reports in <em>motion.</em></h1><p className="portal-subtitle">Your submitted reports will appear here with their team assignment, progress, and resolution updates.</p><section className="authority-empty authority-empty-refined"><div className="portal-kicker">No reports yet</div><h2>Your report list is clear.</h2><p>Submit a campus issue to start tracking it from the moment it is received.</p><Link to="/__dev/report-issue" className="portal-button portal-button--primary">Report an issue</Link></section></main></CinematicAtmosphere>;
}
