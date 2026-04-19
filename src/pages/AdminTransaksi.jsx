import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../features/ui/uiSlice';
import DataTable from '../components/DataTable';
import ReceiptModal from '../components/ReceiptModal';
import axiosInstance from '../api/axiosInstance';
import './AdminInventaris.css';
import './AdminTransaksi.css';

// Helper: Format ke WIB
const toWIB = (dateStr) => {
    const d = new Date(dateStr);
    return {
        date: d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }),
        time: d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB',
        dateShort: d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
    };
};

const AdminTransaksi = () => {
    const dispatch = useDispatch();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedTxId, setSelectedTxId] = useState(null);

    // Use WIB timezone for "today" calculation
    const now = new Date();
    const todayISO = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // 'sv-SE' gives YYYY-MM-DD format
    const [startDate, setStartDate] = useState(todayISO);
    const [endDate, setEndDate] = useState(todayISO);
    const [rangeMode, setRangeMode] = useState('today'); // 'today' | 'range'

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

    // === FILTER berdasarkan range tanggal ===
    const filteredTx = transactions.filter(t => {
        const txISO = new Date(t.created_date).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        if (rangeMode === 'today') {
            return txISO === todayISO;
        }
        return txISO >= startDate && txISO <= endDate;
    });

    // Metrics dari data terfilter
    const totalSales = filteredTx.reduce((acc, t) => acc + Number(t.total), 0);
    const cardSales = filteredTx.filter(t => t.payment_method === 'card').reduce((acc, t) => acc + Number(t.total), 0);
    const cashSales = filteredTx.filter(t => t.payment_method === 'cash').reduce((acc, t) => acc + Number(t.total), 0);
    const qrisSales = filteredTx.filter(t => t.payment_method === 'qr').reduce((acc, t) => acc + Number(t.total), 0);

    // === EXPORT EXCEL ===
    const handleExportExcel = async () => {
        try {
            const XLSX = await import('xlsx');

            // Group per tanggal untuk summary
            const byDate = {};
            filteredTx.forEach(t => {
                const dayKey = new Date(t.created_date).toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric'
                });
                if (!byDate[dayKey]) byDate[dayKey] = { date: dayKey, count: 0, total: 0 };
                byDate[dayKey].count++;
                byDate[dayKey].total += Number(t.total);
            });

            // Sheet 1 — Detail transaksi
            const detailRows = filteredTx.map((t, i) => ({
                'No': i + 1,
                'Tanggal': new Date(t.created_date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }),
                'Jam': new Date(t.created_date).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB',
                'No. Invoice': t.invoice_number,
                'Member': t.member_name || '-',
                'Metode Bayar': String(t.payment_method || '').toUpperCase(),
                'Operator': t.created_by || '-',
                'Total (Rp)': Number(t.total),
            }));

            // Sheet 2 — Summary per tanggal
            const summaryRows = Object.values(byDate).map(d => ({
                'Tanggal': d.date,
                'Jumlah Transaksi': d.count,
                'Total Pemasukan (Rp)': d.total,
            }));
            // Baris grand total untuk summary
            summaryRows.push({
                'Tanggal': 'TOTAL KESELURUHAN',
                'Jumlah Transaksi': filteredTx.length,
                'Total Pemasukan (Rp)': totalSales,
            });

            const wb = XLSX.utils.book_new();
            const wsDetail = XLSX.utils.json_to_sheet(detailRows);
            const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

            XLSX.utils.book_append_sheet(wb, wsDetail, 'Transaksi Detail');
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Per Tanggal');

            const fileName = `Transaksi_KESDM_${startDate}_sd_${endDate}.xlsx`;
            XLSX.writeFile(wb, fileName);
            dispatch(addNotification({ message: `✅ File Excel berhasil diekspor: ${fileName}`, type: 'success' }));
        } catch (err) {
            console.error('Export error:', err);
            dispatch(addNotification({ message: 'Gagal ekspor Excel. Pastikan library xlsx terpasang.', type: 'error' }));
        }
    };

    const transaksiColumns = [
        {
            header: 'Waktu Transaksi',
            accessor: 'created_date',
            render: (tx) => {
                const { date, time } = toWIB(tx.created_date);
                return (
                    <>
                        <div className="font-bold" style={{ color: '#111827', fontSize: '0.85rem' }}>{date}</div>
                        <div className="text-xs" style={{ color: '#6b7280', marginTop: '0.1rem', fontWeight: 600, fontSize: '0.75rem' }}>Pukul {time}</div>
                    </>
                );
            }
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
        <>
            <div className="inventory-container">
                    {/* Header */}
                    <div className="inventory-header">
                        <div>
                            <h1 className="inventory-title">Riwayat Transaksi</h1>
                            <p className="inventory-subtitle">Laporan omset & pencetakan struk — {filteredTx.length} transaksi ditemukan</p>
                        </div>
                        <div className="header-actions" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(253, 212, 0, 0.4)', background: '#16a34a', color: '#fff' }} onClick={handleExportExcel}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>download</span> 
                                <span className="font-bold">Export Excel</span>
                            </button>
                            <button className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(253, 212, 0, 0.4)' }} onClick={fetchHistory}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>sync</span> 
                                <span className="hidden-mobile font-bold">Sinkronisasi</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span className="material-symbols-outlined" style={{ color: '#6b7280', fontSize: '1.2rem' }}>calendar_month</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>Filter Tanggal:</span>
                        <button onClick={() => setRangeMode('today')} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', backgroundColor: rangeMode === 'today' ? '#111827' : '#fff', color: rangeMode === 'today' ? '#fdd400' : '#374151', borderColor: rangeMode === 'today' ? '#111827' : '#d1d5db', transition: 'all 0.15s' }}>
                            Hari Ini
                        </button>
                        <button onClick={() => setRangeMode('range')} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', backgroundColor: rangeMode === 'range' ? '#111827' : '#fff', color: rangeMode === 'range' ? '#fdd400' : '#374151', borderColor: rangeMode === 'range' ? '#111827' : '#d1d5db', transition: 'all 0.15s' }}>
                            Rentang Tanggal
                        </button>
                        {rangeMode === 'range' && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>Dari:</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.35rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #d1d5db', fontSize: '0.85rem', fontWeight: 600 }}/>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>Sampai:</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.35rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #d1d5db', fontSize: '0.85rem', fontWeight: 600 }}/>
                                </div>
                            </>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                            {rangeMode === 'today' ? 'Menampilkan: Hari ini' : `Menampilkan: ${startDate} s/d ${endDate}`}
                        </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="analytics-grid-reduced" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="analytic-card" style={{ background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', color: 'white', border: 'none', padding: '1rem', boxShadow: '0 8px 16px rgba(0,0,0,0.12)', borderRadius: '0.75rem' }}>
                            <span className="analytic-label text-gray-400" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', fontWeight: 800 }}>TOTAL OMSET</span>
                            <div className="analytic-value" style={{ color: 'var(--color-primary-fixed)', fontSize: '1.5rem', margin: '0.25rem 0', fontWeight: '900' }}>{fRupiah(totalSales)}</div>
                            <div className="analytic-trend">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '0.9rem' }}>point_of_sale</span>
                                <span className="font-body text-gray-300 ml-1" style={{ fontSize: '0.65rem' }}>Total terpilih</span>
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
                            <div className="analytic-value" style={{ color: '#1f2937', fontSize: '1.4rem', margin: '0.25rem 0', fontWeight: '900' }}>{filteredTx.length}</div>
                            <div className="analytic-trend">
                                <span className="material-symbols-outlined op-60" style={{ color: '#9333ea', fontSize: '0.9rem' }}>receipt_long</span>
                                <span className="op-60 font-body ml-1" style={{ fontSize: '0.65rem' }}>Struk Terbit</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <DataTable 
                        data={filteredTx}
                        columns={transaksiColumns}
                        searchable={true}
                        searchKeys={['invoice_number', 'member_name', 'created_by']}
                        searchPlaceholder="Cari no invoice, member, kasir..."
                        loading={loading}
                        emptyMessage="Belum ada transaksi pada periode ini."
                        itemsPerPage={10}
                        rowClassName={() => "row-normal bg-white hover:bg-gray-50"}
                    />
                </div>
        
        {/* Receipt Modal */}
        <ReceiptModal 
            transactionId={selectedTxId} 
            isOpen={receiptModalOpen} 
            onClose={() => setReceiptModalOpen(false)} 
        />
    </>
);
};

export default AdminTransaksi;
