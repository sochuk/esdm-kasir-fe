import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import '../styles/AdminLayout.css';

const AdminLayout = () => {
    return (
        <>
            {/* Sidebar is a fully independent fixed/floating element */}
            <AdminSidebar />
            {/* Content area is completely separate, only uses margin-left */}
            <main className="admin-main">
                <Outlet />
            </main>
        </>
    );
};

export default AdminLayout;
