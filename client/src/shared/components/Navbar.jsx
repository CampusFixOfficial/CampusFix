// =============================================================
// CampusFix - Navbar Component
// =============================================================
// Top navigation bar with role-based links and user info.
// Owner: Shared (used by both portals)
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

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-icon">🏫</span>
          <span className="navbar-brand-text">
            Campus<span>Fix</span>
          </span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              {/* Student links */}
              {isStudent && (
                <>
                  <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`}>
                    Dashboard
                  </Link>
                  <Link to="/complaints/new" className={`navbar-link ${isActive('/complaints/new')}`}>
                    New Complaint
                  </Link>
                  <Link to="/complaints" className={`navbar-link ${isActive('/complaints')}`}>
                    My Complaints
                  </Link>
                </>
              )}

              {/* Staff links */}
              {isStaff && (
                <>
                  <Link to="/staff/dashboard" className={`navbar-link ${isActive('/staff/dashboard')}`}>
                    Department Queue
                  </Link>
                </>
              )}

              {/* Admin links */}
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" className={`navbar-link ${isActive('/admin/dashboard')}`}>
                    Dashboard
                  </Link>
                  <Link to="/admin/complaints" className={`navbar-link ${isActive('/admin/complaints')}`}>
                    All Complaints
                  </Link>
                  <Link to="/admin/departments" className={`navbar-link ${isActive('/admin/departments')}`}>
                    Departments
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className={`navbar-link ${isActive('/login')}`}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
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
