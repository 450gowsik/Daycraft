import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'
import NotificationPanel from '../common/NotificationPanel'
import logo from '../../assets/images/logo.png'
import './Navbar.css'

function Navbar() {
    const { t, language, toggleLanguage } = useLanguage()
    const { user, isAuthenticated, logout, isEmployer, isAdmin } = useAuth()
    const navigate = useNavigate()
    const { unreadCount, fetchNotifications } = useNotifications()
    const [menuOpen, setMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    const toggleNotif = () => {
        setNotifOpen(!notifOpen)
        setDropdownOpen(false)
        if (!notifOpen) fetchNotifications()
    }

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true)
            } else {
                setScrolled(false)
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const toggleMenu = () => setMenuOpen(!menuOpen)
    const closeAllMenus = () => {
        setMenuOpen(false)
        setDropdownOpen(false)
        setNotifOpen(false)
    }

    const accountLinks = [
        {
            to: '/dashboard',
            label: t('nav.dashboard'),
            icon: '📊'
        },
        {
            to: '/profile',
            label: language === 'en' ? 'Profile' : 'சுயவிவரம்',
            icon: '👤'
        },
        {
            to: '/wallet',
            label: language === 'en' ? 'My Wallet' : 'எனது பணப்பை',
            icon: '💰'
        }
    ]

    if (isEmployer) {
        accountLinks.push({
            to: '/post-job',
            label: language === 'en' ? 'Post Job' : 'வேலை இடுக',
            icon: '➕'
        })
    }

    if (isAdmin) {
        accountLinks.push({
            to: '/admin',
            label: 'Admin Panel',
            icon: '⚙️'
        })
    }

    const handleLogout = async () => {
        closeAllMenus()
        await logout()
    }

    const handleAccountNavigate = (path) => {
        closeAllMenus()
        navigate(path)
    }

    return (
        <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
            <div className="container navbar-container">
                <Link to="/" className="navbar-brand" onClick={closeAllMenus}>
                    <img src={logo} alt="DayCraft" className="brand-logo" />
                </Link>

                <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
                    <NavLink to="/" className="nav-link" onClick={closeAllMenus}>
                        {t('nav.home')}
                    </NavLink>
                    <NavLink to="/jobs" className="nav-link" onClick={closeAllMenus}>
                        {t('nav.jobs')}
                    </NavLink>
                    <NavLink to="/workers" className="nav-link" onClick={closeAllMenus}>
                        {t('nav.workers')}
                    </NavLink>
                    {isAuthenticated && (
                        <NavLink to="/dashboard" className="nav-link" onClick={closeAllMenus}>
                            {t('nav.dashboard')}
                        </NavLink>
                    )}

                    {isAuthenticated && (
                        <div className="mobile-account-card hide-desktop">
                            {accountLinks.slice(0, 3).map((item) => (
                                <button
                                    key={item.to}
                                    type="button"
                                    className="mobile-account-link"
                                    onClick={() => handleAccountNavigate(item.to)}
                                >
                                    <span className="mobile-account-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                            <button className="mobile-account-link mobile-logout-btn" onClick={handleLogout}>
                                <span className="mobile-account-icon">🚪</span>
                                <span>{language === 'en' ? 'Logout' : 'வெளியேறு'}</span>
                            </button>
                        </div>
                    )}

                    {!isAuthenticated && (
                        <div className="mobile-auth-actions hide-desktop">
                            <Link to="/login" className="btn btn-secondary btn-sm" onClick={closeAllMenus}>
                                {t('nav.login')}
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm" onClick={closeAllMenus}>
                                {t('nav.register')}
                            </Link>
                        </div>
                    )}
                </div>

                <div className="navbar-actions">
                    <button
                        className="lang-toggle"
                        onClick={toggleLanguage}
                        title={language === 'en' ? 'தமிழ்' : 'English'}
                    >
                        <span className="lang-icon">🌐</span>
                        <span className="lang-text">{language === 'en' ? 'தமிழ்' : 'EN'}</span>
                    </button>

                    {isAuthenticated && (
                        <div className="notification-menu">
                            <button
                                className={`notif-toggle ${unreadCount > 0 ? 'has-unread' : ''}`}
                                onClick={toggleNotif}
                                title={language === 'en' ? 'Notifications' : 'அறிவிப்புகள்'}
                            >
                                <span className="notif-icon">🔔</span>
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>
                            {notifOpen && (
                                <NotificationPanel onClose={() => setNotifOpen(false)} />
                            )}
                        </div>
                    )}

                    {isAuthenticated ? (
                        <div className="user-menu">
                            <button
                                className="user-menu-btn"
                                onClick={() => {
                                    setDropdownOpen(!dropdownOpen)
                                    setNotifOpen(false)
                                }}
                            >
                                <span className="user-avatar">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} />
                                    ) : (
                                        user?.name?.charAt(0) || '?'
                                    )}
                                </span>
                                <span className="user-name hide-mobile">{user?.name}</span>
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            {dropdownOpen && (
                                <div className="user-dropdown">
                                    {accountLinks.map((item) => (
                                        <button
                                            key={item.to}
                                            type="button"
                                            className="dropdown-item"
                                            onClick={() => handleAccountNavigate(item.to)}
                                        >
                                            {item.icon} {item.label}
                                        </button>
                                    ))}
                                    <hr className="dropdown-divider" />
                                    <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                        🚪 {language === 'en' ? 'Logout' : 'வெளியேறு'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-secondary btn-sm hide-mobile">
                                {t('nav.login')}
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm hide-mobile">
                                {t('nav.register')}
                            </Link>
                        </>
                    )}

                    <button className="menu-toggle hide-desktop" onClick={toggleMenu}>
                        <span className={`hamburger ${menuOpen ? 'active' : ''}`}></span>
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
