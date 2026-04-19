import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import './AdminSidebar.css';

const KoperasiLogo = ({ size = '1.2rem' }) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size, color: 'currentColor' }}>
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" fill="none"/>
        <path d="M20 6 L20 34 M6 20 L34 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="5" fill="currentColor"/>
    </svg>
);

const NavButton = memo(({ to, icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`nav-item ${isActive ? 'nav-active' : ''}`}
        type="button"
    >
        <span className="material-symbols-outlined">{icon}</span>
        <span>{label}</span>
    </button>
));
NavButton.displayName = 'NavButton';

const AdminSidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const userName = useSelector((state) => state.auth.user?.name || state.auth.user?.username || 'Administrator');
    const userRole = useSelector((state) => state.auth.user?.role);
    const isFullAdmin = ['admin', 'super_admin'].includes(userRole);

    const handleNav = useCallback((to) => {
        navigate(to);
    }, [navigate]);

    const handleLogout = useCallback((e) => {
        e.preventDefault();
        dispatch(logout());
    }, [dispatch]);

    const currentPath = location.pathname;

    return (
        <aside className="global-sidebar">
            <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ background: 'var(--color-primary-fixed)', borderRadius: '0.4rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#18181b' }}>
                        <KoperasiLogo size="1.1rem" />
                    </div>
                    <div>
                        <h1 className="sidebar-brand" style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>Koperasi Konsumen<br/>Pegawai KESDM</h1>
                    </div>
                </div>
            </div>

            <div className="sidebar-profile">
                <div className="sidebar-avatar" style={{ background: 'var(--color-primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18181b', fontWeight: 900, fontSize: '1rem' }}>
                    {userName[0].toUpperCase()}
                </div>
                <div className="sidebar-identity">
                    <p className="sidebar-name">{userName}</p>
                    <p className="sidebar-role">{userRole === 'super_admin' ? 'Super Admin' : userRole === 'kasir' ? 'Admin Kasir' : 'Administrator'}</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavButton to="/admin/dashboard" icon="dashboard" label="Dashboard" isActive={currentPath === '/admin/dashboard'} onClick={() => handleNav('/admin/dashboard')} />
                <NavButton to="/admin/transaksi" icon="receipt_long" label="Riwayat Transaksi" isActive={currentPath === '/admin/transaksi'} onClick={() => handleNav('/admin/transaksi')} />

                {isFullAdmin && (
                    <>
                        <NavButton to="/admin/inventaris" icon="inventory_2" label="Inventaris" isActive={currentPath === '/admin/inventaris'} onClick={() => handleNav('/admin/inventaris')} />
                        <NavButton to="/admin/profit" icon="trending_up" label="Profit Produk" isActive={currentPath === '/admin/profit'} onClick={() => handleNav('/admin/profit')} />
                        <NavButton to="/admin/anggota" icon="group" label="Master Anggota" isActive={currentPath === '/admin/anggota'} onClick={() => handleNav('/admin/anggota')} />
                        <NavButton to="/admin/master-data" icon="manage_accounts" label="Master Admin" isActive={currentPath === '/admin/master-data'} onClick={() => handleNav('/admin/master-data')} />
                    </>
                )}

                <NavButton to="/admin/profil" icon="person" label="Profil" isActive={currentPath === '/admin/profil'} onClick={() => handleNav('/admin/profil')} />

                <div className="nav-bottom">
                    <button onClick={handleLogout} className="nav-item nav-logout" type="button">
                        <span className="material-symbols-outlined">logout</span>
                        <span>Keluar</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
