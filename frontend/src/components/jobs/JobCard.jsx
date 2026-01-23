import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import analytics from '../../utils/analytics'
import { JOB_CATEGORIES, ALL_SKILLS } from '../../constants/categories.js'
import { CategoryIcon, StatusIcon } from './CategoryIcon.jsx'
import { FaMapMarkerAlt, FaClock, FaFire } from 'react-icons/fa'
import './JobCard.css'

function JobCard({ job }) {
    const navigate = useNavigate()
    const { language } = useLanguage()
    const { isAuthenticated, user, needsPhoneVerification } = useAuth()

    // Handle both id (demo) and _id (MongoDB)
    const jobId = job.id || job._id

    const [isApplying, setIsApplying] = useState(false)
    const [hasApplied, setHasApplied] = useState(false)

    // Check if already applied
    useEffect(() => {
        if (jobId) {
            const applied = localStorage.getItem(`applied_${jobId}`)
            setHasApplied(!!applied)
        }
    }, [jobId])

    // Get localized text
    const title = job.title?.[language] || job.title?.en || job.title || 'Untitled'

    // Format wage
    const formatWage = (wage) => {
        if (!wage && wage !== 0) return '₹--'
        return `₹${wage.toLocaleString()}`
    }

    // Get relative time
    const getRelativeTime = (dateStr) => {
        if (!dateStr) return language === 'ta' ? 'இன்று' : 'Today'
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return language === 'ta' ? 'இன்று' : 'Today'
        if (diffDays === 1) return language === 'ta' ? 'நேற்று' : 'Yesterday'
        if (diffDays < 7) return language === 'ta' ? `${diffDays} நாட்கள் முன்` : `${diffDays} days ago`
        return language === 'ta' ? `${Math.floor(diffDays / 7)} வாரங்கள் முன்` : `${Math.floor(diffDays / 7)} weeks ago`
    }

    // Resolve Category and Role
    // Try to find category by ID or Label (case-insensitive)
    const categoryObj = JOB_CATEGORIES.find(c =>
        c.id === job.category ||
        c.label.toLowerCase() === job.category?.toLowerCase()
    ) || {}

    const categoryLabel = language === 'ta'
        ? (categoryObj.ta || job.category || 'General')
        : (categoryObj.label || job.category || 'General').replace('-', ' ')

    // Resolve Role Label
    // If job.role is an ID, find it in ALL_SKILLS. Else use as is.
    const roleObj = ALL_SKILLS.find(s => s.id === job.role)
    const roleLabel = roleObj
        ? (language === 'ta' ? roleObj.ta : roleObj.label)
        : (job.role ? job.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '')

    // Construct the Display Tag: "Electrician • Electrical"
    const displayTag = roleLabel ? `${roleLabel} • ${categoryLabel}` : categoryLabel

    // Text translations
    const t = {
        nearYou: language === 'ta' ? 'அருகில்' : 'Near you',
        perDay: language === 'ta' ? '/நாள்' : '/day',
        urgent: language === 'ta' ? 'அவசரம்' : 'URGENT',
        apply: language === 'ta' ? 'விண்ணப்பி' : 'Apply',
        applied: language === 'ta' ? 'விண்ணப்பிக்கப்பட்டது' : 'Applied',
        applying: language === 'ta' ? '...' : '...',
        viewDetails: language === 'ta' ? 'விவரங்கள்' : 'Details'
    }

    // Handle Details click
    const handleDetailsClick = (e) => {
        e.stopPropagation()
        navigate(`/jobs/${jobId}`)
    }

    // Handle Apply click
    const handleApplyClick = async (e) => {
        e.stopPropagation()

        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/jobs/${jobId}` } })
            return
        }

        // Restriction: Worker must have verified phone
        if (needsPhoneVerification) {
            alert(language === 'ta'
                ? 'விண்ணப்பிக்க உங்கள் தொலைபேசி எண்ணை சரிபார்க்கவும்.'
                : 'Please verify your phone number to apply for jobs.')
            return
        }

        if (hasApplied || isApplying) return

        setIsApplying(true)
        analytics.trackAction('apply_started', { jobId, category: job.category })

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800))

            // Store in localStorage for demo
            localStorage.setItem(`applied_${jobId}`, 'true')
            setHasApplied(true)
            analytics.trackAction('apply_success', { jobId })
        } catch (error) {
            console.error('Apply error:', error)
            analytics.trackAction('apply_failed', { jobId, error: error.message })
        } finally {
            setIsApplying(false)
        }
    }

    // Handle card click (go to details)
    const handleCardClick = () => {
        navigate(`/jobs/${jobId}`)
    }

    return (
        <div className="job-card-mobile" onClick={handleCardClick}>
            {/* Header - Category & Urgency */}
            <div className="card-header">
                <span className="category-badge">
                    <span className="badge-icon">
                        <CategoryIcon title={job.title} category={job.category} size={18} />
                    </span>
                    <span className="badge-text">{displayTag}</span>
                </span>
                <div className="status-badges">
                    {/* Availability Status Badge */}
                    <span className={`status-badge status-${job.status || 'open'}`}>
                        <StatusIcon status={job.status || 'open'} size={12} />
                        <span style={{ marginLeft: '4px' }}>
                            {job.status === 'open' && (language === 'ta' ? 'திறந்த' : 'Open')}
                            {job.status === 'in-progress' && (language === 'ta' ? 'நடப்பில்' : 'In Progress')}
                            {job.status === 'completed' && (language === 'ta' ? 'முடிந்தது' : 'Completed')}
                            {job.status === 'cancelled' && (language === 'ta' ? 'ரத்து' : 'Cancelled')}
                            {!job.status && (language === 'ta' ? 'திறந்த' : 'Open')}
                        </span>
                    </span>
                    {job.urgent && (
                        <span className="urgent-badge">
                            <FaFire size={12} color="#ef4444" style={{ marginRight: '4px' }} />
                            {t.urgent}
                        </span>
                    )}
                </div>
            </div>

            {/* Title - Primary Emphasis */}
            <h3 className="job-title">{title}</h3>

            {/* Wage & Duration */}
            <div className="job-pay">
                <span className="wage">{formatWage(job.wage)}</span>
                <span className="wage-period">{t.perDay}</span>
                {job.duration && (
                    <>
                        <span className="separator">·</span>
                        <span className="duration">{job.duration}</span>
                    </>
                )}
            </div>

            {/* Location */}
            <div className="job-location">
                <FaMapMarkerAlt size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                <span className="location-text">
                    {t.nearYou} · {job.location}
                </span>
            </div>

            {/* Footer - Time & Actions */}
            <div className="card-footer">
                <span className="posted-time">
                    <FaClock size={12} color="#94a3b8" style={{ marginRight: '4px' }} />
                    {getRelativeTime(job.postedAt)}
                </span>
                <div className="card-actions">
                    <button className="btn-details" onClick={handleDetailsClick}>
                        {t.viewDetails}
                    </button>
                    <button
                        className={`btn-apply ${hasApplied ? 'applied' : ''} ${isApplying ? 'loading' : ''}`}
                        onClick={handleApplyClick}
                        disabled={hasApplied || isApplying || needsPhoneVerification}
                    >
                        {isApplying ? t.applying : hasApplied ? t.applied : t.apply}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default JobCard
