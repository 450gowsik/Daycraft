import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { buildApiUrl } from '../services/apiConfig'
import recommendationService from '../services/recommendationService'
import './Dashboard.css'

function Dashboard() {
    const { t, language } = useLanguage()
    const { user, token, isWorker, isEmployer } = useAuth()
    const [stats, setStats] = useState({
        activeJobs: 0,
        applications: 0,
        completed: 0,
        earnings: 0
    })
    const [recentJobs, setRecentJobs] = useState([])
    const [myApplications, setMyApplications] = useState([])
    const [recommendedJobs, setRecommendedJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingRecommended, setLoadingRecommended] = useState(false)

    useEffect(() => {
        if (user) {
            fetchDashboardData()
            if (isWorker) {
                fetchRecommendations()
            }
        }
    }, [user, isWorker])

    const fetchRecommendations = async () => {
        setLoadingRecommended(true)
        try {
            const data = await recommendationService.getRecommendedJobs()
            if (data.success) {
                setRecommendedJobs(data.jobs)
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error)
        } finally {
            setLoadingRecommended(false)
        }
    }

    const fetchDashboardData = async () => {
        try {
            if (isEmployer) {
                // Fetch employer's posted jobs
                const response = await fetch(buildApiUrl('/jobs/user/my-jobs'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                // Silently handle 401
                if (response.status === 401) {
                    setLoading(false);
                    return;
                }

                const data = await response.json()
                if (data.success) {
                    setRecentJobs(data.jobs || [])
                    const activeJobs = data.jobs?.filter(j => j.status === 'open').length || 0
                    const totalApplicants = data.jobs?.reduce((acc, job) => acc + (job.applicants?.length || 0), 0) || 0
                    setStats({
                        activeJobs,
                        applications: totalApplicants,
                        completed: data.jobs?.filter(j => j.status === 'completed').length || 0,
                        earnings: 0
                    })
                }
            } else if (isWorker) {
                // Fetch worker's applications
                const response = await fetch(buildApiUrl('/jobs/user/my-applications'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                // Silently handle 401
                if (response.status === 401) {
                    setLoading(false);
                    return;
                }

                const data = await response.json()
                if (data.success) {
                    setMyApplications(data.applications || [])
                    setStats({
                        activeJobs: data.applications?.filter(a => a.application?.status === 'accepted').length || 0,
                        applications: data.applications?.length || 0,
                        completed: user?.completedJobs || 0,
                        earnings: 0
                    })
                }
            }
        } catch (error) {
            // Silently fail - dashboard data is not critical
            console.warn('Dashboard data temporarily unavailable:', error.message);
        } finally {
            setLoading(false)
        }
    }

    const getStatsConfig = () => {
        if (isEmployer) {
            return [
                { key: 'activeJobs', value: stats.activeJobs, icon: '📋', label: language === 'en' ? 'Active Jobs' : 'செயலில் உள்ள வேலைகள்' },
                { key: 'applications', value: stats.applications, icon: '📨', label: language === 'en' ? 'Applicants' : 'விண்ணப்பதாரர்கள்' },
                { key: 'completed', value: stats.completed, icon: '✅', label: language === 'en' ? 'Completed' : 'முடிந்தது' },
                { key: 'hiredWorkers', value: recentJobs.reduce((acc, job) => acc + (job.hiredWorkers?.length || 0), 0), icon: '👷', label: language === 'en' ? 'Hired Workers' : 'பணியமர்த்தப்பட்ட தொழிலாளர்கள்' }
            ]
        }
        return [
            { key: 'activeJobs', value: stats.activeJobs, icon: '💼', label: language === 'en' ? 'Active Jobs' : 'செயலில் உள்ள வேலைகள்' },
            { key: 'applications', value: stats.applications, icon: '📨', label: language === 'en' ? 'Applications' : 'விண்ணப்பங்கள்' },
            { key: 'completed', value: stats.completed, icon: '✅', label: language === 'en' ? 'Completed' : 'முடிந்தது' },
            { key: 'rating', value: `⭐ ${user?.rating || 0}`, icon: '', label: language === 'en' ? 'Rating' : 'மதிப்பீடு' }
        ]
    }

    return (
        <div className="dashboard-page">
            <div className="container">
                <div className="dashboard-header">
                    <div>
                        <h1>{language === 'en' ? 'Dashboard' : 'டாஷ்போர்டு'}</h1>
                        <p>{language === 'en' ? 'Welcome back' : 'மீண்டும் வருக'}, <strong>{user?.name || 'User'}</strong>!</p>
                    </div>
                    {isEmployer && (
                        <Link to="/post-job" className="btn btn-primary">
                            ➕ {language === 'en' ? 'Post a Job' : 'வேலையை இடு'}
                        </Link>
                    )}
                </div>

                <div className="stats-grid">
                    {getStatsConfig().map(stat => (
                        <div key={stat.key} className="stat-card">
                            <span className="stat-icon">{stat.icon}</span>
                            <div className="stat-content">
                                <span className="stat-value">{stat.value || 0}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {isEmployer && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>{language === 'en' ? 'My Posted Jobs' : 'என் இடுகையிட்ட வேலைகள்'}</h2>
                            <Link to="/my-jobs" className="btn btn-secondary btn-sm">
                                {language === 'en' ? 'View All' : 'அனைத்தையும் காண்க'}
                            </Link>
                        </div>

                        {loading ? (
                            <div className="loading-state">Loading...</div>
                        ) : recentJobs.length === 0 ? (
                            <div className="empty-state">
                                <p>{language === 'en' ? 'No jobs posted yet.' : 'இதுவரை வேலைகள் இடவில்லை.'}</p>
                            </div>
                        ) : (
                            <div className="jobs-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>{language === 'en' ? 'Job' : 'வேலை'}</th>
                                            <th>{language === 'en' ? 'Location' : 'இடம்'}</th>
                                            <th>{language === 'en' ? 'Wage' : 'ஊதியம்'}</th>
                                            <th>{language === 'en' ? 'Applicants' : 'விண்ணப்பதாரர்கள்'}</th>
                                            <th>{language === 'en' ? 'Status' : 'நிலை'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentJobs.slice(0, 5).map(job => (
                                            <tr key={job._id}>
                                                <td>
                                                    <strong>{language === 'ta' && job.title?.ta ? job.title.ta : job.title?.en}</strong>
                                                </td>
                                                <td>{job.location}</td>
                                                <td>₹{job.wage}</td>
                                                <td>
                                                    <span className="applicant-count">{job.applicants?.length || 0}</span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${job.status}`}>
                                                        {job.status === 'open' ? (language === 'en' ? 'Open' : 'திறந்த') :
                                                            job.status === 'in-progress' ? (language === 'en' ? 'In Progress' : 'நடப்பு') :
                                                                job.status === 'completed' ? (language === 'en' ? 'Completed' : 'முடிந்தது') :
                                                                    (language === 'en' ? 'Cancelled' : 'ரத்து')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {isWorker && recommendedJobs.length > 0 && (
                    <div className="dashboard-section recommendation-section">
                        <div className="section-header">
                            <h2>{language === 'en' ? 'Recommended for You' : 'உங்களுக்காகப் பரிந்துரைக்கப்படுகிறது'}</h2>
                            <span className="section-tag">{language === 'en' ? 'Smart Match' : 'ஸ்மார்ட் மேட்ச்'}</span>
                        </div>
                        <div className="recommendations-grid">
                            {recommendedJobs.slice(0, 3).map(job => (
                                <Link to={`/jobs/${job._id}`} key={job._id} className="recommendation-card">
                                    <div className="match-badge">
                                        {job.match?.total}% {language === 'en' ? 'Match' : 'பொருத்தம்'}
                                    </div>
                                    <h3 className="rec-title">{language === 'ta' && job.title?.ta ? job.title.ta : job.title?.en}</h3>
                                    <div className="rec-meta">
                                        <span>📍 {job.location}</span>
                                        <span>💰 ₹{job.wage}</span>
                                    </div>
                                    <div className="rec-why">
                                        ✨ {job.match?.breakdown?.skill > 30
                                            ? (language === 'en' ? 'Matches your skills' : 'உங்கள் திறமைகளுடன் பொருந்துகிறது')
                                            : (language === 'en' ? 'Near your location' : 'உங்கள் இடத்திற்கு அருகில்')}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {isWorker && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>{language === 'en' ? 'My Applications' : 'என் விண்ணப்பங்கள்'}</h2>
                            <Link to="/jobs" className="btn btn-secondary btn-sm">
                                {language === 'en' ? 'Find Jobs' : 'வேலைகளைக் கண்டுபிடி'}
                            </Link>
                        </div>

                        {loading ? (
                            <div className="loading-state">Loading...</div>
                        ) : myApplications.length === 0 ? (
                            <div className="empty-state guidance-state">
                                <div className="guidance-icon">💼</div>
                                <h3>{language === 'en' ? 'No applications yet' : 'இன்னும் விண்ணப்பங்கள் இல்லை'}</h3>
                                <p className="guidance-text">
                                    {language === 'en'
                                        ? 'Start by applying to nearby jobs. Most workers get hired within 2–3 applications!'
                                        : '2-3 விண்ணப்பங்களில் பெரும்பாலான தொழிலாளர்கள் பணியமர்த்தப்படுகிறார்கள்!'}
                                </p>
                                <Link to="/jobs" className="btn btn-primary">
                                    🔍 {language === 'en' ? 'Browse Jobs Near You' : 'உங்கள் அருகிலுள்ள வேலைகளைத் தேடுக'}
                                </Link>
                            </div>
                        ) : (
                            <div className="applications-list">
                                {myApplications.slice(0, 5).map((item, index) => (
                                    <div key={index} className="application-card">
                                        <div className="application-info">
                                            <h4>{language === 'ta' && item.job?.title?.ta ? item.job.title.ta : item.job?.title?.en}</h4>
                                            <p>{item.job?.location} • ₹{item.job?.wage}</p>
                                        </div>
                                        <span className={`status-badge ${item.application?.status}`}>
                                            {item.application?.status === 'pending' ? (language === 'en' ? 'Pending' : 'காத்திருக்கிறது') :
                                                item.application?.status === 'accepted' ? (language === 'en' ? 'Accepted' : 'ஏற்றுக்கொள்ளப்பட்டது') :
                                                    (language === 'en' ? 'Rejected' : 'நிராகரிக்கப்பட்டது')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="dashboard-section quick-actions">
                    <h2>{language === 'en' ? 'Quick Actions' : 'விரைவு செயல்கள்'}</h2>
                    <div className="actions-grid">
                        <Link to="/profile" className="action-card">
                            <span className="action-icon">👤</span>
                            <span>{language === 'en' ? 'Edit Profile' : 'சுயவிவரத்தைத் திருத்து'}</span>
                        </Link>
                        <Link to="/jobs" className="action-card">
                            <span className="action-icon">🔍</span>
                            <span>{language === 'en' ? 'Browse Jobs' : 'வேலைகளை உலாவு'}</span>
                        </Link>
                        <Link to="/workers" className="action-card">
                            <span className="action-icon">👷</span>
                            <span>{language === 'en' ? 'Find Workers' : 'தொழிலாளர்களைக் கண்டுபிடி'}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
