import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../features/ui/uiSlice';
import DataTable from '../components/DataTable';
import axiosInstance from '../api/axiosInstance';
import './AdminInventaris.css';

const ROLES = [
    { value: 'admin', label: 'Admin (Akses Penuh)' },
    { value: 'super_admin', label: 'Super Admin (Semi Fitur)' },
    { value: 'kasir', label: 'Admin Kasir (Dashboard & Riwayat)' },
];

const defaultForm = { nama: '', username: '', password: '', type_user: 'kasir', unit: '', email: '', no_telpon: '', is_active: true };

const AdminMasterData = () => {
    const dispatch = useDispatch();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => { fetchAdmins(); }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/admin');
            setAdmins(res.data);
        } catch (err) {
            dispatch(addNotification({ message: 'Gagal mengambil data admin', type: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (admin = null) => {
        if (admin) {
            setEditMode(true);
            setEditId(admin.id);
            setFormData({ nama: admin.nama || '', username: admin.username || '', password: '', type_user: admin.type_user, unit: admin.unit || '', email: admin.email || '', no_telpon: admin.no_telpon || '', is_active: admin.is_active });
        } else {
            setEditMode(false);
            setEditId(null);
            setFormData(defaultForm);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.nama || !formData.username || (!editMode && !formData.password)) {
            dispatch(addNotification({ message: 'Nama, username, dan password wajib diisi', type: 'error' }));
            return;
        }
        try {
            if (editMode) {
                await axiosInstance.put(`/api/admin/${editId}`, formData);
                dispatch(addNotification({ message: 'Admin berhasil diupdate', type: 'success' }));
            } else {
                await axiosInstance.post('/api/admin', formData);
                dispatch(addNotification({ message: 'Admin berhasil ditambahkan', type: 'success' }));
            }
            setIsModalOpen(false);
            fetchAdmins();
        } catch (err) {
            dispatch(addNotification({ message: err.response?.data?.error || 'Gagal menyimpan', type: 'error' }));
        }
    };

    const handleToggleActive = async () => {
        if (!deleteTarget) return;
        const newStatus = !deleteTarget.is_active;
        try {
            await axiosInstance.put(`/api/admin/${deleteTarget.id}`, {
                nama: deleteTarget.nama,
                unit: deleteTarget.unit || '',
                email: deleteTarget.email || '',
                no_telpon: deleteTarget.no_telpon || '',
                type_user: deleteTarget.type_user,
                is_active: newStatus
            });
            dispatch(addNotification({ message: newStatus ? 'Admin berhasil diaktifkan' : 'Admin berhasil dinonaktifkan', type: 'success' }));
            setDeleteTarget(null);
            fetchAdmins();
        } catch {
            dispatch(addNotification({ message: 'Gagal mengubah status admin', type: 'error' }));
        }
    };

    const fRole = (role) => ROLES.find(r => r.value === role)?.label || role;
    const fRoleBadge = (role) => {
        const colors = { admin: ['#fef3c7', '#d97706'], super_admin: ['#ede9fe', '#7c3aed'], kasir: ['#dbeafe', '#2563eb'] };
        const [bg, color] = colors[role] || ['#f3f4f6', '#374151'];
        return <span style={{ background: bg, color, padding: '0.2rem 0.6rem', borderRadius: '2rem', fontWeight: 800, fontSize: '0.7rem', border: `1px solid ${color}30` }}>{fRole(role)}</span>;
    };

    const columns = [
        { header: 'Nama Lengkap', accessor: 'nama', render: (a) => <><div className="font-bold" style={{ fontSize: '0.9rem' }}>{a.nama}</div><div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{a.unit || '-'}</div></> },
        { header: 'Username', accessor: 'username', render: (a) => <code style={{ background: '#f3f4f6', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>{a.username}</code> },
        { header: 'Role', accessor: 'type_user', render: (a) => fRoleBadge(a.type_user) },
        { header: 'Kontak', accessor: 'email', render: (a) => <><div style={{ fontSize: '0.8rem' }}>{a.email || '-'}</div><div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{a.no_telpon || '-'}</div></> },
        { header: 'Status', accessor: 'is_active', render: (a) => (
            <button
                onClick={() => setDeleteTarget(a)}
                style={{
                    background: a.is_active ? '#dcfce7' : '#fee2e2',
                    color: a.is_active ? '#16a34a' : '#dc2626',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '2rem',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    border: `1.5px solid ${a.is_active ? '#bbf7d0' : '#fecaca'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                }}
                title={a.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>{a.is_active ? 'check_circle' : 'cancel'}</span>
                {a.is_active ? 'Aktif' : 'Nonaktif'}
            </button>
        )},
        {
            header: 'Aksi', accessor: 'actions', cellClassName: 'text-center', className: 'text-center',
            render: (a) => (
                <div className="action-flex">
                    <button className="material-symbols-outlined icon-btn hover-primary" onClick={() => handleOpen(a)}>edit</button>
                </div>
            )
        }
    ];

    return (
        <>
            <div className="inventory-container">
                    <div className="inventory-header">
                        <div>
                            <h1 className="inventory-title">Master Data Admin</h1>
                            <p className="inventory-subtitle">Kelola akun admin, super admin, dan kasir</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={() => handleOpen()}>
                                <span className="material-symbols-outlined">person_add</span> Tambah Admin
                            </button>
                        </div>
                    </div>

                    <DataTable data={admins} columns={columns} searchable searchKeys={['nama', 'username', 'unit']} searchPlaceholder="Cari nama atau username..." loading={loading} emptyMessage="Belum ada admin terdaftar." itemsPerPage={10} rowClassName={() => 'row-normal'} />
                </div>

        {/* Modal Form */}
        {isModalOpen && (
            <div className="modal-overlay z-modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <div>
                            <h3 className="modal-title">{editMode ? 'Edit Admin' : 'Tambah Admin Baru'}</h3>
                            <p className="modal-subtitle">Atur akses dan identitas akun</p>
                        </div>
                        <button className="modal-close" onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nama Lengkap *</label>
                                <input type="text" className="form-input" placeholder="Nama Admin" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <input type="text" className="form-input" placeholder="Username login" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Password {editMode ? '(kosongkan jika tidak diubah)' : '*'}</label>
                                <input type="password" className="form-input" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Role / Hak Akses</label>
                                <select className="form-input" value={formData.type_user} onChange={e => setFormData({...formData, type_user: e.target.value})}>
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Unit / Bagian</label>
                                <input type="text" className="form-input" placeholder="Contoh: Kasir 1" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="form-input" placeholder="email@kesdm.go.id" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>No. Telepon</label>
                                <input type="text" className="form-input" placeholder="08xx-xxxx-xxxx" value={formData.no_telpon} onChange={e => setFormData({...formData, no_telpon: e.target.value})} />
                            </div>
                            {editMode && (
                                <div className="form-group">
                                    <label>Status Akun</label>
                                    <select className="form-input" value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}>
                                        <option value="true">Aktif</option>
                                        <option value="false">Nonaktif</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Batal</button>
                            <button className="btn-save" onClick={handleSave}><span className="material-symbols-outlined">save</span> {editMode ? 'Simpan Perubahan' : 'Tambahkan'}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {deleteTarget && (
            <div className="modal-overlay z-modal">
                <div className="confirm-modal">
                    <div className="confirm-icon-wrapper" style={{ background: deleteTarget.is_active ? '#fee2e2' : '#dcfce7' }}>
                        <span className="material-symbols-outlined confirm-icon" style={{ color: deleteTarget.is_active ? '#dc2626' : '#16a34a' }}>
                            {deleteTarget.is_active ? 'person_off' : 'person_add'}
                        </span>
                    </div>
                    <h3 className="confirm-title" style={{ color: 'var(--color-on-surface)' }}>
                        {deleteTarget.is_active ? 'Nonaktifkan Admin?' : 'Aktifkan Admin?'}
                    </h3>
                    <p className="confirm-desc" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Admin <strong>"{deleteTarget.nama}"</strong> akan {deleteTarget.is_active ? 'dinonaktifkan dan tidak bisa login.' : 'diaktifkan kembali dan bisa login.'}
                    </p>
                    <div className="confirm-actions">
                        <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Batal</button>
                        {deleteTarget.is_active ? (
                            <button className="btn-danger" onClick={handleToggleActive} style={{ background: 'var(--color-error)' }}>
                                <span className="material-symbols-outlined" style={{ color: 'white' }}>person_off</span> Nonaktifkan
                            </button>
                        ) : (
                            <button className="btn-save" onClick={handleToggleActive} style={{ background: '#16a34a' }}>
                                <span className="material-symbols-outlined" style={{ color: 'white' }}>person_add</span> Aktifkan
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

export default AdminMasterData;
