import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../features/ui/uiSlice';

const Toast = () => {
    const { notifications } = useSelector(state => state.ui);
    const dispatch = useDispatch();

    if (notifications.length === 0) return null;

    return (
        <div className="toast-container" style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            pointerEvents: 'none'
        }}>
            {notifications.map(n => (
                <ToastItem key={n.id} notification={n} onRemove={(id) => dispatch(removeNotification(id))} />
            ))}
        </div>
    );
};

const ToastItem = ({ notification, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(notification.id);
        }, notification.duration);
        return () => clearTimeout(timer);
    }, [notification, onRemove]);

    const getColors = () => {
        switch (notification.type) {
            case 'success': return { bg: '#10b981', icon: 'check_circle' };
            case 'error': return { bg: '#ef4444', icon: 'error' };
            case 'info': return { bg: 'var(--color-primary-fixed)', icon: 'info' }; // Brand yellow
            default: return { bg: '#3b82f6', icon: 'info' };
        }
    };

    const { bg, icon } = getColors();

    return (
        <div 
            className="toast-item"
            style={{
                background: bg,
                color: notification.type === 'info' ? '#000' : '#fff',
                padding: '1rem 1.5rem',
                borderRadius: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                minWidth: '20rem',
                maxWidth: '30rem',
                pointerEvents: 'auto',
                animation: 'toast-slide-in 0.3s ease-out forwards',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>{icon}</span>
            <span style={{ flex: 1 }}>{notification.message}</span>
            <button 
                onClick={() => onRemove(notification.id)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    opacity: 0.7,
                    display: 'flex',
                }}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
            </button>
            
            <style>{`
                @keyframes toast-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .toast-item:hover { transform: translateY(-2px); transition: transform 0.2s; }
            `}</style>
        </div>
    );
};

export default Toast;
