// =============================================================
// CampusFix - Register Page
// =============================================================
// Owner: Pranjal (student portal) — shared across portals
// =============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import '../shared/components/Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    rollNumber: '',
    hostel: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        rollNumber: formData.rollNumber,
        hostel: formData.hostel,
        phone: formData.phone,
      });

      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'staff') navigate('/staff/dashboard');
      else navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">📝</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join CampusFix and start filing complaints</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="auth-role-selector">
            {['student', 'staff', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                className={`auth-role-btn ${formData.role === role ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role })}
              >
                {role === 'student' ? '🎓 Student' : role === 'staff' ? '👷 Staff' : '🔑 Admin'}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="your.email@college.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {formData.role === 'student' && (
            <>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  className="form-input"
                  placeholder="e.g., CSE2024001"
                  value={formData.rollNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hostel / Building</label>
                <input
                  type="text"
                  name="hostel"
                  className="form-input"
                  placeholder="e.g., Hostel A"
                  value={formData.hostel}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="Your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
