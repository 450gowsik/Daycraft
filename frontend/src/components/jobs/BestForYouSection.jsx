import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { jobService } from '../../services/jobService.js'
import { CategoryIcon } from './CategoryIcon.jsx'
import { FaBolt, FaChevronRight, FaMapMarkerAlt, FaStar } from 'react-icons/fa'
import './BestForYouSection.css'

function BestForYouSection() {
    const navigate = useNavigate()
    const { language } = useLanguage()
    const { isAuthenticated, isWorker, user } = useAuth()

    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(true)
    const [applyingJobId, setApplyingJobId] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState(null)

    const t = {
        title: language === 'ta' ? 'உங்களுக்கான சிறந்தவை' : 'Best for You',
        subtitle: language === 'ta' ? 'Recommended jobs' : 'Recommended jobs',
        loadFailed: language === 'ta' ? 'பரிந்துரைகளை இப்போது பெற முடியவில்லை' : 'Recommendations are temporarily unavailable',
        viewAll: language === 'ta' ? 'அனைத்தையும் பார்' : 'View All',
        perDay: language === 'ta' ? '/நாள்' : '/day',
        apply: language === 'ta' ? 'விண்ணப்பி' : 'Apply',
        applying: language === 'ta' ? 'விண்ணப்பிக்கிறது...' : 'Applying...',
        applied: language === 'ta' ? 'விண்ணப்பிக்கப்பட்டது' : 'Applied',
        applyFailed: language === 'ta'
            ? 'விண்ணப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Could not apply right now. Please try again.'
    }

    useEffect(() => {
        if (isAuthenticated && isWorker) {
            fetchRecommendations()
            return
        }

        setRecommendations([])
        setMessage('')
        setError(null)
        setLoading(false)
    }, [isAuthenticated, isWorker, user?._id])

    const fetchRecommendations = async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await jobService.getBestForYouJobs(6)
            const jobs = Array.isArray(data?.recommendations) ? data.recommendations : []

            setRecommendations(
                jobs.map((job) => {
                    const jobId = job._id || job.id
                    return {
                        ...job,
                        hasApplied: Boolean(jobId && localStorage.getItem(`applied_${jobId}`))
                    }
                })
            )
            setMessage(data?.message || '')
        } catch (err) {
            console.error('Failed to fetch best-for-you jobs:', err)
            setError(err)
            setRecommendations([])
            setMessage('')
        } finally {
            setLoading(false)
        }
    }

    const handleCardClick = (jobId) => {
        if (!jobId) return

        if (isAuthenticated) {
            jobService.recordJobView(jobId)
        }

        navigate(`/jobs/${jobId}`)
    }

    const handleQuickApply = async (event, jobId) => {
        event.stopPropagation()

        if (!jobId || applyingJobId === jobId) {
            return
        }

        setApplyingJobId(jobId)

        try {
            await jobService.quickApply(jobId)
            localStorage.setItem(`applied_${jobId}`, 'true')

            setRecommendations((previous) =>
                previous.map((job) =>
                    (job._id || job.id) === jobId
                        ? { ...job, hasApplied: true }
                        : job
                )
            )
        } catch (err) {
            console.error('Quick apply failed:', err)
            window.alert(err?.response?.data?.message || t.applyFailed)
        } finally {
            setApplyingJobId(null)
        }
    }

    if (!isAuthenticated || !isWorker) {
        return null
    }

    if (loading) {
        return (
            <section className="best-for-you-section">
                <div className="section-header">
                    <h2 className="section-title">{t.title}</h2>
                </div>
                <div className="recommendations-scroll">
                    {[1, 2, 3].map((i) => (
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

    if (recommendations.length === 0) {
        return null
    }

    return (
        <section className="best-for-you-section">
            <div className="section-header">
                <div className="title-group">
                    <h2 className="section-title">{t.title}</h2>
                    <span className="section-subtitle">
                        {error ? t.loadFailed : (message || t.subtitle)}
                    </span>
                </div>
                <button className="view-all-btn" onClick={() => navigate('/jobs')}>
                    {t.viewAll} <FaChevronRight size={12} />
                </button>
            </div>

            <div className="recommendations-scroll">
                {recommendations.map((job, index) => {
                    const jobId = job._id || job.id
                    const title = job.title?.[language] || job.title?.en || job.title || 'Job'
                    const isApplying = applyingJobId === jobId

                    return (
                        <div
                            key={jobId}
                            className="recommendation-card"
                            onClick={() => handleCardClick(jobId)}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={`match-badge ${job.matchScore >= 80 ? 'excellent' : job.matchScore >= 60 ? 'great' : 'good'}`}>
                                <FaStar size={10} />
                                <span>{job.matchScore}%</span>
                            </div>

                            <div className="card-category">
                                <CategoryIcon category={job.category} size={16} />
                                <span>{job.category}</span>
                            </div>

                            <h3 className="card-title">{title}</h3>

                            <div className="card-wage">
                                Rs. {job.wage?.toLocaleString() || '--'}{t.perDay}
                            </div>

                            <div className="card-location">
                                <FaMapMarkerAlt size={12} />
                                <span>{job.location}</span>
                            </div>

                            {job.whyRecommended?.length > 0 && (
                                <div className="why-recommended">
                                    {job.whyRecommended.map((reason, reasonIndex) => (
                                        <span key={reasonIndex} className="reason-tag">+ {reason}</span>
                                    ))}
                                </div>
                            )}

                            <button
                                className={`quick-apply-btn ${job.hasApplied ? 'applied' : ''}`}
                                onClick={(event) => handleQuickApply(event, jobId)}
                                disabled={job.hasApplied || isApplying}
                            >
                                <FaBolt size={12} />
                                {isApplying ? t.applying : job.hasApplied ? t.applied : t.apply}
                            </button>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default BestForYouSection
