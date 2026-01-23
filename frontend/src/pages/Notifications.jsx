import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import './Notifications.css'

function Notifications() {
    const { notifications, loading, markAsRead, markAllRead, fetchNotifications } = useNotifications()
    const { language } = useLanguage()
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        fetchNotifications()
    }, [isAuthenticated, fetchNotifications, navigate])

    const formatTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return language === 'ta' ? 'இப்போது' : 'just now'
        if (diffInSeconds < 3600) {
            const mins = Math.floor(diffInSeconds / 60)
            return language === 'ta' ? `${mins} நிமிடம் முன்` : `${mins} minutes ago`
        }
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600)
            return language === 'ta' ? `${hours} மணி நேரம் முன்` : `${hours} hours ago`
        }
        const days = Math.floor(diffInSeconds / 86400)
        if (days === 1) return language === 'ta' ? 'நேற்று' : 'yesterday'
        if (days < 7) return language === 'ta' ? `${days} நாட்கள் முன்` : `${days} days ago`
        return date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
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

    const getNotificationLink = (notification) => {
        if (notification.data?.jobId) {
            if (notification.type === 'application_received') {
                return `/jobs/${notification.data.jobId}/applicants`
            }
            return `/jobs/${notification.data.jobId}`
        }
        return null
    }

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id)
        }
        const link = getNotificationLink(notification)
        if (link) {
            navigate(link)
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="notifications-page">
            <div className="notifications-container">
                <div className="notifications-header">
                    <div className="header-left">
                        <h1>{language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications'}</h1>
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount} {language === 'ta' ? 'புதியது' : 'new'}</span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button className="mark-all-read-btn" onClick={markAllRead}>
                            {language === 'ta' ? 'அனைத்தும் படிக்கப்பட்டது என்று குறி' : 'Mark all as read'}
                        </button>
                    )}
                </div>

                <div className="notifications-list">
                    {loading ? (
                        <div className="notifications-loading">
                            <div className="spinner"></div>
                            <p>{language === 'ta' ? 'ஏற்றுகிறது...' : 'Loading notifications...'}</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="notifications-empty">
                            <span className="empty-icon">📭</span>
                            <h2>{language === 'ta' ? 'அறிவிப்புகள் இல்லை' : 'No notifications yet'}</h2>
                            <p>{language === 'ta'
                                ? 'உங்கள் அறிவிப்புகள் இங்கே தோன்றும்'
                                : 'Your notifications will appear here when someone applies to your jobs or you receive updates.'}</p>
                            <Link to="/jobs" className="browse-jobs-btn">
                                {language === 'ta' ? 'வேலைகளை பாருங்கள்' : 'Browse Jobs'}
                            </Link>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification._id}
                                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-icon">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <h3 className="notification-title">{notification.title}</h3>
                                    <p className="notification-message">{notification.message}</p>
                                    <span className="notification-time">{formatTime(notification.createdAt)}</span>
                                </div>
                                {!notification.isRead && <div className="unread-indicator"></div>}
                                {getNotificationLink(notification) && (
                                    <div className="notification-arrow">→</div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Notifications
