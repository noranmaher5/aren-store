import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  //notifyications fetching every 30 seconds if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // close notification bell on click outside
  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpen(false); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unreadCount > 0) {
      try {
        await notificationAPI.markAllAsRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) {
        console.error("Error marking as read", err);
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error("Error deleting notification", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications", err);
    }
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'منذ لحظات';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const TYPE_ICON = {
    codes_ready: '🎉',
    order_failed: '❌',
    order_refunded: '💸',
    NEW_COMMENT: '💬', 
    general: '🔔',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', width: 40, height: 40, borderRadius: '50%',
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s', color: '#fff',
        }}
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: '#4F46E5', color: '#fff',
            fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0B0E17',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="aren-notification-panel" style={{
          position: 'absolute', top: 50, right: 0, width: 340, maxHeight: 480,
          background: '#10131a', border: '1px solid rgba(185,140,255,0.22)',
          borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          zIndex: 9999, overflow: 'hidden', display: 'flex', flexDirection: 'column', direction: 'rtl',
          boxSizing: 'border-box', maxWidth: 'calc(100vw - 24px)',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e8f0e0' }}>Notifications</span>
            {notifications.length > 0 && (
              <button onClick={handleClearAll} style={{ fontSize: 11, color: '#6b7280', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>
                Clear all
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
                لا توجد إشعارات حتى الآن
              </div>
            ) : notifications.map(n => (
              <Link
                key={n._id} 
                 
                to={n.type === 'NEW_COMMENT' ? '/admin/products' : (n.actionUrl || '/orders')} 
                state={n.type === 'NEW_COMMENT' ? { openProduct: n.metadata?.productId } : {}}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', gap: 12, padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: n.isRead ? 'transparent' : 'rgba(34,197,94,0.04)',
                  textDecoration: 'none', transition: 'background .2s', position: 'relative',
                }}
              >
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{TYPE_ICON[n.type] || '🔔'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e8f0e0' }}>{n.title}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ margin: '5px 0 0', fontSize: 10, color: '#374151', fontWeight: 600 }}>{timeAgo(n.createdAt)}</p>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, n._id)} 
                  style={{ 
                    position: 'absolute', top: 10, right: 12, background: 'none', 
                    border: 'none', cursor: 'pointer', color: '#374151', fontSize: 16, lineHeight: 1 
                  }}
                >
                  ×
                </button>
                {!n.isRead && (
                  <div style={{ 
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', 
                    width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' 
                  }} />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
