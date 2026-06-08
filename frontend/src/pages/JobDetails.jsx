import { useState, useEffect, Component } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import demoJobs from '../data/demoJobs.json'
import recommendationService from '../services/recommendationService'
import paymentService from '../services/paymentService'
import { buildApiUrl } from '../services/apiConfig'
import PaymentButton from '../components/payment/PaymentButton'
import { toast } from 'react-hot-toast'
import './JobDetails.css'

// Error Boundary to catch rendering errors
class JobDetailsErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('JobDetails Error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="job-details-page">
                    <div className="error-state" style={{ padding: '40px', textAlign: 'center' }}>
                        <h2>Something went wrong</h2>
                        <p style={{ color: '#666' }}>We couldn't load this job. Please try again.</p>
                        <button
                            onClick={() => window.location.href = '/jobs'}
                            style={{
                                marginTop: '20px',
                                padding: '12px 24px',
                                background: '#4F46E5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            ← Back to Jobs
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

function JobDetails() {
    const { jobId } = useParams()
    const navigate = useNavigate()
    const { language } = useLanguage()
    const { user, isAuthenticated } = useAuth()

    const [job, setJob] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isApplying, setIsApplying] = useState(false)
    const [hasApplied, setHasApplied] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [topWorkers, setTopWorkers] = useState([])
    const [loadingWorkers, setLoadingWorkers] = useState(false)
    const [payment, setPayment] = useState(null)
    const [releasing, setReleasing] = useState(false)

    // Fetch job details
    useEffect(() => {
        const fetchJob = async () => {
            setIsLoading(true)
            try {
                // First try to fetch from API
                const response = await fetch(buildApiUrl(`/jobs/${jobId}`))
                const data = await response.json()

                if (data.success && data.job) {
                    const jobData = data.job
                    // Normalize employer field
                    let employer = { name: 'Employer', phone: '+91 98765 43210' }
                    if (jobData.employer) {
                        if (typeof jobData.employer === 'object' && jobData.employer.name) {
                            employer = jobData.employer
                        } else if (typeof jobData.employer === 'string') {
                            employer = { name: jobData.employer, phone: '+91 98765 43210' }
                        }
                    }

                    // Add mock defaults for missing fields
                    const jobWithDefaults = {
                        ...jobData,
                        employer,
                        startTime: jobData.startTime || '7:00 AM',
                        endTime: jobData.endTime || '5:00 PM',
                        requiredWorkers: jobData.requiredWorkers || 1,
                        paymentMethod: jobData.paymentMethod || 'Daily cash payment',
                        views: jobData.views || Math.floor(Math.random() * 200) + 50,
                        createdAt: jobData.createdAt || new Date().toISOString()
                    }
                    setJob(jobWithDefaults)
                } else {
                    // Fallback to demo data
                    const foundJob = demoJobs.find(j => j.id === jobId || j._id === jobId)
                    if (foundJob) {
                        const jobWithDefaults = {
                            ...foundJob,
                            employer: foundJob.employer && typeof foundJob.employer === 'object'
                                ? foundJob.employer
                                : { name: foundJob.employer || 'Employer', phone: '+91 98765 43210' },
                            startTime: foundJob.startTime || '7:00 AM',
                            endTime: foundJob.endTime || '5:00 PM',
                            requiredWorkers: foundJob.requiredWorkers || 1,
                            paymentMethod: foundJob.paymentMethod || 'Daily cash payment',
                            views: foundJob.views || Math.floor(Math.random() * 200) + 50,
                            createdAt: foundJob.createdAt || foundJob.postedAt || new Date().toISOString()
                        }
                        setJob(jobWithDefaults)
                    }
                }
            } catch (error) {
                console.error('Error fetching job:', error)
                // Fallback to demo data on error
                const foundJob = demoJobs.find(j => j.id === jobId || j._id === jobId)
                if (foundJob) {
                    setJob({
                        ...foundJob,
                        employer: foundJob.employer && typeof foundJob.employer === 'object'
                            ? foundJob.employer
                            : { name: foundJob.employer || 'Employer', phone: '+91 98765 43210' },
                        startTime: foundJob.startTime || '7:00 AM',
                        endTime: foundJob.endTime || '5:00 PM',
                        createdAt: foundJob.createdAt || foundJob.postedAt || new Date().toISOString()
                    })
                }
            } finally {
                setIsLoading(false)
            }
        }

        if (jobId) {
            fetchJob()
            if (isAuthenticated) fetchPaymentStatus()
        }
    }, [jobId, isAuthenticated])

    const fetchPaymentStatus = async () => {
        try {
            const data = await paymentService.getHistory();
            const relevantPayment = data.history.find(p => p.job?._id === jobId || p.job === jobId);
            if (relevantPayment) setPayment(relevantPayment);
        } catch (error) {
            console.error('Failed to fetch payment status:', error);
        }
    }

    // Check if already applied
    useEffect(() => {
        if (isAuthenticated && jobId) {
            // For demo, check localStorage
            const applied = localStorage.getItem(`applied_${jobId}`)
            setHasApplied(!!applied)
        }
    }, [isAuthenticated, jobId])

    const isOwner = user && job && (job.employer?._id === user?._id || job.employer === user?._id)

    useEffect(() => {
        if (isOwner && jobId) {
            fetchTopWorkers()
        }
    }, [isOwner, jobId])

    const fetchTopWorkers = async () => {
        setLoadingWorkers(true)
        try {
            const data = await recommendationService.getTopWorkers(jobId)
            if (data.success) {
                setTopWorkers(data.workers)
            }
        } catch (error) {
            console.error('Failed to fetch top workers:', error)
        } finally {
            setLoadingWorkers(false)
        }
    }

    // Handle apply
    const handleApply = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/jobs/${jobId}` } })
            return
        }

        setIsApplying(true)
        try {
            // For demo, simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Store in localStorage for demo
            localStorage.setItem(`applied_${jobId}`, 'true')

            setHasApplied(true)
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        } catch (error) {
            console.error('Apply error:', error)
        } finally {
            setIsApplying(false)
        }
    }

    const handleRelease = async () => {
        if (!payment) return;
        setReleasing(true);
        try {
            await paymentService.releaseFunds(payment._id);
            toast.success("Payment released to worker successfully!");
            fetchPaymentStatus();
            // Refresh user balance if needed (handled by Wallet page or global state)
        } catch (error) {
            toast.error(error);
        } finally {
            setReleasing(false);
        }
    }

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    // Get relative time
    const getRelativeTime = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const now = new Date()
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60))

        if (diffHours < 1) return language === 'ta' ? 'சற்றுமுன்' : 'Just now'
        if (diffHours < 24) return language === 'ta' ? `${diffHours} மணிநேரம் முன்` : `${diffHours} hours ago`
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays === 1) return language === 'ta' ? 'நேற்று' : 'Yesterday'
        return language === 'ta' ? `${diffDays} நாட்கள் முன்` : `${diffDays} days ago`
    }

    // Calculate working hours from start and end time
    const calculateHours = (startTime, endTime) => {
        if (!startTime || !endTime) return null
        try {
            // Parse time strings like "7:00 AM", "5:00 PM"
            const parseTime = (timeStr) => {
                const [time, period] = timeStr.split(' ')
                let [hours, minutes] = time.split(':').map(Number)
                if (period === 'PM' && hours !== 12) hours += 12
                if (period === 'AM' && hours === 12) hours = 0
                return hours + (minutes / 60)
            }
            const start = parseTime(startTime)
            const end = parseTime(endTime)
            const totalHours = end - start
            return totalHours > 0 ? totalHours : null
        } catch (e) {
            return null
        }
    }

    // Category icons
    const categoryIcons = {
        'construction': '🏗️', 'electrical': '⚡', 'plumbing': '🔧', 'painting': '🎨',
        'cleaning': '🧹', 'cooking': '👨‍🍳', 'driving': '🚗', 'gardening': '🌱',
        'security': '🛡️', 'carpentry': '🪚', 'other': '💼'
    }

    // Text translations
    const t = {
        loading: language === 'ta' ? 'ஏற்றுகிறது...' : 'Loading...',
        backToJobs: language === 'ta' ? 'வேலைகளுக்கு திரும்பு' : 'Back to Jobs',
        jobDetails: language === 'ta' ? 'வேலை விவரங்கள்' : 'Job Details',
        urgent: language === 'ta' ? 'அவசரம்' : 'URGENT',
        description: language === 'ta' ? 'விளக்கம்' : 'Description',
        payment: language === 'ta' ? 'கட்டணம்' : 'Payment',
        perDay: language === 'ta' ? '/நாள்' : '/day',
        duration: language === 'ta' ? 'காலம்' : 'Duration',
        timing: language === 'ta' ? 'நேரம்' : 'Work Timing',
        location: language === 'ta' ? 'இடம்' : 'Location',
        skills: language === 'ta' ? 'தேவையான திறன்கள்' : 'Required Skills',
        employer: language === 'ta' ? 'முதலாளி' : 'Employer',
        contact: language === 'ta' ? 'தொடர்பு' : 'Contact',
        postedAt: language === 'ta' ? 'பதிவிடப்பட்டது' : 'Posted',
        views: language === 'ta' ? 'பார்வைகள்' : 'views',
        workersNeeded: language === 'ta' ? 'தொழிலாளர்கள் தேவை' : 'Employees Needed',
        apply: language === 'ta' ? 'விண்ணப்பி' : 'Apply for this Job',
        applying: language === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Applying...',
        applied: language === 'ta' ? 'விண்ணப்பிக்கப்பட்டது ✓' : 'Applied ✓',
        loginToApply: language === 'ta' ? 'விண்ணப்பிக்க உள்நுழையவும்' : 'Login to Apply',
        successMessage: language === 'ta' ? 'விண்ணப்பம் வெற்றிகரமாக அனுப்பப்பட்டது!' : 'Application sent successfully!',
        callEmployer: language === 'ta' ? 'அழைக்கவும்' : 'Call',
        whatsapp: 'WhatsApp'
    }

    if (isLoading) {
        return (
            <div className="job-details-page">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>{t.loading}</p>
                </div>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="job-details-page">
                <div className="error-state">
                    <p>Job not found</p>
                    <button onClick={() => navigate('/jobs')}>Back to Jobs</button>
                </div>
            </div>
        )
    }

    // Safe extraction of text fields - prevent rendering objects
    const getTextValue = (field, lang) => {
        if (!field) return ''
        if (typeof field === 'string') return field
        if (typeof field === 'object') {
            return field[lang] || field.en || field.ta || ''
        }
        return String(field)
    }

    const title = getTextValue(job.title, language)
    const description = getTextValue(job.description, language)
    const categoryIcon = categoryIcons[job.category] || '💼'
    const categoryName = job.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General'

    return (
        <div className="job-details-page">
            {/* Success Toast */}
            {showSuccess && (
                <div className="success-toast">
                    <span className="toast-icon">✓</span>
                    <span>{t.successMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="details-header">
                <button className="back-btn" onClick={() => navigate('/jobs')}>
                    ← {t.backToJobs}
                </button>
                <button
                    className="view-applicants-btn"
                    onClick={() => navigate(`/jobs/${jobId}/applicants`)}
                    style={{
                        marginLeft: 'auto',
                        padding: '8px 16px',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    👥 {language === 'ta' ? 'விண்ணப்பதாரர்களை காண்க' : 'View Applicants'}
                </button>
            </div>

            {/* Job Card Header */}
            <div className="job-header-card">
                <div className="header-badges">
                    <span className="category-badge">
                        {categoryIcon} {categoryName}
                    </span>
                    {job.urgent && (
                        <span className="urgent-badge">🔥 {t.urgent}</span>
                    )}
                </div>
                <h1 className="job-title">{title}</h1>
                <div className="job-meta">
                    <span className="wage">₹{job.wage?.toLocaleString()}{t.perDay}</span>
                    <span className="separator">·</span>
                    <span className="duration">{job.duration}</span>
                </div>
                <div className="job-location">
                    <span className="location-icon">📍</span>
                    <span>{job.location}</span>
                </div>
                <div className="job-stats">
                    <span className="posted-time">⏱️ {getRelativeTime(job.createdAt)}</span>
                    <span className="views-count">👁️ {job.views} {t.views}</span>
                </div>
            </div>

            {/* Details Sections */}
            <div className="details-content">
                {/* Description */}
                <section className="detail-section">
                    <h2 className="section-title">{t.description}</h2>
                    <p className="description-text">{description}</p>
                </section>

                {/* Payment Details */}
                <section className="detail-section">
                    <h2 className="section-title">{t.payment}</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-icon">💰</span>
                            <div>
                                <span className="info-label">{language === 'ta' ? 'தினசரி ஊதியம்' : 'Daily Wage'}</span>
                                <span className="info-value highlight">₹{job.wage?.toLocaleString()}</span>
                            </div>
                        </div>
                        {job.paymentMethod && (
                            <div className="info-item">
                                <span className="info-icon">💳</span>
                                <div>
                                    <span className="info-label">{language === 'ta' ? 'கட்டண முறை' : 'Payment Method'}</span>
                                    <span className="info-value">{job.paymentMethod}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Work Details */}
                <section className="detail-section">
                    <h2 className="section-title">{t.timing}</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-icon">📅</span>
                            <div>
                                <span className="info-label">{t.duration}</span>
                                <span className="info-value">{job.duration}</span>
                            </div>
                        </div>
                        {job.startTime && (
                            <div className="info-item">
                                <span className="info-icon">🕐</span>
                                <div>
                                    <span className="info-label">{language === 'ta' ? 'நேரம்' : 'Time'}</span>
                                    <span className="info-value">{job.startTime} - {job.endTime}</span>
                                </div>
                            </div>
                        )}
                        {calculateHours(job.startTime, job.endTime) && (
                            <div className="info-item">
                                <span className="info-icon">⏱️</span>
                                <div>
                                    <span className="info-label">{language === 'ta' ? 'மொத்த மணிநேரம்' : 'Total Hours'}</span>
                                    <span className="info-value highlight">{calculateHours(job.startTime, job.endTime)} {language === 'ta' ? 'மணிநேரம்/நாள்' : 'hours/day'}</span>
                                </div>
                            </div>
                        )}
                        <div className="info-item">
                            <span className="info-icon">👷</span>
                            <div>
                                <span className="info-label">{t.workersNeeded}</span>
                                <span className="info-value">{job.requiredWorkers}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location */}
                <section className="detail-section">
                    <h2 className="section-title">{t.location}</h2>
                    <div className="location-display">
                        <span className="location-pin">📍</span>
                        <span className="location-text">{job.location}</span>
                    </div>
                    {/* Google Maps Embed */}
                    <div className="map-container" style={{
                        marginTop: '16px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid #e8e8e8'
                    }}>
                        <iframe
                            title="Job Location Map"
                            width="100%"
                            height="220"
                            style={{ border: 0, display: 'block' }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps?q=${encodeURIComponent(job.location)}&output=embed`}
                        />
                    </div>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '14px',
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.2s'
                        }}
                    >
                        🗺️ {language === 'ta' ? 'Google Maps இல் திற' : 'Open in Google Maps'}
                    </a>
                </section>

                {/* Skills Required */}
                {job.skills && job.skills.length > 0 && (
                    <section className="detail-section">
                        <h2 className="section-title">{t.skills}</h2>
                        <div className="skills-list">
                            {job.skills.map((skill, index) => {
                                const skillText = typeof skill === 'string' ? skill : (skill?.[language] || skill?.en || '')
                                return (
                                    <span key={index} className="skill-tag">
                                        {skillText}
                                    </span>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Suggested Workers (For Employers) */}
                {isOwner && topWorkers.length > 0 && (
                    <section className="detail-section suggested-workers">
                        <h2 className="section-title">✨ {language === 'ta' ? 'சிறந்த தொழிலாளர்கள்' : 'Top Matching Employees'}</h2>
                        <div className="workers-scroll custom-scrollbar">
                            {topWorkers.map(worker => (
                                <div key={worker._id} className="worker-rec-card">
                                    <div className="worker-rec-header">
                                        <div className="worker-rec-avatar">
                                            {worker.name?.charAt(0)}
                                        </div>
                                        <div className="worker-rec-info">
                                            <h4>{worker.name}</h4>
                                            <div className="worker-rec-rating">⭐ {worker.rating}</div>
                                        </div>
                                    </div>
                                    <div className="worker-rec-stats">
                                        <span>📍 {worker.location}</span>
                                        <span>💼 {worker.completedJobs} {language === 'ta' ? 'வேலைகள் முடிந்தது' : 'jobs completed'}</span>
                                    </div>
                                    <div className="match-tag">
                                        {worker.match?.total}% {language === 'ta' ? 'பொருத்தம்' : 'Match'}
                                    </div>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => navigate(`/workers/${worker._id}`)}
                                        style={{ marginTop: 'auto', width: '100%' }}
                                    >
                                        {language === 'ta' ? 'விவரம் காண்க' : 'View Profile'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}


                {/* Employer Info */}
                <section className="detail-section employer-section">
                    <h2 className="section-title">{language === 'ta' ? 'வேலை வழங்குபவர்' : 'Posted By'}</h2>
                    <div className="employer-card" style={{
                        background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid #e0e7ff'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="employer-avatar" style={{
                                width: '60px',
                                height: '60px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '24px',
                                fontWeight: '700',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                            }}>
                                {job.employer?.name?.charAt(0) || 'E'}
                            </div>
                            <div className="employer-info">
                                <span className="employer-name" style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#1a1a2e',
                                    display: 'block'
                                }}>{job.employer?.name}</span>
                                {job.employer?.companyName && (
                                    <span className="company-name" style={{
                                        fontSize: '14px',
                                        color: '#667eea',
                                        fontWeight: '500'
                                    }}>🏢 {job.employer.companyName}</span>
                                )}
                                <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '13px', color: '#666' }}>
                                    <span>⭐ 4.5 {language === 'ta' ? 'மதிப்பீடு' : 'Rating'}</span>
                                    <span>📋 {job.employer?.completedJobs || 5}+ {language === 'ta' ? 'வேலைகள் இடுகையிட்டவை' : 'Jobs Posted'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {isAuthenticated && hasApplied && job.employer?.phone && (
                        <div className="employer-actions" style={{
                            display: 'flex',
                            gap: '12px',
                            marginTop: '16px'
                        }}>
                            <a href={`tel:${job.employer.phone}`} className="btn-call" style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px',
                                background: '#10b981',
                                color: 'white',
                                borderRadius: '12px',
                                fontWeight: '600',
                                textDecoration: 'none'
                            }}>
                                📞 {t.callEmployer}
                            </a>
                            <a
                                href={`https://wa.me/${job.employer.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-whatsapp"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '14px',
                                    background: '#25d366',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                }}
                            >
                                💬 {t.whatsapp}
                            </a>
                        </div>
                    )}
                </section>
            </div>

            {/* Sticky Apply Bar / Payment Bar */}
            <div className="sticky-apply-bar">
                <div className="apply-info">
                    <span className="apply-wage">₹{job.wage?.toLocaleString()}{t.perDay}</span>
                    <span className="apply-duration">{job.duration}</span>
                </div>

                {isOwner ? (
                    <div className="owner-payment-actions" style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {job.status === 'hired' && !payment && (
                            <PaymentButton
                                jobId={jobId}
                                workerId={job.hiredWorker?._id || job.hiredWorker}
                                amount={job.wage}
                                onPaymentSuccess={() => fetchPaymentStatus()}
                            />
                        )}
                        {payment && payment.status === 'escrowed' && (
                            <button
                                className="btn btn-primary w-full py-3"
                                onClick={handleRelease}
                                disabled={releasing}
                            >
                                {releasing
                                    ? (language === 'ta' ? 'விடுவிக்கிறது...' : 'Releasing...')
                                    : (language === 'ta' ? 'கட்டணத்தை விடுவி' : 'Release Payment')}
                            </button>
                        )}
                        {payment && (
                            <div className={`p-3 rounded-lg text-center font-bold ${payment.status === 'released' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {payment.status === 'released'
                                    ? `✓ ${language === 'ta' ? 'கட்டணம் பெறப்பட்டது' : 'Payment Received'}`
                                    : `🛡️ ${language === 'ta' ? 'கட்டணம் எஸ்க்ரோவில் உள்ளது' : 'Payment in Escrow'}`}
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        className={`btn-apply-large ${hasApplied ? 'applied' : ''} ${isApplying ? 'loading' : ''} w-full`}
                        onClick={handleApply}
                        disabled={hasApplied || isApplying}
                    >
                        {isApplying ? t.applying : hasApplied ? t.applied : (isAuthenticated ? t.apply : t.loginToApply)}
                    </button>
                )}
            </div>
        </div>
    )
}

// Wrap with Error Boundary
function JobDetailsWithErrorBoundary() {
    return (
        <JobDetailsErrorBoundary>
            <JobDetails />
        </JobDetailsErrorBoundary>
    )
}

export default JobDetailsWithErrorBoundary
