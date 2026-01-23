import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import './Footer.css'

function Footer() {
    const { t } = useLanguage()
    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="brand-link">
                            <span className="brand-icon">🛠️</span>
                            <span className="brand-text">DayCraft</span>
                        </Link>
                        <p className="footer-description">
                            {t('footer.description')}
                        </p>
                    </div>

                    <div className="footer-links">
                        <h4>{t('footer.quickLinks')}</h4>
                        <ul>
                            <li><Link to="/">{t('nav.home')}</Link></li>
                            <li><Link to="/jobs">{t('nav.jobs')}</Link></li>
                            <li><Link to="/workers">{t('nav.workers')}</Link></li>
                            <li><Link to="/dashboard">{t('nav.dashboard')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h4>{t('footer.contact')}</h4>
                        <ul>
                            <li>
                                <span className="contact-icon">📧</span>
                                <span>{t('footer.email')}</span>
                            </li>
                            <li>
                                <span className="contact-icon">📞</span>
                                <span>{t('footer.phone')}</span>
                            </li>
                            <li>
                                <span className="contact-icon">📍</span>
                                <span>{t('footer.address')}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {currentYear} DayCraft. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
