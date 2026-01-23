import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'
import { useLanguage } from '../../context/LanguageContext'
import './NotificationPanel.css'

function NotificationPanel({ onClose }) {
    const { notifications, loading, markAsRead, markAllRead } = useNotifications()
    const { language, t } = useLanguage()
    const panelRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return language === 'ta' ? 'இப்போது' : 'just now'
        if (diffInSeconds < 3600) {
            const mins = Math.floor(diffInSeconds / 60)
            return language === 'ta' ? `${mins} நிமிடம் முன்` : `${mins}m ago`
        }
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600)
            return language === 'ta' ? `${hours} மணி முன்` : `${hours}h ago`
        }
        return date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')
    }

    const getIcon = (type) => {
        switch (type) {
            case 'job_match': return '🎯'
            case 'application_received': return '📩'
            case 'request_accepted': return '✅'
            case 'work_request': return '💼'
            default: return '🔔'
        }
    }

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id)
        }
        onClose()
    }

    return (
        <div className="notification-panel" ref={panelRef}>
            <div className="notif-header">
                <h3>{language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications'}</h3>
                {notifications.some(n => !n.isRead) && (
                    <button className="mark-all-btn" onClick={markAllRead}>
                        {language === 'ta' ? 'அனைத்தும் படித்தவை' : 'Mark all as read'}
                    </button>
                )}
            </div>

            <div className="notif-list custom-scrollbar">
                {loading ? (
                    <div className="notif-loading">
                        <div className="spinner-sm"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notif-empty">
                        <span className="empty-icon">📭</span>
                        <p>{language === 'ta' ? 'அறிவிப்புகள் எதுவும் இல்லை' : 'No notifications yet'}</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification._id}
                            className={`notif-item ${!notification.isRead ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notif-icon-wrapper">
                                {getIcon(notification.type)}
                            </div>
                            <div className="notif-content">
                                <p className="notif-title">{notification.title}</p>
                                <p className="notif-message">{notification.message}</p>
                                <span className="notif-time">{formatTime(notification.createdAt)}</span>
                            </div>
                            {!notification.isRead && <div className="unread-dot"></div>}
                        </div>
                    ))
                )}
            </div>

            <div className="notif-footer">
                <Link to="/notifications" onClick={onClose}>
                    {language === 'ta' ? 'அனைத்தையும் காண்க' : 'View all notifications'}
                </Link>
            </div>
        </div>
    )
}

export default NotificationPanel
