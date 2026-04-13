import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import { logout, fetchMe } from '../features/auth/authSlice';
import { addNotification } from '../features/ui/uiSlice';
import axiosInstance from '../api/axiosInstance';
import './MemberProfile.css';

const MemberProfile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const fileInputRef = useRef(null);

    const [phoneModalOpen, setPhoneModalOpen] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    
    const [pwdModalOpen, setPwdModalOpen] = useState(false);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');

    useEffect(() => {
        dispatch(fetchMe());
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                await axiosInstance.post('/api/auth/update-profile', { photo_base64: reader.result });
                dispatch(fetchMe());
                dispatch(addNotification({ message: 'Foto berhasil diperbarui!', type: 'success' }));
            } catch(err) {
                dispatch(addNotification({ message: 'Gagal update foto: ' + (err.response?.data?.error || err.message), type: 'error' }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleToggleStatus = async () => {
        try {
            const nextStatus = !isActive;
            await axiosInstance.post('/api/auth/update-profile', { is_active: nextStatus });
            dispatch(fetchMe());
            dispatch(addNotification({ message: `Status berhasil diubah menjadi ${nextStatus ? 'AKTIF' : 'NON-AKTIF'}`, type: 'success' }));
        } catch(err) {
            dispatch(addNotification({ message: 'Gagal ubah status: ' + (err.response?.data?.error || err.message), type: 'error' }));
        }
    };

    const handleUpdatePhone = async () => {
        if (!newPhone.trim()) return dispatch(addNotification({ message: 'Nomor HP tidak boleh kosong', type: 'error' }));
        try {
            await axiosInstance.post('/api/auth/update-profile', { no_handphone: newPhone.trim() });
            dispatch(fetchMe());
            setPhoneModalOpen(false);
            setNewPhone('');
            dispatch(addNotification({ message: 'Nomor HP berhasil diperbarui!', type: 'success' }));
        } catch(err) {
            dispatch(addNotification({ message: 'Gagal update nomor HP: ' + (err.response?.data?.error || err.message), type: 'error' }));
        }
    };

    const handleChangePwd = async () => {
        if (!oldPwd || !newPwd) return dispatch(addNotification({ message: 'Semua kolom wajib diisi', type: 'error' }));
        if (newPwd.length < 6) return dispatch(addNotification({ message: 'Password baru minimal 6 karakter', type: 'error' }));
        try {
            await axiosInstance.post('/api/auth/change-password', { old_password: oldPwd, new_password: newPwd });
            setPwdModalOpen(false);
            setOldPwd('');
            setNewPwd('');
            dispatch(addNotification({ message: 'Password berhasil diubah!', type: 'success' }));
        } catch(err) {
            dispatch(addNotification({ message: err.response?.data?.error || 'Gagal mengubah password', type: 'error' }));
        }
    };

    const fRupiah = (num) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(num || 0);

    const qrData = JSON.stringify({
        no_anggota: user?.no_anggota || 'N/A',
        no_handphone: user?.no_handphone || '',
        nama: user?.name || user?.username || 'Member',
        unit: user?.unit || 'N/A',
    });

    const isActive = user?.is_active === true || user?.is_active === 1 || user?.is_active === 'true';

    return (
        <div className="member-profile-page">
            <main className="profile-container">
                <div className="profile-card">
                    <div className="card-accent" />
                    
                    <div className="card-content">
                        {/* Foto Profil — klik untuk ubah */}
                        <div className="profile-photo-wrapper" onClick={handlePhotoClick} title="Klik untuk ubah foto">
                            <img 
                                alt="Foto Profil"
                                className="profile-photo"
                                src={user?.photo_base64 || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                            />
                            <div className="photo-overlay">
                                <span className="material-symbols-outlined">edit</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handlePhotoChange}
                            />
                        </div>

                        {/* Identitas + Status + Poin */}
                        <div className="identity-section">
                            {isActive ? (
                                <div className="active-badge" onClick={handleToggleStatus} style={{ cursor: 'pointer' }} title="Klik untuk non-aktifkan">
                                    <span className="active-dot" /> STATUS: AKTIF
                                </div>
                            ) : (
                                <div className="inactive-badge" onClick={handleToggleStatus} style={{ cursor: 'pointer' }} title="Klik untuk aktifkan">
                                    <span className="inactive-dot" /> STATUS: TIDAK AKTIF
                                </div>
                            )}
                            <span className="identity-label">Nama Lengkap</span>
                            <h1 className="identity-name">{user?.name || user?.username || 'Unknown Member'}</h1>
                            <div className="points-display">
                                Poin: {fRupiah(user?.points || 0)}
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="qr-section">
                            <div className="qr-wrapper">
                                <QRCodeSVG
                                    value={qrData}
                                    size={160}
                                    bgColor="#ffffff"
                                    fgColor="#6d5a00"
                                    level="H"
                                />
                            </div>
                            <p className="qr-label">Scan QR ini di kasir</p>
                        </div>

                        {/* Detail Akun */}
                        <div className="account-info-grid">
                            <div className="info-group">
                                <label className="info-label">ID Anggota</label>
                                <span className="info-value">{user?.no_anggota || 'N/A'}</span>
                            </div>
                            <div className="info-group border-top">
                                <label className="info-label">Unit</label>
                                <span className="info-value">{user?.unit || 'N/A'}</span>
                            </div>
                            <div className="info-group-row border-top">
                                <label className="info-label">No. Handphone</label>
                                <div className="info-row-inner">
                                    <span className="info-value">{user?.no_handphone || '-'}</span>
                                    <button className="btn-inline-edit" onClick={() => { setNewPhone(user?.no_handphone || ''); setPhoneModalOpen(true); }}>
                                        Ubah
                                    </button>
                                </div>
                            </div>
                            <div className="info-group border-top">
                                <label className="info-label">No. Rekening</label>
                                <span className="info-value">{user?.no_rekening || 'N/A'}</span>
                            </div>
                            <div className="info-group border-top">
                                <button className="btn-change-password" onClick={() => setPwdModalOpen(true)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>lock_reset</span>
                                    Ubah Password Akun
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer">
                        <span className="footer-brand">ESDM Kasir · Secure ID</span>
                    </div>
                </div>

                <button className="logout-button" onClick={handleLogout}>
                    <span className="material-symbols-outlined icon-bold">logout</span>
                    KELUAR
                </button>
            </main>

            {/* Modal: Ubah No. HP */}
            {phoneModalOpen && (
                <div className="mp-modal-overlay" onClick={() => setPhoneModalOpen(false)}>
                    <div className="mp-modal-box" onClick={e => e.stopPropagation()}>
                        <h2>Ubah No. Handphone</h2>
                        <input
                            className="mp-input"
                            type="tel"
                            placeholder="Contoh: 08123456789"
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdatePhone()}
                            autoFocus
                        />
                        <div className="mp-modal-actions">
                            <button className="mp-btn-cancel" onClick={() => setPhoneModalOpen(false)}>Batal</button>
                            <button className="mp-btn-save" onClick={handleUpdatePhone}>Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Ubah Password */}
            {pwdModalOpen && (
                <div className="mp-modal-overlay" onClick={() => setPwdModalOpen(false)}>
                    <div className="mp-modal-box" onClick={e => e.stopPropagation()}>
                        <h2>Ubah Password</h2>
                        <input
                            className="mp-input"
                            type="password"
                            placeholder="Password Lama"
                            value={oldPwd}
                            onChange={e => setOldPwd(e.target.value)}
                            autoFocus
                        />
                        <input
                            className="mp-input"
                            type="password"
                            placeholder="Password Baru (min. 6 karakter)"
                            value={newPwd}
                            onChange={e => setNewPwd(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleChangePwd()}
                        />
                        <div className="mp-modal-actions">
                            <button className="mp-btn-cancel" onClick={() => setPwdModalOpen(false)}>Batal</button>
                            <button className="mp-btn-save" onClick={handleChangePwd}>Simpan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberProfile;
