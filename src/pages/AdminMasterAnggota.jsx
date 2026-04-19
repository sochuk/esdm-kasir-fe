import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../features/ui/uiSlice';
import DataTable from '../components/DataTable';
import axiosInstance from '../api/axiosInstance';
import './AdminInventaris.css';

const defaultForm = { nama: '', username: '', password: '', unit: '', no_anggota: '', no_rekening: '', no_telpon: '', email: '' };

const AdminMasterAnggota = () => {
    const dispatch = useDispatch();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/member');
            setMembers(res.data);
        } catch {
            dispatch(addNotification({ message: 'Gagal mengambil data anggota', type: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (member = null) => {
        if (member) {
            setEditMode(true);
            setEditId(member.id);
            setFormData({ nama: member.nama || '', username: member.username || '', password: '', unit: member.unit || '', no_anggota: member.no_anggota || '', no_rekening: member.no_rekening || '', no_telpon: member.no_telpon || member.no_handphone || '', email: member.email || '' });
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
                await axiosInstance.put(`/api/member/${editId}`, formData);
                dispatch(addNotification({ message: 'Anggota berhasil diupdate', type: 'success' }));
            } else {
                await axiosInstance.post('/api/member', formData);
                dispatch(addNotification({ message: 'Anggota berhasil ditambahkan', type: 'success' }));
            }
            setIsModalOpen(false);
            fetchMembers();
        } catch (err) {
            dispatch(addNotification({ message: err.response?.data?.error || 'Gagal menyimpan', type: 'error' }));
        }
    };

    const handleToggleActive = async () => {
        if (!deleteTarget) return;
        const newStatus = !deleteTarget.is_active;
        try {
            await axiosInstance.put(`/api/member/${deleteTarget.id}`, {
                nama: deleteTarget.nama,
                unit: deleteTarget.unit || '',
                no_anggota: deleteTarget.no_anggota || '',
                no_rekening: deleteTarget.no_rekening || '',
                no_telpon: deleteTarget.no_telpon || deleteTarget.no_handphone || '',
                email: deleteTarget.email || '',
                is_active: newStatus
            });
            dispatch(addNotification({ message: newStatus ? 'Anggota berhasil diaktifkan' : 'Anggota berhasil dinonaktifkan', type: 'success' }));
            setDeleteTarget(null);
            fetchMembers();
        } catch {
            dispatch(addNotification({ message: 'Gagal mengubah status anggota', type: 'error' }));
        }
    };

    const fRupiah = num => new Intl.NumberFormat('id-ID').format(num || 0);
    const columns = [
        { header: 'Anggota', accessor: 'nama', render: (m) => <><div className="font-bold" style={{ fontSize: '0.9rem' }}>{m.nama}</div><div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{m.unit || '-'}</div></> },
        { header: 'No. Anggota', accessor: 'no_anggota', render: (m) => <code style={{ background: '#f3f4f6', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 700 }}>{m.no_anggota || '-'}</code> },
        { header: 'Kontak', accessor: 'no_telpon', render: (m) => <><div style={{ fontSize: '0.8rem' }}>{m.no_telpon || m.no_handphone || '-'}</div><div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{m.email || '-'}</div></> },
        { header: 'Poin', accessor: 'points', render: (m) => <span style={{ fontWeight: 800, color: '#d97706' }}>{fRupiah(m.points)} pts</span> },
        { header: 'Status', accessor: 'is_active', render: (m) => (
            <button
                onClick={() => setDeleteTarget(m)}
                style={{
                    background: m.is_active ? '#dcfce7' : '#fee2e2',
                    color: m.is_active ? '#16a34a' : '#dc2626',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '2rem',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    border: `1.5px solid ${m.is_active ? '#bbf7d0' : '#fecaca'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                }}
                title={m.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>{m.is_active ? 'check_circle' : 'cancel'}</span>
                {m.is_active ? 'Aktif' : 'Nonaktif'}
            </button>
        )},
        {
            header: 'Aksi', accessor: 'actions', cellClassName: 'text-center', className: 'text-center',
            render: (m) => (
                <div className="action-flex">
                    <button className="material-symbols-outlined icon-btn hover-primary" onClick={() => handleOpen(m)}>edit</button>
                </div>
            )
        }
    ];

    return (
        <>
            <div className="inventory-container">
                    <div className="inventory-header">
                        <div>
                            <h1 className="inventory-title">Master Data Anggota</h1>
                            <p className="inventory-subtitle">Manajemen data anggota koperasi — {members.length} anggota terdaftar</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={() => handleOpen()}>
                                <span className="material-symbols-outlined">person_add</span> Tambah Anggota
                            </button>
                        </div>
                    </div>

                    <DataTable data={members} columns={columns} searchable searchKeys={['nama', 'no_anggota', 'unit', 'email', 'no_telpon']} searchPlaceholder="Cari nama, no. anggota, atau unit..." loading={loading} emptyMessage="Belum ada anggota terdaftar." itemsPerPage={15} rowClassName={() => 'row-normal'} />
                </div>
        
        {isModalOpen && (
            <div className="modal-overlay z-modal">
                <div className="modal-content" style={{ maxWidth: '560px' }}>
                    <div className="modal-header">
                        <div>
                            <h3 className="modal-title">{editMode ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h3>
                            <p className="modal-subtitle">Data lengkap anggota koperasi</p>
                        </div>
                        <button className="modal-close" onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nama Lengkap *</label>
                                <input type="text" className="form-input" placeholder="Nama anggota" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Username Login *</label>
                                <input type="text" className="form-input" placeholder="Username untuk login" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Password {editMode ? '(kosongkan jika tidak diubah)' : '*'}</label>
                                <input type="password" className="form-input" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>No. Anggota</label>
                                <input type="number" className="form-input" placeholder="Nomor anggota" value={formData.no_anggota} onChange={e => setFormData({...formData, no_anggota: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Unit / Bagian</label>
                                <input type="text" className="form-input" placeholder="Contoh: Biro Umum" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>No. Rekening</label>
                                <input type="text" className="form-input" placeholder="No. rekening simpanan" value={formData.no_rekening} onChange={e => setFormData({...formData, no_rekening: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>No. Telepon / HP</label>
                                <input type="text" className="form-input" placeholder="08xx-xxxx-xxxx" value={formData.no_telpon} onChange={e => setFormData({...formData, no_telpon: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="form-input" placeholder="email@kesdm.go.id" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Batal</button>
                            <button className="btn-save" onClick={handleSave}><span className="material-symbols-outlined">save</span> {editMode ? 'Simpan Perubahan' : 'Daftarkan Anggota'}</button>
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
                        {deleteTarget.is_active ? 'Nonaktifkan Anggota?' : 'Aktifkan Anggota?'}
                    </h3>
                    <p className="confirm-desc" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Anggota <strong>"{deleteTarget.nama}"</strong> akan {deleteTarget.is_active ? 'dinonaktifkan. Anggota tidak bisa login.' : 'diaktifkan kembali. Anggota bisa login.'}
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

export default AdminMasterAnggota;
