import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import './VerificationBanner.css'

/**
 * VerificationBanner - Progressive verification UI component
 * 
 * Shows non-blocking banners prompting users to verify phone/email
 * Uses professional UX copy following big-startup patterns
 */
function VerificationBanner() {
    const { user, needsPhoneVerification, needsEmailVerification } = useAuth()
    const { language } = useLanguage()
    const [dismissed, setDismissed] = useState({
        phone: false,
        email: false
    })

    // Don't show if no user or all dismissed
    if (!user) return null

    const banners = []

    // Phone verification banner (critical for workers)
    if (needsPhoneVerification && !dismissed.phone) {
        banners.push({
            id: 'phone',
            icon: '📱',
            type: 'warning',
            message: language === 'ta'
                ? 'வேலை விண்ணப்பங்களை திறக்க உங்கள் தொலைபேசியை சரிபார்க்கவும்'
                : 'Verify your phone to unlock job applications',
            action: language === 'ta' ? 'சரிபார்க்கவும்' : 'Verify Now',
            actionUrl: '/profile?verify=phone'
        })
    }

    // Email verification banner (for updates)
    if (needsEmailVerification && !dismissed.email && user.email) {
        banners.push({
            id: 'email',
            icon: '✉️',
            type: 'info',
            message: language === 'ta'
                ? 'வேலை புதுப்பிப்புகளைப் பெற உங்கள் மின்னஞ்சலை சரிபார்க்கவும்'
                : 'Verify your email to receive job updates',
            action: language === 'ta' ? 'சரிபார்க்கவும்' : 'Verify',
            actionUrl: '/profile?verify=email'
        })
    }

    if (banners.length === 0) return null

    const handleDismiss = (id) => {
        setDismissed(prev => ({ ...prev, [id]: true }))
    }

    return (
        <div className="verification-banners">
            {banners.map(banner => (
                <div key={banner.id} className={`verification-banner ${banner.type}`}>
                    <div className="banner-content">
                        <span className="banner-icon">{banner.icon}</span>
                        <span className="banner-message">{banner.message}</span>
                    </div>
                    <div className="banner-actions">
                        <a href={banner.actionUrl} className="banner-cta">
                            {banner.action}
                        </a>
                        <button
                            className="banner-dismiss"
                            onClick={() => handleDismiss(banner.id)}
                            aria-label="Dismiss"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default VerificationBanner
