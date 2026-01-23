import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import notificationService from '../services/notificationService'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
    const { isAuthenticated, user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const data = await notificationService.getNotifications();
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.isRead).length);
            }
        } catch (error) {
            // Silently fail
        }
    }, [isAuthenticated]);

    const markAsRead = async (id) => {
        try {
            const data = await notificationService.markAsRead(id);
            if (data.success) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            const data = await notificationService.markAllRead();
            if (data.success) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, isRead: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Poll for new notifications every 60 seconds
    useEffect(() => {
        let interval;
        if (isAuthenticated) {
            fetchNotifications();
            interval = setInterval(fetchNotifications, 60000);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchNotifications]);

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllRead
    }

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}
