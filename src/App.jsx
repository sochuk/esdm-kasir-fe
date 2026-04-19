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
import AdminMasterData from './pages/AdminMasterData';
import AdminMasterAnggota from './pages/AdminMasterAnggota';
import AdminProfitProduk from './pages/AdminProfitProduk';
import Toast from './components/Toast';
import AdminLayout from './components/AdminLayout';
import './App.css';

// Helper: cek apakah role termasuk admin-level
const isAdminLevel = (role) => ['admin', 'super_admin', 'kasir'].includes(role);
const isFullAdmin = (role) => ['admin', 'super_admin'].includes(role);

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userRole = useSelector((state) => state.auth.user?.role);
  const status = useSelector((state) => state.auth.status);
  const navigate = useNavigate();
  const location = useLocation();

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      axiosInstance.get('/api/auth/me')
        .then(res => dispatch(loginSuccess({ ...res.data, _token: token })))
        .catch(() => { 
            localStorage.removeItem('token'); 
            dispatch(logout()); 
        });
    }
  }, [dispatch, isAuthenticated]);



  useEffect(() => {
    if (status !== 'loading') {
      if (!isAuthenticated) {
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      } else {
        if (location.pathname === '/' || location.pathname === '/login') {
          if (isAdminLevel(userRole)) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate('/member/profile', { replace: true });
          }
        }
      }
    }
  }, [isAuthenticated, userRole, location.pathname, navigate, status]);

  if (status === 'loading') {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '4rem', height: '4rem', color: 'var(--color-primary)' }}>
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" fill="none"/>
              <path d="M20 6 L20 34 M6 20 L34 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11 11 L29 29 M29 11 L11 29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <circle cx="20" cy="20" r="5" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="splash-title" style={{ fontSize: '1.3rem', lineHeight: '1.3' }}>Koperasi Konsumen Pegawai KESDM</h1>
          <div className="splash-loader">
            <div className="loader-bar"></div>
          </div>
          <p className="splash-text">Menyiapkan lingkungan sistem...</p>
        </div>
      </div>
    );
  }

  // Guard component yang fleksibel berdasarkan role
  const AdminRoute = ({ element, fullAdminOnly = false }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdminLevel(userRole)) return <Navigate to="/login" replace />;
    if (fullAdminOnly && !isFullAdmin(userRole)) return <Navigate to="/admin/dashboard" replace />;
    return element;
  };

  return (
    <>
      <Toast />
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Member */}
        <Route path="/member/profile" element={isAuthenticated && userRole === 'member' ? <MemberProfile /> : <Navigate to="/login" replace />} />

        {/* Admin Routes Wrapper */}
        <Route element={<AdminRoute element={<AdminLayout />} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/transaksi" element={<AdminTransaksi />} />
            <Route path="/admin/profil" element={<AdminProfil />} />
            <Route path="/admin/inventaris" element={<AdminRoute element={<AdminInventaris />} fullAdminOnly />} />
            <Route path="/admin/profit" element={<AdminRoute element={<AdminProfitProduk />} fullAdminOnly />} />
            <Route path="/admin/master-data" element={<AdminRoute element={<AdminMasterData />} fullAdminOnly />} />
            <Route path="/admin/anggota" element={<AdminRoute element={<AdminMasterAnggota />} fullAdminOnly />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
