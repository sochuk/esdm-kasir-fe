import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../features/ui/uiSlice';
import axiosInstance from '../api/axiosInstance';
import './ReceiptModal.css';

const ReceiptModal = ({ transactionId, isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [receiptData, setReceiptData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && transactionId) {
            fetchReceipt(transactionId);
        } else {
            setReceiptData(null);
        }
    }, [isOpen, transactionId]);

    const fetchReceipt = async (id) => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/api/pos/receipt/${id}`);
            setReceiptData(res.data);
        } catch (error) {
            console.error('Failed to fetch receipt:', error);
            dispatch(addNotification({ message: 'Gagal mengambil data struk', type: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    const fRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
    const header = receiptData?.header;
    const items = receiptData?.items || [];

    return (
        <div className="receipt-overlay" onClick={onClose}>
            <div className="receipt-container no-print" onClick={e => e.stopPropagation()}>
                <div className="receipt-modal-header">
                    <h2>Cetak Struk Transaksi</h2>
                    <button className="btn-close" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
                </div>
                
                <div className="receipt-paper-wrapper">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Memuat data struk...</div>
                    ) : receiptData ? (
                        <div id="receipt-print-area" className="receipt-paper">
                            {/* Receipt Content */}
                            <div className="rcpt-header">
                                <h1>ESDM Kasir</h1>
                                <p>KANTOR PUSAT KESDM</p>
                                <p>Jl. Medan Merdeka Selatan No. 18</p>
                                <p>Jakarta Pusat, DKI Jakarta</p>
                            </div>
                            
                            <div className="rcpt-divider"></div>
                            
                            <div className="rcpt-meta">
                                <div><span>No. Inv:</span> <span>{header.invoice_number}</span></div>
                                <div><span>Tanggal:</span> <span>{new Date(header.created_date).toLocaleString('id-ID')}</span></div>
                                <div><span>Kasir:</span> <span>{header.created_by}</span></div>
                                {header.member_name && (
                                    <div><span>Member:</span> <span>{header.member_name} ({header.no_anggota})</span></div>
                                )}
                            </div>

                            <div className="rcpt-divider"></div>

                            <table className="rcpt-items">
                                <thead>
                                    <tr>
                                        <th className="text-left">Item</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Harga</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="text-left">{item.product_name}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">{new Intl.NumberFormat('id-ID').format(item.price)}</td>
                                            <td className="text-right">{new Intl.NumberFormat('id-ID').format(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="rcpt-divider"></div>

                            <div className="rcpt-summary">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>{fRupiah(header.subtotal)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Pajak PPN</span>
                                    <span>{fRupiah(header.tax)}</span>
                                </div>
                                {Number(header.discount) > 0 && (
                                    <div className="summary-row">
                                        <span>Diskon Mbr ({header.points_used}pts)</span>
                                        <span>-{fRupiah(header.discount)}</span>
                                    </div>
                                )}
                                <div className="rcpt-divider-dashed"></div>
                                <div className="summary-row total">
                                    <span>TOTAL</span>
                                    <span>{fRupiah(header.total)}</span>
                                </div>
                            </div>
                            
                            <div className="rcpt-payment mt-4">
                                <div><span>Metode Bayar:</span> <span className="uppercase">{header.payment_method}</span></div>
                            </div>

                            <div className="rcpt-divider"></div>

                            <div className="rcpt-footer">
                                <p>Terima kasih atas kunjungan Anda!</p>
                                <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
                                {Number(header.points_earned) > 0 && (
                                    <p className="mt-2 font-bold">+ {header.points_earned} Poin Loyalitas</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-red-500">Struk tidak ditemukan</div>
                    )}
                </div>

                <div className="receipt-actions">
                    <button className="btn-cancel" style={{ fontWeight: 700, padding: '0.6rem 2rem', borderRadius: '0.75rem', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151' }} onClick={onClose}>Tutup</button>
                    <button className="btn-primary" style={{ padding: '0.6rem 2rem', borderRadius: '0.75rem' }} onClick={handlePrint} disabled={!receiptData}>
                        <span className="material-symbols-outlined">print</span> Print Struk
                    </button>
                </div>
            </div>
            
            {/* INVISIBLE CLONE FOR ACTUAL BROWSER PRINTING */}
            <div className="print-only">
                {receiptData && (
                    <div className="receipt-paper">
                            {/* Receipt Content - Duplicated for clean printing */}
                            <div className="rcpt-header">
                                <h1>ESDM Kasir</h1>
                                <p>KANTOR PUSAT KESDM</p>
                                <p>Jl. Medan Merdeka Selatan No. 18</p>
                                <p>Jakarta Pusat, DKI Jakarta</p>
                            </div>
                            
                            <div className="rcpt-divider"></div>
                            
                            <div className="rcpt-meta">
                                <div><span>No. Inv:</span> <span>{header.invoice_number}</span></div>
                                <div><span>Tanggal:</span> <span>{new Date(header.created_date).toLocaleString('id-ID')}</span></div>
                                <div><span>Kasir:</span> <span>{header.created_by}</span></div>
                                {header.member_name && (
                                    <div><span>Member:</span> <span>{header.member_name}</span></div>
                                )}
                            </div>

                            <div className="rcpt-divider"></div>

                            <table className="rcpt-items">
                                <thead>
                                    <tr>
                                        <th className="text-left">Item</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Harga</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="text-left">{item.product_name}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">{new Intl.NumberFormat('id-ID').format(item.price)}</td>
                                            <td className="text-right">{new Intl.NumberFormat('id-ID').format(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="rcpt-divider"></div>

                            <div className="rcpt-summary">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>{fRupiah(header.subtotal)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Pajak PPN</span>
                                    <span>{fRupiah(header.tax)}</span>
                                </div>
                                {Number(header.discount) > 0 && (
                                    <div className="summary-row">
                                        <span>Diskon Mbr ({header.points_used}pts)</span>
                                        <span>-{fRupiah(header.discount)}</span>
                                    </div>
                                )}
                                <div className="rcpt-divider-dashed"></div>
                                <div className="summary-row total">
                                    <span>TOTAL</span>
                                    <span>{fRupiah(header.total)}</span>
                                </div>
                            </div>

                            <div className="rcpt-divider"></div>

                            <div className="rcpt-footer">
                                <p>Terima kasih atas kunjungan Anda!</p>
                                <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
                            </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceiptModal;
