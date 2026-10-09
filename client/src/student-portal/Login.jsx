// =============================================================
// CampusFix - Login Page
// =============================================================
// Owner: Pranjal (student portal) — shared across portals
// =============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { LockIcon } from './components/Icons';
import '../shared/components/Auth.css';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      const role = res.user.role;

      // Redirect based on role
      if (role === 'admin') navigate('/admin');
      else if (role === 'staff') navigate('/authority');
      else navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <CinematicAtmosphere variant="auth">
    <div className="auth-page"><div className="portal-topbar"><BrandMark /><Link to="/register" className="portal-button">Create account</Link></div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-box" aria-hidden="true">
            <LockIcon size={20} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Log in to your VIT Bhopal student account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="name.25bce10746@vitbhopal.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
    </CinematicAtmosphere>
  );
}
