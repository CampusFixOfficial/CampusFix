import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import { CinematicAtmosphere, BrandMark } from '../shared/components/CinematicAtmosphere';
import { CAMPUSFIX_DEPARTMENTS } from '../shared/constants/departments';
import { LockIcon } from './components/Icons';
import '../shared/components/Auth.css';

export default function AuthorityLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminLogin = location.pathname === '/admin/login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(email.trim().toLowerCase(), password, {
        employeeId: employeeId.trim(),
        departmentName,
      });
      const role = response.user.role;
      if (role === 'staff') navigate('/authority');
      else if (role === 'admin') navigate('/admin');
      else { logout(); setError('This sign-in is for approved CampusFix authorities. Use the student portal to sign in.'); }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Could not sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return <CinematicAtmosphere variant="auth"><div className="auth-page"><div className="portal-topbar"><BrandMark /><Link to="/" className="portal-button">CampusFix home</Link></div><div className="auth-card">
    <div className="auth-header"><div className="auth-icon-box" aria-hidden="true"><LockIcon size={20} /></div><h1 className="auth-title">{isAdminLogin ? 'Admin access' : 'Authority access'}</h1><p className="auth-subtitle">{isAdminLogin ? 'Sign in with the administrator work email and password. Admin accounts do not need an employee ID or department selection.' : 'Sign in with your work email and password. Authority team members also enter their employee ID and choose their assigned department. CampusFix checks these against the account—this does not let you switch teams. Administrators may leave those two fields blank.'}</p></div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    <form className="auth-form" onSubmit={submit}>
      <div className="form-group"><label className="form-label" htmlFor="authority-email">Work email</label><input id="authority-email" type="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></div>
      <div className="form-group"><label className="form-label" htmlFor="authority-password">Password</label><input id="authority-password" type="password" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
      {!isAdminLogin && <><div className="form-group"><label className="form-label" htmlFor="authority-employee-id">Employee ID <span>(Authority accounts)</span></label><input id="authority-employee-id" type="text" className="form-input" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} autoComplete="off" /></div>
      <div className="form-group"><label className="form-label" htmlFor="authority-department">Assigned department <span>(Authority accounts)</span></label><select id="authority-department" className="form-input form-select" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)}><option value="">Choose your assigned department</option>{CAMPUSFIX_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}</select></div></>}
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Signing in…' : isAdminLogin ? 'Open Admin dashboard' : 'Open authority space'}</button>
    </form>
    <p className="auth-subtitle authority-login-hint">Need to see the layout before the database is connected? Open the preview below; it uses sample records only.</p>
    <div className="auth-footer"><Link to="/login">Student sign in</Link>{import.meta.env.DEV && <Link to="/__dev/authority-dashboard">Preview authority workspace</Link>}</div>
  </div></div></CinematicAtmosphere>;
}
