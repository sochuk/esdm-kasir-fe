import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, loginSuccess, checkAuthStart } from './features/auth/authSlice';
import axiosInstance from './api/axiosInstance';
import Login from './pages/Login';
import MemberProfile from './pages/MemberProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminInventaris from './pages/AdminInventaris';
import AdminTransaksi from './pages/AdminTransaksi';
import AdminProfil from './pages/AdminProfil';
import Toast from './components/Toast';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, status } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      // Initial status was already set to 'loading' in authSlice.js if token existed
      axiosInstance.get('/api/auth/me')
        .then(res => dispatch(loginSuccess({ ...res.data, _token: token })))
        .catch(() => { 
            localStorage.removeItem('token'); 
            dispatch(logout()); 
        });
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Handling redirection securely when hitting the root URL
    if (status !== 'loading') {
      if (!isAuthenticated) {
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } else {
        if (location.pathname === '/' || location.pathname === '/login') {
          if (user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/member/profile', { replace: true });
          }
        }
      }
    }
  }, [isAuthenticated, user, location.pathname, navigate, status]);

  if (status === 'loading') {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-logo">
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--color-primary)' }}>bolt</span>
          </div>
          <h1 className="splash-title">ESDM KASIR</h1>
          <div className="splash-loader">
            <div className="loader-bar"></div>
          </div>
          <p className="splash-text">Menyiapkan lingkungan sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast />
      <Routes>
      {/* Default/Login Page */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes: Member Level */}
      <Route 
        path="/member/profile" 
        element={
          isAuthenticated && user?.role === 'member' 
            ? <MemberProfile /> 
            : <Navigate to="/login" replace />
        } 
      />

      {/* Protected Routes: Admin Level */}
      <Route 
        path="/admin/dashboard" 
        element={
          isAuthenticated && user?.role === 'admin' 
            ? <AdminDashboard /> 
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/admin/inventaris" 
        element={
          isAuthenticated && user?.role === 'admin' 
            ? <AdminInventaris /> 
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/admin/transaksi" 
        element={
          isAuthenticated && user?.role === 'admin' 
            ? <AdminTransaksi /> 
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/admin/profil" 
        element={
          isAuthenticated && user?.role === 'admin' 
            ? <AdminProfil /> 
            : <Navigate to="/login" replace />
        } 
      />
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
