// =============================================================
// CampusFix - Landing Page
// =============================================================
// The first page visitors see — explains what CampusFix does
// and invites them to sign up or log in.
// =============================================================

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { isAuthenticated, isStudent, isStaff, isAdmin } = useAuth();

  // If already logged in, show a quick-access dashboard link
  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isStaff) return '/staff/dashboard';
    return '/dashboard';
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <span className="hero-badge">🚀 Zero-cost campus solution</span>

        <h1 className="hero-title">
          Campus complaints,{' '}
          <span className="highlight">solved automatically.</span>
        </h1>

        <p className="hero-description">
          CampusFix captures every complaint — broken fans, dirty washrooms,
          bullying — auto-routes it to the right authority, and tracks it
          until it's resolved. No more lost emails or ignored WhatsApp messages.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to={getDashboardLink()} className="btn btn-primary btn-lg">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started — It's Free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Log In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">6</div>
          <div className="stat-label">Departments Covered</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">AI</div>
          <div className="stat-label">Auto-Classification</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">0₹</div>
          <div className="stat-label">Zero Cost</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Always Available</div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-header">
          <h2 className="features-title">
            Why <span className="gradient-text">CampusFix</span>?
          </h2>
          <p className="features-subtitle">
            Built by students, for students — every feature solves a real problem.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3 className="feature-title">Auto-Classification</h3>
            <p className="feature-desc">
              Describe your problem in plain language. Our AI figures out which
              department should handle it — no forms to fill, no guessing.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📸</span>
            <h3 className="feature-title">Photo Evidence</h3>
            <p className="feature-desc">
              Attach a photo of the broken fan, dirty washroom, or damaged property.
              Authorities see the evidence immediately.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3 className="feature-title">Anonymous Mode</h3>
            <p className="feature-desc">
              Report bullying, harassment, or ragging without revealing your identity.
              Only the Discipline Cell sees these complaints.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3 className="feature-title">Live Status Tracking</h3>
            <p className="feature-desc">
              Track your complaint from Received → Assigned → In Progress → Resolved.
              Know exactly where it stands, always.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⏰</span>
            <h3 className="feature-title">Auto-Escalation</h3>
            <p className="feature-desc">
              If nobody acts within the SLA, the system automatically escalates
              your complaint to higher authorities.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⭐</span>
            <h3 className="feature-title">Rate & Feedback</h3>
            <p className="feature-desc">
              Once resolved, rate the resolution quality. This helps hold
              departments accountable and improve over time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
