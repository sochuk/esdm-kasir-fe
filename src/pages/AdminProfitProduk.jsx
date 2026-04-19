import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../features/ui/uiSlice';
import axiosInstance from '../api/axiosInstance';
import './AdminInventaris.css';

const AdminProfitProduk = () => {
    const dispatch = useDispatch();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const todayWIB = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const [startDate, setStartDate] = useState(todayWIB);
    const [endDate, setEndDate] = useState(todayWIB);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axiosInstance.get('/api/report/products')
            .then(r => setProducts(r.data))
            .catch(() => dispatch(addNotification({ message: 'Gagal mengambil daftar produk', type: 'error' })));
    }, []);

    const fRupiah = num => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            dispatch(addNotification({ message: 'Rentang tanggal wajib diisi', type: 'error' }));
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
            if (selectedProduct) params.append('product_id', selectedProduct);
            const res = await axiosInstance.get(`/api/report/profit?${params}`);
            setReportData(res.data);
        } catch (err) {
            dispatch(addNotification({ message: 'Gagal mengambil data laporan', type: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!reportData) return;
        try {
            const XLSX = await import('xlsx');
            const rows = reportData.transactions.map((t, i) => ({
                'No': i + 1,
                'Tanggal': new Date(t.created_date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }),
                'No. Invoice': t.invoice_number,
                'Produk': t.product_name,
                'SKU': t.product_sku,
                'Qty': t.quantity,
                'Harga Jual (Rp)': Number(t.sell_price),
                'Harga Beli (Rp)': Number(t.buy_price),
                'Subtotal Jual (Rp)': Number(t.sell_subtotal),
                'Jenis': t.is_consignment ? `Titipan (${t.consignment_percentage}%)` : 'Reguler',
                'Keuntungan (Rp)': Number(t.profit),
            }));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, 'Profit Produk');
            XLSX.writeFile(wb, `Profit_${startDate}_sd_${endDate}.xlsx`);
            dispatch(addNotification({ message: 'Export berhasil!', type: 'success' }));
        } catch {
            dispatch(addNotification({ message: 'Gagal export Excel', type: 'error' }));
        }
    };

    const toWIB = (d) => new Date(d).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <>
            <div className="inventory-container">
                    <div className="inventory-header">
                        <div>
                            <h1 className="inventory-title">Laporan Profit Produk</h1>
                            <p className="inventory-subtitle">Analisa keuntungan per produk berdasarkan rentang tanggal</p>
                        </div>
                        {reportData && (
                            <button className="btn-primary" style={{ background: '#16a34a', color: '#fff' }} onClick={handleExport}>
                                <span className="material-symbols-outlined">download</span> Export Excel
                            </button>
                        )}
                    </div>

                    {/* Filter Form */}
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.4rem' }}>Produk (Opsional)</label>
                                <select className="form-input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
                                    <option value="">— Semua Produk —</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.4rem' }}>Dari Tanggal</label>
                                <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.4rem' }}>Sampai Tanggal</label>
                                <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem' }} />
                            </div>
                            <div>
                                <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                    {loading ? <span className="material-symbols-outlined spin-icon">sync</span> : <span className="material-symbols-outlined">analytics</span>}
                                    {loading ? 'Memuat...' : 'Generate Laporan'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {reportData && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'Total Transaksi', value: reportData.summary.total_transactions, icon: 'receipt_long', color: '#7c3aed', bg: '#ede9fe' },
                                    { label: 'Total Qty Terjual', value: `${reportData.summary.total_qty_sold} unit`, icon: 'inventory_2', color: '#2563eb', bg: '#dbeafe' },
                                    { label: 'Total Pemasukan', value: fRupiah(reportData.summary.total_sell_revenue), icon: 'payments', color: '#059669', bg: '#d1fae5' },
                                    { label: 'Total Keuntungan', value: fRupiah(reportData.summary.total_profit), icon: 'trending_up', color: '#d97706', bg: '#fef3c7', bold: true },
                                ].map((card, i) => (
                                    <div key={i} style={{ background: '#fff', border: `1px solid ${card.bg}`, borderLeft: `4px solid ${card.color}`, borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                            <span className="material-symbols-outlined" style={{ color: card.color, fontSize: '1.1rem' }}>{card.icon}</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: card.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
                                        </div>
                                        <div style={{ fontSize: card.bold ? '1.3rem' : '1.1rem', fontWeight: 900, color: '#111827' }}>{card.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Table */}
                            <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', fontWeight: 800, fontSize: '0.9rem', color: '#374151' }}>
                                    Detail Transaksi ({reportData.transactions.length} baris)
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                {['Tanggal', 'Invoice', 'Produk', 'Qty', 'Harga Jual', 'Harga Beli', 'Jenis', 'Keuntungan'].map(h => (
                                                    <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.04em' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.transactions.length === 0 ? (
                                                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Tidak ada data transaksi pada periode ini</td></tr>
                                            ) : reportData.transactions.map((tx, i) => (
                                                <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                    <td style={{ padding: '0.6rem 0.8rem', color: '#374151' }}>{toWIB(tx.created_date)}</td>
                                                    <td style={{ padding: '0.6rem 0.8rem' }}><code style={{ fontSize: '0.75rem', color: '#374151' }}>{tx.invoice_number}</code></td>
                                                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>{tx.product_name}</td>
                                                    <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700 }}>{tx.quantity}</td>
                                                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>{fRupiah(tx.sell_price)}</td>
                                                    <td style={{ padding: '0.6rem 0.8rem', color: '#6b7280' }}>{fRupiah(tx.buy_price)}</td>
                                                    <td style={{ padding: '0.6rem 0.8rem' }}>
                                                        {tx.is_consignment
                                                            ? <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.15rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 800 }}>Titipan {tx.consignment_percentage}%</span>
                                                            : <span style={{ background: '#dbeafe', color: '#2563eb', padding: '0.15rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 800 }}>Reguler</span>
                                                        }
                                                    </td>
                                                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 900, color: Number(tx.profit) >= 0 ? '#16a34a' : '#dc2626' }}>{fRupiah(tx.profit)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {!reportData && !loading && (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>analytics</span>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Pilih filter dan klik Generate Laporan</p>
                            <p style={{ fontSize: '0.9rem' }}>Laporan profit akan muncul di sini</p>
                        </div>
                    )}
                </div>
        </>
    );
};

export default AdminProfitProduk;
