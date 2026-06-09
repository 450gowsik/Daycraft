import { useLanguage } from '../../context/LanguageContext.jsx'
import './WorkerCard.css'

function WorkerCard({ worker, onHire }) {
    const { t, language } = useLanguage()

    // Handle skills - safely handle string or object format
    const skills = worker.skills || []
    const skillsList = skills.map(s => {
        if (typeof s === 'string') return s
        return language === 'ta' && s.ta ? s.ta : s.en
    })
    const visibleSkills = skillsList.slice(0, 2)
    const moreCount = skillsList.length - 2

    return (
        <div className="card worker-card">
            <div className="worker-card-header">
                <div className="worker-avatar-container">
                    {worker.avatar ? (
                        <img src={worker.avatar} alt={worker.name} className="worker-avatar-img" />
                    ) : (
                        <div className="worker-avatar-initials">
                            {worker.name?.charAt(0) || '?'}
                        </div>
                    )}
                    {worker.idVerified && (
                        <div className="worker-verified" title="Verified by DayCraft">✓</div>
                    )}
                </div>
                <div className="worker-header-info">
                    <h3 className="worker-name">{worker.name}</h3>
                    <div className="worker-rating">
                        <span className="star-text">★</span>
                        <span className="rating-value">{worker.rating || '0.0'}</span>
                        <span className="rating-count">({worker.completedJobs || 0})</span>
                        {worker.idVerified && (
                            <span className="verified-label">✔ Verified</span>
                        )}
                    </div>
                    {/* Worker Availability Badge */}
                    <div className="worker-availability-row">
                        <span className={`availability-badge availability-${worker.availability || 'available'}`}>
                            {worker.availability === 'available' && (language === 'ta' ? 'கிடைக்கிறது' : 'Available')}
                            {worker.availability === 'busy' && (language === 'ta' ? 'பிஸி' : 'Busy')}
                            {worker.availability === 'unavailable' && (language === 'ta' ? 'கிடைக்கவில்லை' : 'Unavailable')}
                            {!worker.availability && (language === 'ta' ? 'கிடைக்கிறது' : 'Available')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="worker-body">
                <div className="worker-skills-tags">
                    {visibleSkills.map((skill, idx) => (
                        <span key={idx} className="skill-chip">{skill}</span>
                    ))}
                    {moreCount > 0 && (
                        <span className="skill-chip more">+{moreCount} more</span>
                    )}
                </div>
                <div className="worker-meta-grid">
                    <div className="worker-meta-item">
                        <span className="meta-label">{t('workers.experience')}</span>
                        <span className="meta-value">{worker.experience || '0'} {language === 'ta' ? 'ஆண்டுகள்' : 'yrs'}</span>
                    </div>
                    <div className="worker-meta-item">
                        <span className="meta-label">{language === 'ta' ? 'இடம்' : 'Location'}</span>
                        <span className="meta-value">{worker.location || 'Local'}</span>
                    </div>
                </div>
            </div>

            <div className="worker-card-footer">
                <div className="worker-rate">
                    <span className="rate-amount">₹{worker.dailyRate || 0}</span>
                    <span className="rate-label">/{language === 'ta' ? 'நாள்' : 'day'}</span>
                </div>
                <div className="worker-actions">
                    <button className="btn btn-primary btn-request" onClick={onHire}>
                        {language === 'ta' ? 'தொழிலாளரை கோரு' : 'Request Worker'} →
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WorkerCard

