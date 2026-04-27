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
        if (!receiptData) return;
        const { header, items } = receiptData;

        const fRupiahStr = (num) =>
            new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
        const fNumStr = (num) => new Intl.NumberFormat('id-ID').format(num);
        const fDate = (d) => new Date(d).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' });
        const fTime = (d) => new Date(d).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const itemRows = items.map(item => `
            <tr>
                <td style="text-align:left;padding:2px 0;vertical-align:top;">${item.product_name}</td>
                <td style="text-align:center;padding:2px 0;">${item.quantity}</td>
                <td style="text-align:right;padding:2px 0;">${fNumStr(item.price)}</td>
                <td style="text-align:right;padding:2px 0;">${fNumStr(item.subtotal)}</td>
            </tr>
        `).join('');

        const discountRow = Number(header.discount) > 0 ? `
            <div style="display:flex;justify-content:space-between;">
                <span>Diskon Mbr (${header.points_used}pts)</span>
                <span>-${fRupiahStr(header.discount)}</span>
            </div>` : '';

        const memberRow = header.member_name ? `
            <div><span>Member:</span><span>${header.member_name}</span></div>` : '';

        const pointsRow = Number(header.points_earned) > 0 ? `
            <p style="text-align:center;font-weight:bold;margin:4px 0;">+ ${header.points_earned} Poin Loyalitas</p>` : '';

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Struk</title>
<style>
@page { margin: 0; size: 58mm auto; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    color: #000;
    background: #fff;
    width: 58mm;
    padding: 3mm 2mm;
}
.center { text-align: center; }
.divider { border-top: 1px dashed #000; margin: 4px 0; }
.row { display: flex; justify-content: space-between; margin: 2px 0; }
h1 { font-size: 13px; font-weight: bold; text-align: center; margin-bottom: 3px; }
p { text-align: center; font-size: 10px; margin: 1px 0; }
table { width: 100%; border-collapse: collapse; margin: 0; }
th { border-bottom: 1px dashed #000; padding-bottom: 3px; font-size: 11px; }
td { font-size: 11px; padding: 1px 0; }
.total { font-weight: bold; font-size: 14px; }
</style>
</head>
<body>
<h1>Koperasi Konsumen Pegawai KESDM</h1>
<p>KANTOR PUSAT KESDM</p>
<p>Jl. Medan Merdeka Selatan No. 18</p>
<p>Jakarta Pusat, DKI Jakarta</p>

<div class="divider"></div>

<div class="row"><span>No. Inv:</span><span>${header.invoice_number}</span></div>
<div class="row"><span>Tanggal:</span><span>${fDate(header.created_date)}</span></div>
<div class="row"><span>Pukul:</span><span>${fTime(header.created_date)} WIB</span></div>
<div class="row"><span>Kasir:</span><span>${header.created_by}</span></div>
${memberRow}

<div class="divider"></div>

<table>
<thead>
<tr>
<th style="text-align:left;">Item</th>
<th style="text-align:center;">Qty</th>
<th style="text-align:right;">Harga</th>
<th style="text-align:right;">Total</th>
</tr>
</thead>
<tbody>${itemRows}</tbody>
</table>

<div class="divider"></div>

<div class="row"><span>Subtotal</span><span>${fRupiahStr(header.subtotal)}</span></div>
<div class="row"><span>Pajak PPN</span><span>${fRupiahStr(header.tax)}</span></div>
${discountRow}
<div class="divider" style="border-style:solid;"></div>
<div class="row total"><span>TOTAL</span><span>${fRupiahStr(header.total)}</span></div>
<div class="divider"></div>
<div class="row"><span>Metode Bayar:</span><span style="text-transform:uppercase;">${header.payment_method}</span></div>
<div class="divider"></div>

<p>Terima kasih atas kunjungan Anda!</p>
<p>Barang yang sudah dibeli tidak dapat ditukar.</p>
${pointsRow}
</body>
</html>`;

        const printWin = window.open('', '_blank', 'width=320,height=600,toolbar=0,menubar=0,location=0,status=0,scrollbars=0');
        if (!printWin) {
            dispatch(addNotification({ message: 'Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.', type: 'error' }));
            return;
        }
        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
        printWin.onload = () => {
            printWin.focus();
            printWin.print();
            printWin.onafterprint = () => printWin.close();
        };
    };

    if (!isOpen) return null;

    const fRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
    const header = receiptData?.header;
    const items = receiptData?.items || [];

    return (
        <div className="receipt-overlay" onClick={onClose}>
            <div className="receipt-container" onClick={e => e.stopPropagation()}>
                <div className="receipt-modal-header">
                    <h2>Cetak Struk Transaksi</h2>
                    <button className="btn-close" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
                </div>

                <div className="receipt-paper-wrapper">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Memuat data struk...</div>
                    ) : receiptData ? (
                        <div className="receipt-paper">
                            <div className="rcpt-header">
                                <h1>Koperasi Konsumen Pegawai KESDM</h1>
                                <p>KANTOR PUSAT KESDM</p>
                                <p>Jl. Medan Merdeka Selatan No. 18</p>
                                <p>Jakarta Pusat, DKI Jakarta</p>
                            </div>

                            <div className="rcpt-divider"></div>

                            <div className="rcpt-meta">
                                <div><span>No. Inv:</span> <span>{header.invoice_number}</span></div>
                                <div><span>Tanggal:</span> <span>{new Date(header.created_date).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                                <div><span>Pukul:</span> <span>{new Date(header.created_date).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span></div>
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
                                <div className="summary-row"><span>Subtotal</span><span>{fRupiah(header.subtotal)}</span></div>
                                <div className="summary-row"><span>Pajak PPN</span><span>{fRupiah(header.tax)}</span></div>
                                {Number(header.discount) > 0 && (
                                    <div className="summary-row">
                                        <span>Diskon Mbr ({header.points_used}pts)</span>
                                        <span>-{fRupiah(header.discount)}</span>
                                    </div>
                                )}
                                <div className="rcpt-divider-dashed"></div>
                                <div className="summary-row total"><span>TOTAL</span><span>{fRupiah(header.total)}</span></div>
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
        </div>
    );
};

export default ReceiptModal;
