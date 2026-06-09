import { useLanguage } from '../../context/LanguageContext.jsx'
import './WorkerDetailsModal.css'

function WorkerDetailsModal({ worker, isOpen, onClose, onRequest }) {
    const { language } = useLanguage()

    if (!isOpen || !worker) return null

    // Handle skills display (top 4 only)
    const skills = worker.skills || []
    const displaySkills = skills.slice(0, 4).map(s => {
        if (typeof s === 'string') return s
        return language === 'ta' && s.ta ? s.ta : s.en
    })

    // Verification badges with labels and tooltips
    const verifications = [
        {
            key: 'phone',
            icon: 'PH',
            label: language === 'ta' ? 'மொபைல்' : 'Mobile',
            tooltip: language === 'ta' ? 'DayCraft-ல் சரிபார்க்கப்பட்டது' : 'Verified by DayCraft',
            verified: worker.phoneVerified
        },
        {
            key: 'id',
            icon: 'ID',
            label: language === 'ta' ? 'ஐடி' : 'ID',
            tooltip: language === 'ta' ? 'அரசாங்க ஐடி சரிபார்க்கப்பட்டது' : 'Government ID Verified',
            verified: worker.idVerified
        },
        {
            key: 'location',
            icon: 'LO',
            label: language === 'ta' ? 'இடம்' : 'Location',
            tooltip: language === 'ta' ? 'முகவரி சரிபார்க்கப்பட்டது' : 'Address Verified',
            verified: worker.locationVerified
        },
    ]

    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            onClose()
        }
    }

    const handleRequest = () => {
        if (onRequest) {
            onRequest(worker)
        }
        onClose()
    }

    // Calculate days since last job (mock for now)
    const daysSinceLastJob = worker.completedJobs > 0 ? Math.floor(Math.random() * 5) + 1 : null

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="worker-details-modal">
                {/* Close Button */}
                <button className="modal-close" onClick={onClose}>✕</button>

                {/* ===== PREMIUM HEADER ===== */}
                <div className="modal-header">
                    <div className="header-content">
                        <div className="modal-avatar-container">
                            <div className="avatar-ring"></div>
                            {worker.avatar ? (
                                <img src={worker.avatar} alt={worker.name} className="modal-avatar" />
                            ) : (
                                <div className="modal-avatar modal-avatar-initials">
                                    {worker.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        <div className="modal-header-info">
                            <h2 className="modal-name">{worker.name}</h2>
                            <div className="trust-metrics">
                                <span className="star-text">★</span>
                                <span>{worker.rating || '0.0'}</span>
                                <span className="divider"></span>
                                <span>{worker.completedJobs || 0} {language === 'ta' ? 'வேலைகள்' : 'jobs'}</span>
                                {worker.idVerified && (
                                    <>
                                        <span className="divider"></span>
                                        <span className="verified-text">✓ {language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== MODAL BODY ===== */}
                <div className="modal-body">
                    {/* Availability - Prominent */}
                    <div className={`availability-status ${worker.availability || 'available'}`}>
                        <span className="status-dot"></span>
                        {worker.availability === 'busy' ? (language === 'ta' ? 'தற்போது பிஸி' : 'Currently Busy') :
                            worker.availability === 'unavailable' ? (language === 'ta' ? 'கிடைக்காது' : 'Not Available') :
                                (language === 'ta' ? '✓ இன்று கிடைக்கும்' : '✓ Available Today')}
                    </div>

                    {/* Skills - With hover glow */}
                    {displaySkills.length > 0 && (
                        <div className="modal-skills">
                            {displaySkills.map((skill, idx) => (
                                <span key={idx} className="skill-tag">{skill}</span>
                            ))}
                        </div>
                    )}

                    {/* Info Grid - Clean hierarchy */}
                    <div className="modal-info-grid">
                        <div className="info-item">
                            <span className="info-value rate">₹{worker.dailyRate || 0}</span>
                            <span className="info-label">{language === 'ta' ? 'தினசரி' : 'Per Day'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-value">{worker.location?.split(',')[0] || 'Local'}</span>
                            <span className="info-label">{language === 'ta' ? 'இடம்' : 'Location'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-value">{worker.experience || '0'} {language === 'ta' ? 'ஆ.' : 'yrs'}</span>
                            <span className="info-label">{language === 'ta' ? 'அனுபவம்' : 'Experience'}</span>
                        </div>
                    </div>

                    {/* Verification Badges - Authoritative with tooltips */}
                    <div className="modal-verifications">
                        {verifications.map(v => (
                            <div
                                key={v.key}
                                className={`verify-badge ${v.verified ? 'verified' : 'unverified'}`}
                                data-tooltip={v.verified ? v.tooltip : (language === 'ta' ? 'சரிபார்க்கப்படவில்லை' : 'Not verified')}
                            >
                                <span className="icon">{v.icon}</span>
                                <span>{v.verified ? '✓' : '○'} {v.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pro Section - Recent Work */}
                    {worker.completedJobs > 0 && daysSinceLastJob && (
                        <div className="recent-work">
                            <div className="recent-work-icon-badge">TW</div>
                            <div className="recent-work-text">
                                <strong>{language === 'ta' ? 'சமீபத்திய பணி' : 'Recent Activity'}</strong>
                                <span>
                                    {language === 'ta'
                                        ? `கடைசி வேலை: ${daysSinceLastJob} நாட்கள் முன்`
                                        : `Last job completed: ${daysSinceLastJob} days ago`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* CTA Button - Serious Action */}
                    <button className="request-btn" onClick={handleRequest}>
                        {language === 'ta' ? 'பணி கொரிக்கை அனுப்பு' : 'Send Work Request'}
                    </button>

                    {/* Helper text - Trust builder */}
                    <p className="cta-helper">
                        {language === 'ta'
                            ? <>தொழிலாளருக்கு அறிவிக்கப்படும். <strong>ஏற்றுக்கொள்ளும் வரை கட்டணம் இல்லை.</strong></>
                            : <>Worker will be notified. <strong>No charges until accepted.</strong></>}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default WorkerDetailsModal
