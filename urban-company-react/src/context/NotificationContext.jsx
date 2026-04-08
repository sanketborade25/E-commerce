import { createContext, useCallback, useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../api/client';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.getNotifications(userId);
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setNotifications(sorted);
      setUnreadCount(sorted.filter((n) => !n.isRead).length);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (ids) => {
    // Backend mark read not implemented yet, local only
    setNotifications((notifs) => {
      const next = notifs.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n));
      setUnreadCount(next.filter((n) => !n.isRead).length);
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      toast
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

