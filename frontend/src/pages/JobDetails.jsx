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
import { getCategoryBadge } from '../constants/categories'
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

    // Category badge (abbr + color — no emoji)
    const categoryBadge = getCategoryBadge(job?.category)

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
        applied: language === 'ta' ? 'விண்ணப்பிக்கப்பட்டது' : 'Applied',
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
    const categoryName = job.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General'

    return (
        <div className="job-details-page">
            {/* Success Toast */}
            {showSuccess && (
                <div className="success-toast">
                    <span>{t.successMessage}</span>
                </div>
            )}

            {/* Top Breadcrumb Header */}
            <div className="job-breadcrumb-header">
                <div className="container">
                    <button className="breadcrumb-back-btn" onClick={() => navigate('/jobs')}>
                        ← {t.backToJobs}
                    </button>
                    {isOwner && (
                        <button
                            className="breadcrumb-action-btn"
                            onClick={() => navigate(`/jobs/${jobId}/applicants`)}
                        >
                            {language === 'ta' ? 'விண்ணப்பதாரர்களை காண்க' : 'View Applicants'}
                        </button>
                    )}
                </div>
            </div>

            <div className="job-page-layout container">
                {/* Left Column: Main Content */}
                <div className="job-main-content">
                    {/* Job Title & Meta */}
                    <div className="job-title-section">
                        <h1 className="job-title-main">{title}</h1>
                        <div className="job-badges-row">
                            <span
                                className="category-pill"
                                style={{ background: categoryBadge.color, color: 'white' }}
                            >
                                {categoryBadge.abbr} · {categoryName}
                            </span>
                            <span className="posted-pill">{getRelativeTime(job.createdAt)}</span>
                            <span className="location-pill">{job.location?.split(',')[0] || job.location}</span>
                            {job.urgent && <span className="urgent-pill">{t.urgent}</span>}
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* Description */}
                    <section className="job-section">
                        <h2 className="section-heading">{t.description}</h2>
                        <p className="job-description-body">{description}</p>
                    </section>

                    <hr className="divider" />

                    {/* Requirements / Details Grid */}
                    <section className="job-section">
                        <h2 className="section-heading">{language === 'ta' ? 'வேலை விவரங்கள்' : 'Job Details'}</h2>
                        <div className="job-details-grid">
                            <div className="detail-box">
                                <span className="detail-icon">📅</span>
                                <div className="detail-text">
                                    <span className="detail-label">{t.duration}</span>
                                    <span className="detail-value">{job.duration}</span>
                                </div>
                            </div>
                            {job.startTime && (
                                <div className="detail-box">
                                    <span className="detail-icon">🕐</span>
                                    <div className="detail-text">
                                        <span className="detail-label">{language === 'ta' ? 'நேரம்' : 'Timing'}</span>
                                        <span className="detail-value">{job.startTime} - {job.endTime}</span>
                                    </div>
                                </div>
                            )}
                            <div className="detail-box">
                                <span className="detail-icon">👷</span>
                                <div className="detail-text">
                                    <span className="detail-label">{t.workersNeeded}</span>
                                    <span className="detail-value">{job.requiredWorkers} {language === 'ta' ? 'நபர்கள்' : 'People'}</span>
                                </div>
                            </div>
                            {job.paymentMethod && (
                                <div className="detail-box">
                                    <span className="detail-icon">💳</span>
                                    <div className="detail-text">
                                        <span className="detail-label">{language === 'ta' ? 'கட்டண முறை' : 'Payment Type'}</span>
                                        <span className="detail-value">{job.paymentMethod}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {job.skills && job.skills.length > 0 && (
                        <>
                            <hr className="divider" />
                            <section className="job-section">
                                <h2 className="section-heading">{t.skills}</h2>
                                <div className="skills-pill-container">
                                    {job.skills.map((skill, index) => {
                                        const skillText = typeof skill === 'string' ? skill : (skill?.[language] || skill?.en || '')
                                        return <span key={index} className="skill-pill-modern">{skillText}</span>
                                    })}
                                </div>
                            </section>
                        </>
                    )}

                    <hr className="divider" />

                    {/* Map embedded cleanly */}
                    <section className="job-section">
                        <h2 className="section-heading">{t.location}</h2>
                        <p className="location-full-text">{job.location}</p>
                        <div className="map-embed-modern">
                            <iframe
                                title="Job Location Map"
                                width="100%"
                                height="280"
                                style={{ border: 0, display: 'block' }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(job.location)}&output=embed`}
                            />
                        </div>
                    </section>

                    {/* Suggested Workers (For Employers) */}
                    {isOwner && topWorkers.length > 0 && (
                        <>
                            <hr className="divider" />
                            <section className="job-section suggested-workers">
                                <h2 className="section-heading">{language === 'ta' ? 'சிறந்த தொழிலாளர்கள்' : 'Top Matching Employees'}</h2>
                                <div className="workers-scroll custom-scrollbar">
                                    {topWorkers.map(worker => (
                                        <div key={worker._id} className="worker-rec-card">
                                            <div className="worker-rec-header">
                                                <div className="worker-rec-avatar">
                                                    {worker.name?.charAt(0)}
                                                </div>
                                                <div className="worker-rec-info">
                                                    <h4>{worker.name}</h4>
                                                    <div className="worker-rec-rating">{worker.rating} / 5</div>
                                                </div>
                                            </div>
                                            <div className="worker-rec-stats">
                                                <span>{worker.location}</span>
                                                <span>💼 {worker.completedJobs} {language === 'ta' ? 'வேலைகள் முடிந்தது' : 'jobs'}</span>
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
                        </>
                    )}

                </div>

                {/* Right Column: Sidebar */}
                <div className="job-sidebar">
                    {/* Budget & Action Card */}
                    <div className="sidebar-card action-card">
                        <div className="budget-display">
                            <span className="budget-amount">₹{job.wage?.toLocaleString()}</span>
                            <span className="budget-type">{t.perDay}</span>
                        </div>
                        <p className="budget-subtitle">{language === 'ta' ? 'மதிப்பிடப்பட்ட பட்ஜெட்' : 'Estimated Budget'}</p>

                        <div className="action-buttons-container">
                            {isOwner ? (
                                <div className="owner-payment-actions">
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
                                            className="btn-primary-modern w-full"
                                            onClick={handleRelease}
                                            disabled={releasing}
                                        >
                                            {releasing
                                                ? (language === 'ta' ? 'விடுவிக்கிறது...' : 'Releasing...')
                                                : (language === 'ta' ? 'கட்டணத்தை விடுவி' : 'Release Payment')}
                                        </button>
                                    )}
                                    {payment && (
                                        <div className={`payment-status-badge ${payment.status === 'released' ? 'released' : 'escrowed'}`}>
                                            {payment.status === 'released'
                                                ? `✓ ${language === 'ta' ? 'கட்டணம் பெறப்பட்டது' : 'Payment Received'}`
                                                : `🛡️ ${language === 'ta' ? 'கட்டணம் எஸ்க்ரோவில் உள்ளது' : 'Payment in Escrow'}`}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    className={`btn-apply-modern ${hasApplied ? 'applied' : ''} ${isApplying ? 'loading' : ''}`}
                                    onClick={handleApply}
                                    disabled={hasApplied || isApplying}
                                >
                                    {isApplying ? t.applying : hasApplied ? t.applied : (isAuthenticated ? t.apply : t.loginToApply)}
                                </button>
                            )}
                        </div>

                        <div className="job-activity-stats">
                            <div className="activity-row">
                                <span className="activity-label">{language === 'ta' ? 'இந்த வேலையில் செயல்பாடு:' : 'Activity on this job:'}</span>
                            </div>
                            <div className="activity-row">
                                <span>{language === 'ta' ? 'பார்வைகள்' : 'Views'}</span>
                                <strong>{job.views}</strong>
                            </div>
                            <div className="activity-row">
                                <span>{language === 'ta' ? 'விண்ணப்பித்தவர்கள்' : 'Applicants'}</span>
                                <strong>{Math.floor(job.views / 15) || 0}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Employer Card ("About the Client") */}
                    <div className="sidebar-card employer-card-modern">
                        <h3 className="sidebar-heading">{language === 'ta' ? 'வாடிக்கையாளரைப் பற்றி' : 'About the client'}</h3>
                        
                        <div className="employer-header">
                            <div className="employer-avatar-modern">
                                {job.employer?.name?.charAt(0) || 'E'}
                            </div>
                            <div className="employer-info-basic">
                                <strong className="employer-name-modern">{job.employer?.name}</strong>
                                {job.employer?.companyName && <span className="employer-company">🏢 {job.employer.companyName}</span>}
                            </div>
                        </div>

                        <div className="employer-stats-list">
                            <div className="emp-stat-item">
                                <span>4.5 {language === 'ta' ? 'மதிப்பீடு' : 'Rating'}</span>
                                <span className="stat-sub">({Math.floor(Math.random() * 50) + 10} reviews)</span>
                            </div>
                            <div className="emp-stat-item">
                                <span>{job.location?.split(',')[0] || 'Local'}</span>
                                <span className="stat-sub">{language === 'ta' ? 'இடம்' : 'Location'}</span>
                            </div>
                            <div className="emp-stat-item">
                                <span>{job.employer?.completedJobs || 5}+ {language === 'ta' ? 'வேலைகள் இடுகையிட்டவை' : 'Jobs Posted'}</span>
                                <span className="stat-sub">80% hire rate</span>
                            </div>
                        </div>

                        {isAuthenticated && hasApplied && job.employer?.phone && (
                            <div className="employer-contact-actions">
                                <a href={`tel:${job.employer.phone}`} className="btn-contact-modern phone">
                                    {t.callEmployer}
                                </a>
                                <a
                                    href={`https://wa.me/${job.employer.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-contact-modern whatsapp"
                                >
                                    {t.whatsapp}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile Sticky Bar (Visible only on mobile via CSS) */}
            <div className="mobile-sticky-apply">
                <div className="mobile-budget">
                    <strong>₹{job.wage?.toLocaleString()}</strong>
                    <span>{t.perDay}</span>
                </div>
                {!isOwner && (
                    <button
                        className={`btn-apply-modern ${hasApplied ? 'applied' : ''} ${isApplying ? 'loading' : ''}`}
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
