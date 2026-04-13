import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../features/inventory/inventorySlice';
import { addNotification } from '../features/ui/uiSlice';
import AdminSidebar from '../components/AdminSidebar';
import ScanModal from '../components/ScanModal';
import ReceiptModal from '../components/ReceiptModal';
import axiosInstance from '../api/axiosInstance';
import './AdminDashboard.css';
import './AdminInventaris.css';

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { items: inventory, status } = useSelector((state) => state.inventory);
    
    // POS State
    const [cart, setCart] = useState([]);
    const [member, setMember] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [searchQuery, setSearchQuery] = useState('');
    const [manualLookupText, setManualLookupText] = useState('');
    const [isFetchingMember, setIsFetchingMember] = useState(false);
    const [scanModalOpen, setScanModalOpen] = useState(false);
    
    // Receipt State
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [currentTxId, setCurrentTxId] = useState(null);

    // Checkout Confirmation Modal
    const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        if (status === 'idle') dispatch(fetchProducts());
    }, [status, dispatch]);

    // Financial calculations
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = 0; // Pajak 0% dulu
    const maxPointsValue = member ? member.points : 0; // 1 point = Rp 1 (atau sudah dalam bentuk rupiah flat)
    const applicableDiscount = (member && usePoints) ? Math.min(maxPointsValue, subtotal + tax) : 0;
    const total = subtotal + tax - applicableDiscount;
    const pointsEarned = member ? 100 : 0; // Flat Rp 100 points setiap transaksi
    const pointsUsed = applicableDiscount;

    // Formatter
    const fRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    // Dynamic item manual search
    const filteredProducts = inventory.filter(p => p.stock > 0 && 
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Handlers
    const addToCart = useCallback((product) => {
        if (Number(product.stock) <= 0) {
            dispatch(addNotification({ message: `Stok habis untuk ${product.name}`, type: 'error' }));
            return;
        }

        setCart(prev => {
            const existingIndex = prev.findIndex(i => i.product_id === product.id);
            if (existingIndex >= 0) {
                const existing = prev[existingIndex];
                if (existing.qty + 1 > product.stock) {
                    dispatch(addNotification({ message: `Gagal menambah: Stok maksimal ${product.name} adalah ${product.stock}`, type: 'error' }));
                    return prev;
                }
                const newCart = [...prev];
                newCart[existingIndex] = { ...existing, qty: existing.qty + 1 };
                return newCart;
            }
            return [...prev, { 
                product_id: product.id, 
                sku: product.sku, 
                name: product.name, 
                price: Number(product.price), 
                qty: 1, 
                stock: Number(product.stock) 
            }];
        });
    }, []);

    const updateQty = (productId, delta) => {
        setCart(prev => {
            const newCart = prev.map(item => {
                if(item.product_id === productId) {
                    const newQty = item.qty + delta;
                    if(newQty > item.stock) {
                         dispatch(addNotification({ message: 'Stok maksimum tercapai', type: 'error' }));
                         return item;
                    }
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter(item => item.qty > 0);
            return newCart;
        });
    };



    const fetchMember = useCallback(async (qrDataText) => {
        if (!qrDataText.trim()) {
            dispatch(addNotification({ message: 'ID Member atau No HP tidak boleh kosong', type: 'error' }));
            return;
        }
        setIsFetchingMember(true);
        try {
            const response = await axiosInstance.get(`/api/pos/member/lookup?qr=${encodeURIComponent(qrDataText)}`);
            setMember(response.data);
            setUsePoints(false);
            dispatch(addNotification({ message: `✅ Member ditemukan: ${response.data.nama}`, type: 'success' }));
        } catch (err) {
            console.error(err);
            dispatch(addNotification({ message: `❌ Member tidak ditemukan: ${qrDataText}`, type: 'error' }));
        } finally {
            setIsFetchingMember(false);
        }
    }, [dispatch]);

    // Handler untuk ScanModal — returns result object untuk ditampilkan di dalam modal
    const handleModalScan = useCallback(async (scannedText) => {
        const trimmed = scannedText.trim();
        if (!trimmed) return { type: 'error', message: 'Input kosong' };

        // 1. Coba parse JSON (QR Code anggota dari halaman Profil Member)
        try {
            const parsed = JSON.parse(trimmed);
            // Ambil identifier: no_anggota atau no_handphone
            const lookupId = parsed.no_anggota ? String(parsed.no_anggota) : (parsed.no_handphone || null);
            if (lookupId) {
                try {
                    const res = await axiosInstance.get(`/api/pos/member/lookup?qr=${encodeURIComponent(lookupId)}`);
                    setMember(res.data);
                    setUsePoints(false);
                    return { type: 'member', message: `✅ Member: ${res.data.nama}` };
                } catch {
                    return { type: 'error', message: '❌ Member tidak ditemukan di database' };
                }
            }
        } catch { /* bukan JSON, lanjut */ }

        // 2. Cari sebagai SKU produk
        const found = inventory.find(p => p.sku === trimmed);
        if (found) {
            addToCart(found);
            return { type: 'product', message: `✅ Ditambahkan: ${found.name} (${found.sku})` };
        }

        // 3. Coba lookup anggota langsung (no_anggota / no_handphone / username)
        try {
            const res = await axiosInstance.get(`/api/pos/member/lookup?qr=${encodeURIComponent(trimmed)}`);
            setMember(res.data);
            setUsePoints(false);
            return { type: 'member', message: `✅ Member: ${res.data.nama}` };
        } catch { /* bukan member */ }

        return { type: 'error', message: `❌ SKU / ID tidak dikenali: ${trimmed}` };
    }, [inventory, addToCart]);

    const handleCheckoutClick = () => {
        if (cart.length === 0) {
            dispatch(addNotification({ message: 'Keranjang masih kosong', type: 'error' }));
            return;
        }
        setCheckoutConfirmOpen(true);
    };

    const processCheckout = async () => {
        setIsCheckingOut(true);

        const payload = {
            items: cart.map(i => ({ id: i.product_id, sku: i.sku, name: i.name, qty: i.qty, price: i.price })),
            member_id: member ? member.id : null,
            payment_method: paymentMethod,
            subtotal, 
            discount: applicableDiscount, 
            tax, 
            total, 
            points_earned: pointsEarned, 
            points_used: pointsUsed
        };

        try {
            const res = await axiosInstance.post('/api/pos/checkout', payload);
            
            // Show Receipt Modal
            setCurrentTxId(res.data.transaction_id);
            setReceiptModalOpen(true);
            setCheckoutConfirmOpen(false);
            
            // Reset state
            setCart([]);
            setMember(null);
            setUsePoints(false);
            setPaymentMethod('cash');
            dispatch(fetchProducts()); // Refresh stock after purchase
        } catch (err) {
            console.error('Checkout failed', err);
            dispatch(addNotification({ message: 'Gagal memproses pembayaran: ' + (err.response?.data?.message || err.response?.data?.error || err.message), type: 'error' }));
        } finally {
            setIsCheckingOut(false);
        }
    };

    // Keyboard & Scanner Global Listener
    useEffect(() => {
        let buffer = '';
        let timeoutId = null;

        const handleKeyDown = (e) => {
            // Abaikan input jika user sedang mengetik di form (search box / manual lookup)
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                clearTimeout(timeoutId);
                if (buffer.length > 0) {
                    const scannedText = buffer.trim();
                    buffer = '';

                    // 1. Cek apakah ini JSON string dari QR Code Member
                    try {
                        const parsed = JSON.parse(scannedText);
                        if (parsed && parsed.no_anggota) {
                            dispatch(addNotification({ message: `🔍 Mencari anggota No. ${parsed.no_anggota}...`, type: 'info' }));
                            fetchMember(String(parsed.no_anggota));
                            return;
                        }
                    } catch(err) { /* Bukan JSON, lanjut cek SKU produk */ }

                    // 2. Cari sebagai SKU Produk
                    const foundProd = inventory.find(p => p.sku === scannedText);
                    if (foundProd) {
                        addToCart(foundProd);
                        dispatch(addNotification({ message: `✅ Ditambahkan: ${foundProd.name}`, type: 'success' }));
                    } else if (!isNaN(Number(scannedText)) || scannedText.startsWith('MEM')) {
                        // 3. Angka murni atau prefix MEM → lookup anggota
                        dispatch(addNotification({ message: `🔍 Mencari anggota ID: ${scannedText}...`, type: 'info' }));
                        fetchMember(scannedText);
                    } else {
                        dispatch(addNotification({ message: `⚠️ SKU/ID tidak dikenali: ${scannedText}`, type: 'error' }));
                    }
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
                // Reset timeout: buffer dibersihkan jika tidak ada input selama 100ms
                // (Scanner fisik mengirim semua karakter dalam <50ms; manusia umumnya >150ms per karakter)
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => { buffer = ''; }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timeoutId);
        };
    }, [inventory, addToCart, fetchMember, dispatch]);

    return (
        <div className="admin-layout">
            <AdminSidebar />



            {/* Scan Popup Modal */}
            <ScanModal
                isOpen={scanModalOpen}
                onClose={() => setScanModalOpen(false)}
                onScan={handleModalScan}
            />

            {/* Receipt Modal */}
            <ReceiptModal 
                transactionId={currentTxId} 
                isOpen={receiptModalOpen} 
                onClose={() => setReceiptModalOpen(false)} 
            />

            {/* Checkout Confirm Modal */}
            {checkoutConfirmOpen && (
                <div className="modal-overlay z-modal" onClick={() => !isCheckingOut && setCheckoutConfirmOpen(false)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="confirm-icon-wrapper" style={{ backgroundColor: 'rgba(253, 212, 0, 0.2)' }}>
                            <span className="material-symbols-outlined confirm-icon" style={{ color: 'var(--color-primary)' }}>point_of_sale</span>
                        </div>
                        <h3 className="confirm-title">Selesaikan Transaksi?</h3>
                        <p className="confirm-desc">
                            Total pembayaran: <strong>{fRupiah(total)}</strong>. Data point dan stok akan otomatis diperbarui.
                        </p>
                        <div className="confirm-actions">
                            <button className="btn-cancel" onClick={() => setCheckoutConfirmOpen(false)} disabled={isCheckingOut}>
                                Batal
                            </button>
                            <button className="btn-save" onClick={processCheckout} disabled={isCheckingOut}>
                                {isCheckingOut ? 'Memproses...' : 'Proses & Cetak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <main className="admin-main">
                <div className="dashboard-grid">
                    {/* Left Section: Transaction Flow */}
                    <div className="transaction-flow">
                        {/* Search Bar for manual product input */}
                        <div className="search-container" style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined search-icon">search</span>
                            <input 
                                className="search-input" 
                                placeholder="Ketik Cari SKU atau Nama Produk untuk tambah manual..." 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <div className="manual-search-results">
                                    {filteredProducts.slice(0, 5).map(prod => (
                                        <div key={prod.id} className="search-result-item" onClick={() => {addToCart(prod); setSearchQuery('');}}>
                                            <div className="search-result-img-wrapper">
                                                {prod.image_url ? (
                                                    <img src={prod.image_url} alt="" className="search-result-img" />
                                                ) : (
                                                    <div className="search-result-fallback">
                                                        <span className="material-symbols-outlined">inventory_2</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="search-result-info">
                                                <span className="font-bold">{prod.name}</span>
                                                <span className="search-result-sub">{prod.sku} - {fRupiah(prod.price)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && <div className="p-2 text-sm">Produk tidak ada (stok kosong / salah nama)</div>}
                                </div>
                            )}
                        </div>

                        {/* Scanner Trigger Button */}
                        <section className="scan-area scan-area--clickable" onClick={() => setScanModalOpen(true)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setScanModalOpen(true)}>
                            <div>
                                <h2 className="scan-title">Scanner Ready</h2>
                                <p className="scan-subtitle">Klik untuk membuka mode scan, atau sorot barcode/QR langsung ke halaman ini.</p>
                            </div>
                            <div className="scan-icon-wrapper scan-btn-launch">
                                <span className="material-symbols-outlined scan-icon-pulse">barcode_scanner</span>
                                <span className="scan-launch-label">Buka</span>
                            </div>
                        </section>

                        {/* Active Cart List */}
                        <section className="active-cart">
                            <div className="cart-header">
                                <h2 className="cart-title">Keranjang Belanja</h2>
                                <span className="cart-badge">{cart.reduce((a,c)=>a+c.qty,0)} Items Terpilih</span>
                            </div>

                            <div className="cart-table-container">
                                <div className="cart-table-header">
                                    <div className="col-product">Produk / SKU</div>
                                    <div className="col-qty text-center">Qty</div>
                                    <div className="col-price text-right">Subtotal</div>
                                </div>

                                <div className="cart-item-list">
                                    {cart.length === 0 ? (
                                        <div className="empty-cart-msg">Keranjang masih kosong. Mulai scan produk.</div>
                                    ) : cart.map((item, idx) => (
                                        <div key={item.product_id} className={`cart-item ${idx % 2 !== 0 ? 'bg-dim' : ''}`}>
                                            <div className="col-product flex-row" style={{ gap: '0.75rem' }}>
                                                <div className="cart-item-img-wrapper">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" className="cart-item-img" />
                                                    ) : (
                                                        <div className="cart-item-fallback">
                                                            <span className="material-symbols-outlined">inventory_2</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="item-name">{item.name}</p>
                                                    <p className="item-sku">{item.sku}</p>
                                                </div>
                                            </div>
                                            <div className="col-qty item-actions">
                                                <button className="qty-btn" onClick={() => updateQty(item.product_id, -1)}>-</button>
                                                <span className="qty-value">{item.qty}</span>
                                                <button className="qty-btn" onClick={() => updateQty(item.product_id, 1)}>+</button>
                                            </div>
                                            <div className="col-price item-price">{fRupiah(item.price * item.qty)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Payment Methods */}
                        <section className="payment-methods">
                            <h2 className="cart-title mb-4">Metode Pembayaran</h2>
                            <div className="payment-grid">
                                <button className={`payment-btn ${paymentMethod === 'card' ? 'payment-active' : ''}`} onClick={() => setPaymentMethod('card')}>
                                    <span className="material-symbols-outlined icon-lg">credit_card</span>
                                    <span className="payment-label">Kartu</span>
                                </button>
                                <button className={`payment-btn ${paymentMethod === 'cash' ? 'payment-active' : ''}`} onClick={() => setPaymentMethod('cash')}>
                                    <span className="material-symbols-outlined icon-lg">payments</span>
                                    <span className="payment-label">Tunai</span>
                                </button>
                                <button className={`payment-btn ${paymentMethod === 'qr' ? 'payment-active' : ''}`} onClick={() => setPaymentMethod('qr')}>
                                    <span className="material-symbols-outlined icon-lg">qr_code_2</span>
                                    <span className="payment-label">QRIS</span>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar: Summary Panel */}
                    <aside className="summary-panel">
                        {/* Member Identity & Rewards Block */}
                        <section className="member-identification">
                            <div className="ident-content">
                                {member ? (
                                    <div className="w-full">
                                        <div className="flex-col-start gap-1">
                                            <span className="info-label text-sm uppercase text-gray-400">Member Aktif</span>
                                            <h2 className="font-bold text-xl text-white" style={{ textTransform: 'uppercase' }}>{member.nama}</h2>
                                            <p className="text-sm font-semibold text-gray-300">{member.unit}</p>
                                        </div>
                                        <div className="points-box mt-3">
                                            <div className="flex-space border-bottom py-2">
                                                <span>Total Poin</span>
                                                <span className="font-bold text-primary">{member.points} pts</span>
                                            </div>
                                            <div className="flex-space py-2">
                                                <span>Nilai Tukar</span>
                                                <span className="font-bold">{fRupiah(maxPointsValue)}</span>
                                            </div>
                                            {cart.length > 0 && maxPointsValue > 0 && (
                                                <div className="use-points-action mt-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <label className="checkbox-container text-white" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                                                        <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Gunakan Poin untuk Diskon</span>
                                                    </label>
                                                </div>
                                            )}
                                            <button className="flex items-center justify-center w-full gap-2 mt-4 py-2 px-4 rounded-xl font-bold text-sm transition" 
                                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                                onClick={() => {setMember(null); setUsePoints(false);}}
                                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)' }}
                                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)' }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>person_remove</span>
                                                HAPUS MEMBER
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <h2 className="ident-title mb-2">Identifikasi Anggota</h2>
                                        <div className="manual-member-lookup mb-4">
                                            <div className="flex-row">
                                                <input 
                                                    type="text" 
                                                    className="form-input flex-1" 
                                                    placeholder="UID / No. HP"
                                                    value={manualLookupText}
                                                    onChange={e => setManualLookupText(e.target.value)}
                                                />
                                                <button className="btn-save py-1 px-3 flex items-center justify-center min-w-[70px]" onClick={() => fetchMember(manualLookupText)} disabled={isFetchingMember}>
                                                    {isFetchingMember ? <span className="material-symbols-outlined spin-icon" style={{ fontSize: '1rem' }}>sync</span> : 'Cek'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="qr-scanner-box cursor-pointer hover-scale transition mt-2" onClick={() => setScanModalOpen(true)}>
                                            <div className="qr-scanner-inner transition" style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '180px', margin: '0 auto' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#000', fontWeight: 'bold' }}>qr_code_scanner</span>
                                            </div>
                                            <p className="qr-helper mt-2 text-gray-300 font-semibold text-center" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>KLIK UNTUK SCAN QR</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="ident-glow"></div>
                        </section>

                        {/* Transaction Summary Block */}
                        <section className="transaction-summary">
                            <h2 className="summary-title">Ringkasan Biaya</h2>
                            
                            <div className="summary-lines">
                                <div className="summary-line">
                                    <span className="line-label">Subtotal</span>
                                    <span className="line-value font-bold">{fRupiah(subtotal)}</span>
                                </div>
                                <div className="summary-line">
                                    <span className="line-label">Pajak (0%)</span>
                                    <span className="line-value font-bold">{fRupiah(tax)}</span>
                                </div>
                                {applicableDiscount > 0 && (
                                    <div className="summary-line line-discount">
                                        <span className="line-label">Diskon Poin ({fRupiah(pointsUsed)})</span>
                                        <span className="line-value font-bold">- {fRupiah(applicableDiscount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="total-box">
                                <span className="total-label">Total Pembayaran</span>
                                <span className="total-value">{fRupiah(total)}</span>
                            </div>
                            
                            {member && cart.length > 0 && (
                                <div style={{ textAlign:'center', fontSize:'0.8rem', color:'#16a34a', fontWeight:'bold', marginTop:'0.5rem' }}>
                                    + {fRupiah(pointsEarned)} poin akan ditambahkan ke akun member
                                </div>
                            )}

                            <div className="action-buttons mt-4">
                                <button className="btn-complete w-full" onClick={handleCheckoutClick} disabled={cart.length === 0}>
                                    <span className="material-symbols-outlined fill-icon">shopping_cart_checkout</span>
                                    Proses Pembayaran
                                </button>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
