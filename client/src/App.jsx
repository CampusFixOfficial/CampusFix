// =============================================================
// CampusFix - Main App Component (Root Router)
// =============================================================
// Sets up React Router and wraps the app in AuthProvider.
// Routes are organized by portal/ownership area.
// Owner: Bhavishya (architecture/integration)
// =============================================================

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import Navbar from './shared/components/Navbar';
import Landing from './shared/components/Landing';

// Student Portal pages (Pranjal's area)
import Login from './student-portal/Login';
import Register from './student-portal/Register';

import './index.css';

// Protected route wrapper — redirects to login if not authenticated
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

// Placeholder pages (will be built by Pranjal and Prisha)
function StudentDashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-fade-in">
          <h1 className="page-title">Welcome, <span className="gradient-text">{user?.name}</span> 👋</h1>
          <p className="page-subtitle">Your student dashboard — manage and track complaints</p>
        </div>
        <div className="grid grid-3">
          <div className="card">
            <span style={{ fontSize: '2rem' }}>📝</span>
            <h3 style={{ margin: '0.5rem 0' }}>File a Complaint</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Describe your issue and we'll route it automatically.
            </p>
          </div>
          <div className="card">
            <span style={{ fontSize: '2rem' }}>📋</span>
            <h3 style={{ margin: '0.5rem 0' }}>My Complaints</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Track the status of all your submitted complaints.
            </p>
          </div>
          <div className="card">
            <span style={{ fontSize: '2rem' }}>⭐</span>
            <h3 style={{ margin: '0.5rem 0' }}>Rate Resolutions</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Provide feedback on resolved complaints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffDashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-fade-in">
          <h1 className="page-title">Department Queue</h1>
          <p className="page-subtitle">View and manage complaints assigned to your department</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)' }}>
            🚧 Employee dashboard coming soon — will be built by Prisha.
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-fade-in">
          <h1 className="page-title">Admin <span className="gradient-text">Dashboard</span></h1>
          <p className="page-subtitle">Overview of all campus complaints and analytics</p>
        </div>
        <div className="grid grid-4">
          <div className="card">
            <span style={{ fontSize: '2rem' }}>📊</span>
            <h3 style={{ margin: '0.5rem 0' }}>Total Complaints</h3>
            <p className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>—</p>
          </div>
          <div className="card">
            <span style={{ fontSize: '2rem' }}>⏳</span>
            <h3 style={{ margin: '0.5rem 0' }}>Pending</h3>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-warning)' }}>—</p>
          </div>
          <div className="card">
            <span style={{ fontSize: '2rem' }}>✅</span>
            <h3 style={{ margin: '0.5rem 0' }}>Resolved</h3>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>—</p>
          </div>
          <div className="card">
            <span style={{ fontSize: '2rem' }}>🚨</span>
            <h3 style={{ margin: '0.5rem 0' }}>Escalated</h3>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-danger)' }}>—</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <div className="content-wrapper">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes (Pranjal's area) */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          {/* Staff routes (Prisha's area) */}
          <Route path="/staff/dashboard" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />

          {/* Admin routes (Prisha's area) */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
