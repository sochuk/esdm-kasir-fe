import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../features/ui/uiSlice';
import AdminSidebar from '../components/AdminSidebar';
import DataTable from '../components/DataTable';
import ReceiptModal from '../components/ReceiptModal';
import axiosInstance from '../api/axiosInstance';
import './AdminInventaris.css';

const AdminTransaksi = () => {
    const dispatch = useDispatch();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedTxId, setSelectedTxId] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/pos/history');
            setTransactions(res.data);
        } catch (error) {
            console.error('Failed to load transaction history:', error);
            dispatch(addNotification({ message: 'Gagal mengambil riwayat transaksi', type: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    const handleViewReceipt = (id) => {
        setSelectedTxId(id);
        setReceiptModalOpen(true);
    };

    const fRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    // Filter "Today Only" for metrics
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTransactions = transactions.filter(t => t.created_date.startsWith(todayStr));
    const todayTotalSales = todayTransactions.reduce((acc, t) => acc + Number(t.total), 0);
    const cardSales = todayTransactions.filter(t => t.payment_method === 'card').reduce((acc, t) => acc + Number(t.total), 0);
    const cashSales = todayTransactions.filter(t => t.payment_method === 'cash').reduce((acc, t) => acc + Number(t.total), 0);
    const qrisSales = todayTransactions.filter(t => t.payment_method === 'qr').reduce((acc, t) => acc + Number(t.total), 0);

    const transaksiColumns = [
        {
            header: 'Waktu Transaksi',
            accessor: 'created_date',
            render: (tx) => (
                <>
                    <div className="font-bold" style={{ color: '#111827', fontSize: '0.85rem' }}>{new Date(tx.created_date).toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</div>
                    <div className="text-xs" style={{ color: '#6b7280', marginTop: '0.1rem', fontWeight: 600, fontSize: '0.75rem' }}>Pukul {new Date(tx.created_date).toLocaleTimeString('id-ID')}</div>
                </>
            )
        },
        {
            header: 'No. Invoice',
            accessor: 'invoice_number',
            cellClassName: 'prod-sku font-bold',
            cellStyle: { fontSize: '0.8rem', color: '#374151', letterSpacing: '0.02em' }
        },
        {
            header: 'Member VIP',
            accessor: 'member_name',
            render: (tx) => tx.member_name ? (
                <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.5rem', borderRadius: '2rem', fontWeight: 800, fontSize: '0.7rem', border: '1px solid #bbf7d0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.8rem', verticalAlign: 'text-bottom', marginRight: '0.1rem' }}>stars</span>
                    {tx.member_name}
                </span>
            ) : <span className="op-60 font-bold" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>- Bukan Member -</span>
        },
        {
            header: 'Pembayaran',
            accessor: 'payment_method',
            render: (tx) => (
                <span className={`badge`} style={{ padding: '0.25rem 0.6rem', borderRadius: '0.4rem', fontWeight: 800, letterSpacing: '0.02em', fontSize: '0.7rem', backgroundColor: tx.payment_method === 'cash' ? '#f3f4f6' : '#eff6ff', color: tx.payment_method === 'cash' ? '#4b5563' : '#2563eb', border: tx.payment_method === 'cash' ? '1px solid #e5e7eb' : '1px solid #bfdbfe' }}>
                    {String(tx.payment_method).toUpperCase()}
                </span>
            )
        },
        {
            header: 'Operator',
            accessor: 'created_by',
            cellClassName: 'font-bold text-xs',
            cellStyle: { color: '#4b5563', textTransform: 'capitalize', fontSize: '0.75rem' }
        },
        {
            header: 'Total Nominal',
            accessor: 'total',
            cellClassName: 'text-right font-display font-bold text-primary',
            cellStyle: { fontSize: '1rem', color: '#111827' },
            className: 'text-right',
            render: (tx) => fRupiah(tx.total)
        },
        {
            header: 'Cetak Struk',
            accessor: 'actions',
            cellClassName: 'text-center',
            className: 'text-center',
            render: (tx) => (
                <button style={{ backgroundColor: 'var(--color-primary-fixed)', color: '#000', border: 'none', padding: '0.4rem 1rem', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 4px rgba(253, 212, 0, 0.3)', transition: 'transform 0.1s' }} onClick={() => handleViewReceipt(tx.id)} onMouseOver={(e) => e.currentTarget.style.transform='scale(1.03)'} onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>receipt_long</span>
                    Cetak
                </button>
            )
        }
    ];

    return (
        <div className="admin-layout">
            <AdminSidebar />
            
            <main className="admin-main inventory-main transition-all">
                <div className="inventory-container" style={{ maxWidth: '100%', padding: '0 2rem' }}>
                    {/* Header */}
                    <div className="inventory-header" style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 className="inventory-title" style={{ fontSize: '2.2rem', fontWeight: '900', color: '#18181b' }}>Riwayat Transaksi</h1>
                            <p className="inventory-subtitle" style={{ fontSize: '1rem', color: '#6b7280' }}>Laporan omset harian & pencetakan struk</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(253, 212, 0, 0.4)' }} onClick={fetchHistory}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>sync</span> 
                                <span className="hidden-mobile font-bold">Sinkronisasi Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="analytics-grid-reduced" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="analytic-card" style={{ background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', color: 'white', border: 'none', padding: '1rem', boxShadow: '0 8px 16px rgba(0,0,0,0.12)', borderRadius: '0.75rem' }}>
                            <span className="analytic-label text-gray-400" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', fontWeight: 800 }}>TOTAL OMSET HARI INI</span>
                            <div className="analytic-value" style={{ color: 'var(--color-primary-fixed)', fontSize: '1.5rem', margin: '0.25rem 0', fontWeight: '900' }}>{fRupiah(todayTotalSales)}</div>
                            <div className="analytic-trend">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '0.9rem' }}>point_of_sale</span>
                                <span className="font-body text-gray-300 ml-1" style={{ fontSize: '0.65rem' }}>Terakumulasi hari ini</span>
                            </div>
                        </div>

                        <div className="analytic-card" style={{ background: '#fff', borderLeft: '4px solid #16a34a', padding: '1rem', boxShadow: '0 4px 8px rgba(0,0,0,0.04)', borderRadius: '0.75rem' }}>
                            <span className="analytic-label" style={{ color: '#16a34a', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.05em' }}>PEMASUKAN TUNAI</span>
                            <div className="analytic-value" style={{ color: '#1f2937', fontSize: '1.4rem', margin: '0.25rem 0', fontWeight: '900' }}>{fRupiah(cashSales)}</div>
                            <div className="analytic-trend">
                                <span className="material-symbols-outlined op-60" style={{ color: '#16a34a', fontSize: '0.9rem' }}>payments</span>
                                <span className="op-60 font-body ml-1" style={{ fontSize: '0.65rem' }}>Transaksi Cash</span>
                            </div>
                        </div>

                        <div className="analytic-card" style={{ background: '#fff', borderLeft: '4px solid #2563eb', padding: '1rem', boxShadow: '0 4px 8px rgba(0,0,0,0.04)', borderRadius: '0.75rem' }}>
                            <span className="analytic-label" style={{ color: '#2563eb', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.05em' }}>KARTU & QRIS</span>
                            <div className="analytic-value" style={{ color: '#1f2937', fontSize: '1.4rem', margin: '0.25rem 0', fontWeight: '900' }}>{fRupiah(cardSales + qrisSales)}</div>
                            <div className="analytic-trend">
                                <span className="material-symbols-outlined op-60" style={{ color: '#2563eb', fontSize: '0.9rem' }}>credit_card</span>
                                <span className="op-60 font-body ml-1" style={{ fontSize: '0.65rem' }}>Digital Payment</span>
                            </div>
                        </div>

                        <div className="analytic-card" style={{ background: '#fff', borderLeft: '4px solid #9333ea', padding: '1rem', boxShadow: '0 4px 8px rgba(0,0,0,0.04)', borderRadius: '0.75rem' }}>
                            <span className="analytic-label" style={{ color: '#9333ea', fontWeight: '800', fontSize: '0.65rem', letterSpacing: '0.05em' }}>TOTAL TRANSAKSI</span>
                            <div className="analytic-value" style={{ color: '#1f2937', fontSize: '1.4rem', margin: '0.25rem 0', fontWeight: '900' }}>{todayTransactions.length}</div>
                            <div className="analytic-trend">
                                <span className="material-symbols-outlined op-60" style={{ color: '#9333ea', fontSize: '0.9rem' }}>receipt_long</span>
                                <span className="op-60 font-body ml-1" style={{ fontSize: '0.65rem' }}>Struk Terbit</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <DataTable 
                        data={transactions}
                        columns={transaksiColumns}
                        searchable={true}
                        searchKeys={['invoice_number', 'member_name', 'created_by']}
                        searchPlaceholder="Cari no invoice, member, kasir..."
                        loading={loading}
                        emptyMessage="Belum ada riwayat transaksi ditemukan."
                        itemsPerPage={10}
                        rowClassName={() => "row-normal bg-white hover:bg-gray-50"}
                    />
                </div>
            </main>

            {/* Receipt Modal */}
            <ReceiptModal 
                transactionId={selectedTxId} 
                isOpen={receiptModalOpen} 
                onClose={() => setReceiptModalOpen(false)} 
            />
        </div>
    );
};

export default AdminTransaksi;
