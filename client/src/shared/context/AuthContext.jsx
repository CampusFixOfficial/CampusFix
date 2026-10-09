// =============================================================
// CampusFix - Auth Context (React Context for Authentication)
// =============================================================
// Stores the logged-in user's info and JWT token across pages.
// Any component can check "is the user logged in?" and "what role?"
// Owner: Bhavishya (shared/auth integration)
// =============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }) {
  const { pathname } = useLocation();
  const isLocalDemo = import.meta.env.DEV && pathname.startsWith('/__dev/');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('campusfix_token'));
  const [loading, setLoading] = useState(true);

  // Set up axios defaults whenever token changes
  useEffect(() => {
    if (token && !isLocalDemo) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('campusfix_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      if (!token) localStorage.removeItem('campusfix_token');
    }
  }, [token, isLocalDemo]);

  // On app load, check if we have a valid token and fetch user info
  useEffect(() => {
    const loadUser = async () => {
      if (isLocalDemo) {
        setLoading(false);
        return;
      }
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data.data.user);
      } catch (error) {
        // Token is invalid or expired — clear it
        console.error('Auth check failed:', error);
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    loadUser();
  }, [token, isLocalDemo]);

  // Register a new account
  const register = async (userData) => {
    const res = await axios.post(`${API_URL}/auth/register`, userData);
    setToken(res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  };

  // Log in to an existing account
  const login = async (email, password, identity = {}) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password, ...identity });
    setToken(res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data;
  };

  // Log out
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isStaff: user?.role === 'staff',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
