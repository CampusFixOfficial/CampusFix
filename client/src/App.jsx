import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import './index.css';

const Landing = lazy(() => import('./shared/components/Landing'));
const Login = lazy(() => import('./student-portal/Login'));
const Register = lazy(() => import('./student-portal/Register'));
const StudentDashboard = lazy(() => import('./student-portal/StudentDashboard'));
const Complaints = lazy(() => import('./student-portal/Complaints'));
const ComplaintNew = lazy(() => import('./student-portal/ComplaintNew'));
const ComplaintDetail = lazy(() => import('./student-portal/ComplaintDetail'));
const AuthorityLogin = lazy(() => import('./student-portal/AuthorityLogin'));
const AuthorityDashboard = lazy(() => import('./student-portal/AuthorityDashboard'));
const AdminDashboard = lazy(() => import('./student-portal/AdminDashboard'));
const CampusProblemLandscape = lazy(() => import('./student-portal/CampusProblemLandscape'));
const CampusProblemLandscapePreview = import.meta.env.DEV ? lazy(() => import('./student-portal/CampusProblemLandscapePreview')) : null;
const StudentDashboardPreview = import.meta.env.DEV ? lazy(() => import('./student-portal/StudentDashboardPreview')) : null;
const ComplaintDetailPreview = import.meta.env.DEV ? lazy(() => import('./student-portal/ComplaintDetailPreview')) : null;
const ReportIssuePreview = import.meta.env.DEV ? lazy(() => import('./student-portal/ReportIssuePreview')) : null;
const DevComplaintsPreview = import.meta.env.DEV ? lazy(() => import('./student-portal/DevComplaintsPreview')) : null;
const AuthorityDashboardPreview = import.meta.env.DEV ? lazy(() => import('./student-portal/AuthorityDashboardPreview')) : null;
const AdminDashboardPreview = import.meta.env.DEV ? lazy(() => import('./student-portal/AdminDashboardPreview')) : null;

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-container" role="status" aria-label="Loading account"><div className="spinner" /></div>;
  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/admin')
      ? '/admin/login'
      : location.pathname.startsWith('/authority')
        ? '/authority/login'
        : '/login';
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const home = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/authority' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  return children;
}

function AppRoutes() {
  return <div className="content-wrapper"><Suspense fallback={<div className="loading-container" role="status" aria-label="Loading CampusFix"><div className="spinner" /></div>}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/authority/login" element={<AuthorityLogin />} />
    <Route path="/admin/login" element={<AuthorityLogin />} />

    {import.meta.env.DEV && <>
      <Route path="/__dev/student-dashboard" element={<StudentDashboardPreview />} />
      <Route path="/__dev/report-issue" element={<ReportIssuePreview />} />
      <Route path="/__dev/complaints" element={<DevComplaintsPreview />} />
      <Route path="/__dev/complaint-detail" element={<ComplaintDetailPreview />} />
      <Route path="/__dev/authority-dashboard" element={<AuthorityDashboardPreview />} />
      <Route path="/__dev/admin-dashboard" element={<AdminDashboardPreview />} />
      <Route path="/__dev/campus-problem-landscape" element={<CampusProblemLandscapePreview />} />
    </>}

    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
    <Route path="/complaints" element={<ProtectedRoute allowedRoles={['student']}><Complaints /></ProtectedRoute>} />
    <Route path="/complaints/new" element={<ProtectedRoute allowedRoles={['student']}><ComplaintNew /></ProtectedRoute>} />
    <Route path="/complaints/:id" element={<ProtectedRoute allowedRoles={['student', 'staff', 'admin']}><ComplaintDetail /></ProtectedRoute>} />
    <Route path="/authority" element={<ProtectedRoute allowedRoles={['staff']}><AuthorityDashboard /></ProtectedRoute>} />
    <Route path="/authority/landscape" element={<Navigate to="/authority" replace />} />
    <Route path="/staff/dashboard" element={<Navigate to="/authority" replace />} />
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/landscape" element={<ProtectedRoute allowedRoles={['admin']}><CampusProblemLandscape /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></div>;
}

export default function App() {
  return <Router><AuthProvider><AppRoutes /></AuthProvider></Router>;
}
