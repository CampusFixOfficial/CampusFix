// =============================================================
// CampusFix - Navbar Component
// =============================================================
// Top navigation bar matching concept visual aesthetic.
// Supports both public landing page links (Home, How It Works, Features, About)
// and role-based authenticated routes.
// Zero emojis — clean typography and vector marks.
// =============================================================

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout, isStudent, isStaff, isAdmin } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const scrollToSection = (e, sectionId) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setMenuOpen(false);
      }
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#navLogoGrad)" strokeWidth="1.75" />
              <path d="M7 12h10M12 7v10" stroke="url(#navLogoGrad)" strokeWidth="1.75" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2" fill="#f472b6" />
              <defs>
                <linearGradient id="navLogoGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f472b6" />
                  <stop offset="1" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="navbar-brand-text">
            Campus<span>Fix</span>
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>

        {/* Navigation Links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              {/* Student links */}
              {isStudent && (
                <>
                  <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`} onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/complaints/new" className={`navbar-link ${isActive('/complaints/new')}`} onClick={() => setMenuOpen(false)}>
                    New Complaint
                  </Link>
                  <Link to="/complaints" className={`navbar-link ${isActive('/complaints')}`} onClick={() => setMenuOpen(false)}>
                    My Complaints
                  </Link>
                </>
              )}

              {/* Staff links */}
              {isStaff && (
                <>
                  <Link to="/staff/dashboard" className={`navbar-link ${isActive('/staff/dashboard')}`} onClick={() => setMenuOpen(false)}>
                    Department Queue
                  </Link>
                </>
              )}

              {/* Admin links */}
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" className={`navbar-link ${isActive('/admin/dashboard')}`} onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <a href="/admin#admin-reports" className="navbar-link" onClick={() => setMenuOpen(false)}>
                    All Complaints
                  </a>
                  <a href="/admin#admin-mapping" className="navbar-link" onClick={() => setMenuOpen(false)}>
                    Departments
                  </a>
                </>
              )}
            </>
          ) : (
            <>
              {/* Public Concept Links */}
              <a
                href="/#home"
                className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={(e) => scrollToSection(e, 'home')}
              >
                Home
              </a>
              <a
                href="/#how-it-works"
                className="navbar-link"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
              >
                How It Works
              </a>
              <a
                href="/#features"
                className="navbar-link"
                onClick={(e) => scrollToSection(e, 'features')}
              >
                Features
              </a>
              <a
                href="/#about"
                className="navbar-link"
                onClick={(e) => scrollToSection(e, 'about')}
              >
                About
              </a>

              <div className="navbar-actions-group">
                <Link to="/login" className={`navbar-link navbar-login-link ${isActive('/login')}`} onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="navbar-cta-btn" onClick={() => setMenuOpen(false)}>
                  Report an Issue
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User info + logout */}
        {isAuthenticated && user && (
          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user.name}</div>
              <div className="navbar-user-role">{user.role}</div>
            </div>
            <div className="navbar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
