import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ScanModal.css';

const ScanModal = ({ isOpen, onClose, onScan }) => {
    const [buffer, setBuffer] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'error'
    const [statusMsg, setStatusMsg] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setBuffer('');
            setStatus('idle');
            setStatusMsg('');
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const handleSubmit = useCallback(async (text) => {
        if (!text.trim()) return;
        const result = await onScan(text.trim());

        if (result.type === 'member') {
            setStatus('success');
            setStatusMsg(result.message);
            setTimeout(() => onClose(), 1400);
        } else if (result.type === 'product') {
            setStatus('success');
            setStatusMsg(result.message);
            setTimeout(() => {
                setBuffer('');
                setStatus('idle');
                setStatusMsg('');
                inputRef.current?.focus();
            }, 800);
        } else {
            setStatus('error');
            setStatusMsg(result.message);
            setTimeout(() => {
                setBuffer('');
                setStatus('idle');
                setStatusMsg('');
                inputRef.current?.focus();
            }, 1600);
        }
    }, [onScan, onClose]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(buffer);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="scan-overlay" onClick={onClose}>
            <div
                className={`scan-card ${status === 'success' ? 'scan-card--success' : ''} ${status === 'error' ? 'scan-card--error' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="scan-card__header">
                    <div className="scan-card__title-group">
                        <span className="material-symbols-outlined">barcode_scanner</span>
                        <h2>Mode Scanner Aktif</h2>
                    </div>
                    <button className="scan-card__close" onClick={onClose} title="Tutup (Esc)">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Viewfinder */}
                <div className={`scan-viewfinder ${status === 'success' ? 'viewfinder--success' : ''} ${status === 'error' ? 'viewfinder--error' : ''}`}>
                    <div className="scan-corner c-tl" />
                    <div className="scan-corner c-tr" />
                    <div className="scan-corner c-bl" />
                    <div className="scan-corner c-br" />

                    {status === 'idle' && (
                        <>
                            <div className="scan-laser" />
                            <div className="scan-grid-lines" />
                        </>
                    )}

                    {status === 'success' && (
                        <div className="scan-status-icon">
                            <span className="material-symbols-outlined icon-success">check_circle</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="scan-status-icon">
                            <span className="material-symbols-outlined icon-error">error</span>
                        </div>
                    )}

                    {/* Center target dot */}
                    {status === 'idle' && <div className="scan-target-dot" />}
                </div>

                {/* Live buffer display */}
                <div className="scan-buffer-display">
                    <span className="scan-buffer-label">INPUT</span>
                    {buffer ? (
                        <span className="buffer-text">{buffer}<span className="buffer-cursor">|</span></span>
                    ) : (
                        <span className="buffer-placeholder">Menunggu input scanner...</span>
                    )}
                </div>

                {/* Status message */}
                {statusMsg && (
                    <div className={`scan-message ${status === 'success' ? 'scan-message--success' : 'scan-message--error'}`}>
                        {status === 'success' ? '✅' : '❌'} {statusMsg}
                    </div>
                )}

                {/* Help text */}
                <p className="scan-hint">
                    Arahkan pemindai ke <strong>QR Code anggota</strong>
                    <br />
                    <kbd>Enter</kbd> untuk konfirmasi &nbsp;·&nbsp; <kbd>Esc</kbd> untuk tutup
                </p>

                {/* Hidden focused input — captures scanner keystrokes */}
                <input
                    ref={inputRef}
                    className="scan-input-hidden"
                    value={buffer}
                    onChange={e => setBuffer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    tabIndex={0}
                />
            </div>
        </div>
    );
};

export default ScanModal;
