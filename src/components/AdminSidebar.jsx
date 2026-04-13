import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import './AdminSidebar.css';

const AdminSidebar = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = (e) => {
        e.preventDefault();
        dispatch(logout());
    };

    return (
        <aside className="global-sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-brand">ESDM Kasir</h1>
            </div>

            <div className="sidebar-profile">
                <img 
                    alt="Admin Profile" 
                    className="sidebar-avatar" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0u-623jGvUqOD4V0fk4N5FP7ZXmxofIxyy71wpZn1QgxzHr51-0WNi-0AfmhX1dovW7ofzJUPP-0fySRLx3t70hjUNcFS2tth__1kGVsttflnbkDJMC0iwDpbNXvDeIkiglGCniA307fNwCdbxavvQ0adImVWS3hPCHK2el3rTOza-KVvzbgcxRB1HQZfqCWC-RVNrF4ZK0dPGa9or31sdkSG6AWnootUrBfGjAMcYfgaegOF2TDeMN7KfDsYK0-8uh2x0IO2Bw"
                />
                <div className="sidebar-identity">
                    <p className="sidebar-name">{user?.name || user?.username || 'Administrator'}</p>
                    <p className="sidebar-role">ADM-{user?.username || 'SYSTEM'}</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink 
                    to="/admin/dashboard" 
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
                >
                    <span className="material-symbols-outlined">dashboard</span>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink 
                    to="/admin/transaksi" 
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
                >
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span>Riwayat Transaksi</span>
                </NavLink>

                <NavLink 
                    to="/admin/inventaris" 
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
                >
                    <span className="material-symbols-outlined">inventory_2</span>
                    <span>Inventaris</span>
                </NavLink>

                <NavLink 
                    to="/admin/profil" 
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
                >
                    <span className="material-symbols-outlined">person</span>
                    <span>Profil</span>
                </NavLink>

                <div className="nav-bottom">
                    <button onClick={handleLogout} className="nav-item nav-logout">
                        <span className="material-symbols-outlined">logout</span>
                        <span>Keluar</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
