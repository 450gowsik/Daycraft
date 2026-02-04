import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { jobService } from '../../services/jobService.js'
import { CategoryIcon } from './CategoryIcon.jsx'
import { FaMapMarkerAlt, FaStar, FaBolt, FaChevronRight } from 'react-icons/fa'
import './BestForYouSection.css'

function BestForYouSection() {
    const navigate = useNavigate()
    const { language } = useLanguage()
    const { isAuthenticated, user } = useAuth()

    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState('')

    // Text translations
    const t = {
        title: language === 'ta' ? '🎯 உங்களுக்கான சிறந்தவை' : '🎯 Best for You',
        subtitle: language === 'ta' ? 'AI பரிந்துரைகள்' : 'AI Recommendations',
        matchScore: language === 'ta' ? 'பொருத்தம்' : 'Match',
        viewAll: language === 'ta' ? 'அனைத்தையும் பார்' : 'View All',
        perDay: language === 'ta' ? '/நாள்' : '/day',
        apply: language === 'ta' ? 'விண்ணப்பி' : 'Apply',
        loginToSee: language === 'ta'
            ? 'உள்நுழைந்து தனிப்பயனாக்கப்பட்ட பரிந்துரைகளைப் பாருங்கள்'
            : 'Login to see personalized recommendations',
        noRecommendations: language === 'ta'
            ? 'இன்னும் பரிந்துரைகள் இல்லை. வேலைகளுக்கு விண்ணப்பிக்கத் தொடங்குங்கள்!'
            : 'No recommendations yet. Start applying to jobs!'
    }

    useEffect(() => {
        if (isAuthenticated && user?.role === 'worker') {
            fetchRecommendations()
        } else {
            setLoading(false)
        }
    }, [isAuthenticated, user])
    //...
    // Don't render for non-authenticated or non-workers
    if (!isAuthenticated || user?.role !== 'worker') {
        return null
    }

    // Loading state
    if (loading) {
        return (
            <section className="best-for-you-section">
                <div className="section-header">
                    <h2 className="section-title">{t.title}</h2>
                </div>
                <div className="recommendations-scroll">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="recommendation-card skeleton">
                            <div className="skeleton-badge"></div>
                            <div className="skeleton-title"></div>
                            <div className="skeleton-meta"></div>
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    // No recommendations
    if (recommendations.length === 0) {
        return null // Don't show section if no recommendations
    }

    return (
        <section className="best-for-you-section">
            <div className="section-header">
                <div className="title-group">
                    <h2 className="section-title">{t.title}</h2>
                    <span className="section-subtitle">{message || t.subtitle}</span>
                </div>
                <button className="view-all-btn" onClick={() => navigate('/jobs')}>
                    {t.viewAll} <FaChevronRight size={12} />
                </button>
            </div>

            <div className="recommendations-scroll">
                {recommendations.map((job, index) => {
                    const jobId = job._id || job.id
                    const title = job.title?.[language] || job.title?.en || job.title || 'Job'

                    return (
                        <div
                            key={jobId}
                            className="recommendation-card"
                            onClick={() => handleCardClick(jobId)}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Match Score Badge */}
                            <div className={`match-badge ${job.matchScore >= 80 ? 'excellent' : job.matchScore >= 60 ? 'great' : 'good'}`}>
                                <FaStar size={10} />
                                <span>{job.matchScore}%</span>
                            </div>

                            {/* Category */}
                            <div className="card-category">
                                <CategoryIcon category={job.category} size={16} />
                                <span>{job.category}</span>
                            </div>

                            {/* Title */}
                            <h3 className="card-title">{title}</h3>

                            {/* Wage */}
                            <div className="card-wage">
                                ₹{job.wage?.toLocaleString() || '--'}{t.perDay}
                            </div>

                            {/* Location */}
                            <div className="card-location">
                                <FaMapMarkerAlt size={12} />
                                <span>{job.location}</span>
                            </div>

                            {/* Why Recommended */}
                            {job.whyRecommended && job.whyRecommended.length > 0 && (
                                <div className="why-recommended">
                                    {job.whyRecommended.map((reason, i) => (
                                        <span key={i} className="reason-tag">✓ {reason}</span>
                                    ))}
                                </div>
                            )}

                            {/* Quick Apply Button */}
                            <button
                                className={`quick-apply-btn ${job.hasApplied ? 'applied' : ''}`}
                                onClick={(e) => handleQuickApply(e, jobId)}
                                disabled={job.hasApplied}
                            >
                                <FaBolt size={12} />
                                {job.hasApplied ? (language === 'ta' ? 'விண்ணப்பிக்கப்பட்டது' : 'Applied') : t.apply}
                            </button>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default BestForYouSection
