import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { FileTextIcon } from './components/Icons';
import '../shared/components/Auth.css';
import './StudentPortal.css';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';

const PROGRAM_CODES = String(import.meta.env.VITE_VIT_PROGRAM_CODES || '').split(',').map((code) => code.trim().toUpperCase()).filter(Boolean);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', registrationNumber: '', email: '', password: '', confirmPassword: '', studentType: '', hostel: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: name === 'registrationNumber' ? value.replace(/\s/g, '').toUpperCase() : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const registrationNumber = formData.registrationNumber.replace(/\s/g, '').toUpperCase();
    const match = registrationNumber.match(/^(\d{2})([A-Z]{2,6})(\d{3,8})$/);
    if (!match) return setError('Enter your registration number, for example 25BCE10746.');
    if (PROGRAM_CODES.length && !PROGRAM_CODES.includes(match[2])) return setError('That program code is not currently enabled.');
    const email = formData.email.trim().toLowerCase();
    const localPart = email.split('@')[0] || '';
    if (email.split('@')[1] !== 'vitbhopal.ac.in' || localPart.toUpperCase().slice(localPart.lastIndexOf('.') + 1) !== registrationNumber || localPart.length <= registrationNumber.length + 1) {
      return setError('Use your VIT Bhopal email and make sure it contains the same registration number.');
    }
    if (!['Hosteller', 'Day Scholar'].includes(formData.studentType)) return setError('Choose Hosteller or Day Scholar.');
    if (formData.studentType === 'Hosteller' && !formData.hostel.trim()) return setError('Add your hostel details.');
    if (formData.password.length < 8) return setError('Use a password with at least 8 characters.');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        registrationNumber,
        rollNumber: registrationNumber,
        email,
        password: formData.password,
        studentType: formData.studentType,
        hostel: formData.studentType === 'Hosteller' ? formData.hostel.trim() : '',
      });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CinematicAtmosphere variant="auth">
      <div className="auth-page"><div className="portal-topbar"><BrandMark /><Link to="/login" className="portal-button">Log in</Link></div>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-box" aria-hidden="true"><FileTextIcon size={20} /></div>
            <h1 className="auth-title">Your campus, in good hands.</h1>
            <p className="auth-subtitle">Create your VIT Bhopal student account to report and follow campus issues.</p>
          </div>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label" htmlFor="student-name">Full name</label><input id="student-name" type="text" name="name" className="form-input" placeholder="Your name" value={formData.name} onChange={handleChange} minLength={2} required autoComplete="name" /></div>
            <div className="form-group"><label className="form-label" htmlFor="registration-number">Registration number</label><input id="registration-number" type="text" name="registrationNumber" className="form-input" placeholder="25BCE10746" value={formData.registrationNumber} onChange={handleChange} pattern="[0-9]{2}[A-Za-z]{2,6}[0-9]{3,8}" title="Two-digit year, program code, and student number" required autoCapitalize="characters" /></div>
            <div className="form-group"><label className="form-label" htmlFor="student-email">VIT email</label><input id="student-email" type="email" name="email" className="form-input" placeholder="name.25bce10746@vitbhopal.ac.in" value={formData.email} onChange={handleChange} required autoComplete="email" /></div>
            <fieldset className="student-type-fieldset"><legend className="form-label">I am a…</legend><div className="student-type-options">
              {['Hosteller', 'Day Scholar'].map((type) => <label className={`student-type-option ${formData.studentType === type ? 'selected' : ''}`} key={type}><input type="radio" name="studentType" value={type} checked={formData.studentType === type} onChange={handleChange} required /><span>{type}</span></label>)}
            </div></fieldset>
            {formData.studentType === 'Hosteller' && <div className="form-group hosteller-fields"><label className="form-label" htmlFor="hostel-details">Hostel / block</label><input id="hostel-details" type="text" name="hostel" className="form-input" placeholder="Your hostel and block" value={formData.hostel} onChange={handleChange} required autoComplete="off" /></div>}
            <div className="form-group"><label className="form-label" htmlFor="student-password">Password</label><input id="student-password" type="password" name="password" className="form-input" placeholder="At least 8 characters" value={formData.password} onChange={handleChange} minLength={8} required autoComplete="new-password" /></div>
            <div className="form-group"><label className="form-label" htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" name="confirmPassword" className="form-input" placeholder="Enter it once more" value={formData.confirmPassword} onChange={handleChange} minLength={8} required autoComplete="new-password" /></div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating your account…' : 'Create student account'}</button>
          </form>
          <div className="auth-footer">Already have an account? <Link to="/login">Log in</Link></div>
        </div>
      </div>
    </CinematicAtmosphere>
  );
}
