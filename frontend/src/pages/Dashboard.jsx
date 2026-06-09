import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { buildApiUrl } from '../services/apiConfig'
import recommendationService from '../services/recommendationService'
import {
    FiBriefcase,
    FiFileText,
    FiCheckCircle,
    FiStar,
    FiPlus,
    FiArrowRight,
    FiUser,
    FiSearch,
    FiUsers,
    FiTrendingUp,
    FiMapPin,
    FiDollarSign,
    FiCalendar,
    FiChevronRight,
    FiAward,
    FiActivity
} from 'react-icons/fi'
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
    const [greeting, setGreeting] = useState('Welcome back')

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting(language === 'en' ? 'Good morning' : 'இனிய காலை வணக்கம்')
        else if (hour < 17) setGreeting(language === 'en' ? 'Good afternoon' : 'இனிய மதிய வணக்கம்')
        else setGreeting(language === 'en' ? 'Good evening' : 'இனிய மாலை வணக்கம்')
    }, [language])

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
            console.warn('Dashboard data temporarily unavailable:', error.message);
        } finally {
            setLoading(false)
        }
    }

    const getStatsConfig = () => {
        if (isEmployer) {
            return [
                {
                    key: 'activeJobs',
                    value: stats.activeJobs,
                    icon: <FiBriefcase />,
                    label: language === 'en' ? 'Active Jobs' : 'செயலில் உள்ள வேலைகள்',
                    color: 'blue'
                },
                {
                    key: 'applications',
                    value: stats.applications,
                    icon: <FiFileText />,
                    label: language === 'en' ? 'Total Applicants' : 'விண்ணப்பதாரர்கள்',
                    color: 'orange'
                },
                {
                    key: 'completed',
                    value: stats.completed,
                    icon: <FiCheckCircle />,
                    label: language === 'en' ? 'Completed Work' : 'முடிந்தது',
                    color: 'green'
                },
                {
                    key: 'hiredWorkers',
                    value: recentJobs.reduce((acc, job) => acc + (job.hiredWorkers?.length || 0), 0),
                    icon: <FiUsers />,
                    label: language === 'en' ? 'Active Hires' : 'பணியமர்த்தப்பட்ட தொழிலாளர்கள்',
                    color: 'purple'
                }
            ]
        }
        return [
            {
                key: 'activeJobs',
                value: stats.activeJobs,
                icon: <FiBriefcase />,
                label: language === 'en' ? 'Active Jobs' : 'செயலில் உள்ள வேலைகள்',
                color: 'blue'
            },
            {
                key: 'applications',
                value: stats.applications,
                icon: <FiFileText />,
                label: language === 'en' ? 'Applications' : 'விண்ணப்பங்கள்',
                color: 'orange'
            },
            {
                key: 'completed',
                value: stats.completed,
                icon: <FiCheckCircle />,
                label: language === 'en' ? 'Jobs Completed' : 'முடிந்தது',
                color: 'green'
            },
            {
                key: 'rating',
                value: user?.rating ? Number(user.rating).toFixed(1) : '0.0',
                icon: <FiStar />,
                label: language === 'en' ? 'Average Rating' : 'மதிப்பீடு',
                color: 'gold'
            }
        ]
    }

    return (
        <div className="dashboard-page">
            {/* Header Area with Premium Gradient Mesh */}
            <header className="dashboard-hero-header">
                <div className="container dashboard-hero-container">
                    <div className="hero-profile-summary">
                        <div className="avatar-ring-premium">
                            <span className="avatar-text-large">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                            <span className="avatar-status-badge"></span>
                        </div>
                        <div className="hero-text-content">
                            <p className="hero-greeting">
                                <span className="greeting-pill">{greeting}</span>
                            </p>
                            <h1>{user?.name || 'User'}</h1>
                            <div className="role-tags">
                                <span className="role-badge">
                                    {isEmployer ? (language === 'en' ? 'Employer / Job Provider' : 'வேலை வழங்குநர்') : (language === 'en' ? 'Worker / Service Provider' : 'தொழிலாளி')}
                                </span>
                                {user?.location && (
                                    <span className="location-badge">
                                        <FiMapPin size={12} style={{marginRight:'4px'}}/>{user.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="hero-actions">
                        {isEmployer && (
                            <Link to="/post-job" className="btn btn-premium btn-lg">
                                <FiPlus className="btn-icon" />
                                {language === 'en' ? 'Post a New Job' : 'வேலையை இடு'}
                            </Link>
                        )}
                        {!isEmployer && (
                            <Link to="/jobs" className="btn btn-premium btn-lg">
                                <FiSearch className="btn-icon" />
                                {language === 'en' ? 'Find Local Work' : 'வேலைகளைத் தேடு'}
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="container main-dashboard-body">
                {/* Stats Container */}
                <section className="stats-section">
                    <div className="stats-grid">
                        {getStatsConfig().map(stat => (
                            <div key={stat.key} className={`stat-card stat-card--${stat.color}`}>
                                <div className="stat-card-glow"></div>
                                <div className="stat-icon-wrap">
                                    {stat.icon}
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                                <div className="stat-trending-indicator">
                                    <FiActivity className="trend-icon" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Main Dashboard Rows */}
                <div className="dashboard-main-layout">
                    {/* Left Column: Content */}
                    <div className="layout-content-col">
                        {/* Employer: Posted Jobs Table */}
                        {isEmployer && (
                            <div className="dashboard-panel">
                                <div className="panel-header">
                                    <div>
                                        <h2>{language === 'en' ? 'My Posted Jobs' : 'என் இடுகையிட்ட வேலைகள்'}</h2>
                                        <p className="panel-subtitle">{language === 'en' ? 'Manage your active listings and applicants' : 'உங்கள் செயலில் உள்ள பட்டியல்கள் மற்றும் விண்ணப்பதாரர்களை நிர்வகிக்கவும்'}</p>
                                    </div>
                                    <Link to="/my-jobs" className="panel-action-link">
                                        {language === 'en' ? 'View All Listings' : 'அனைத்தையும் காண்க'}
                                        <FiChevronRight />
                                    </Link>
                                </div>

                                {loading ? (
                                    <div className="loading-state-premium">
                                        <div className="spinner-loader"></div>
                                        <span>{language === 'en' ? 'Retrieving jobs...' : 'வேலைகளை பெறுகிறது...'}</span>
                                    </div>
                                ) : recentJobs.length === 0 ? (
                                    <div className="empty-panel-state">
                                        <div className="empty-illustration"><FiBriefcase size={32} /></div>
                                        <h3>{language === 'en' ? 'No Jobs Posted Yet' : 'இன்னும் வேலைகள் இடப்படவில்லை'}</h3>
                                        <p>{language === 'en' ? 'Create a job listing to connect with verified skilled workers in your area.' : 'உங்கள் பகுதியில் சரிபார்க்கப்பட்ட திறமையான தொழிலாளர்களுடன் இணைய வேலை பட்டியலை உருவாக்கவும்.'}</p>
                                        <Link to="/post-job" className="btn btn-primary btn-md">
                                            {language === 'en' ? 'Post Your First Job' : 'முதல் வேலையை இடுங்கள்'}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="table-responsive-wrapper">
                                        <table className="jobs-data-table">
                                            <thead>
                                                <tr>
                                                    <th>{language === 'en' ? 'Job Title' : 'வேலை'}</th>
                                                    <th>{language === 'en' ? 'Location' : 'இடம்'}</th>
                                                    <th>{language === 'en' ? 'Daily Wage' : 'ஊதியம்'}</th>
                                                    <th>{language === 'en' ? 'Applicants' : 'விண்ணப்பதாரர்கள்'}</th>
                                                    <th>{language === 'en' ? 'Status' : 'நிலை'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentJobs.slice(0, 5).map(job => {
                                                    const title = language === 'ta' && job.title?.ta ? job.title.ta : job.title?.en || job.title
                                                    return (
                                                        <tr key={job._id} className="table-row-hover">
                                                            <td>
                                                                <Link to={`/jobs/${job._id}`} className="job-table-title-link">
                                                                    {title}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                <span className="location-table-cell">
                                                                    <FiMapPin className="cell-icon" />
                                                                    {job.location}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="wage-table-cell">
                                                                    ₹{job.wage?.toLocaleString() || '--'}
                                                                    <small>/{language === 'en' ? 'day' : 'நாள்'}</small>
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Link to={`/jobs/${job._id}/applicants`} className="applicants-count-badge">
                                                                    {job.applicants?.length || 0}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                <span className={`badge-status badge-status--${job.status}`}>
                                                                    <span className="badge-dot"></span>
                                                                    {job.status === 'open' ? (language === 'en' ? 'Open' : 'திறந்த') :
                                                                        job.status === 'in-progress' ? (language === 'en' ? 'In Progress' : 'நடப்பு') :
                                                                            job.status === 'completed' ? (language === 'en' ? 'Completed' : 'முடிந்தது') :
                                                                                (language === 'en' ? 'Cancelled' : 'ரத்து')}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Worker: Recommended Jobs */}
                        {isWorker && recommendedJobs.length > 0 && (
                            <div className="dashboard-panel recommendation-panel">
                                <div className="panel-header">
                                    <div>
                                        <div className="header-tag-wrap">
                                            <h2>{language === 'en' ? 'Recommended for You' : 'உங்களுக்காகப் பரிந்துரைக்கப்படுகிறது'}</h2>
                                            <span className="badge-ai-match">{language === 'en' ? 'AI Smart Match' : 'AI ஸ்மார்ட் மேட்ச்'}</span>
                                        </div>
                                        <p className="panel-subtitle">{language === 'en' ? 'Jobs tailored to your skills and preferred location' : 'உங்கள் திறன்கள் மற்றும் விருப்பமான இடத்திற்கு ஏற்ற வேலைகள்'}</p>
                                    </div>
                                    <Link to="/jobs" className="panel-action-link">
                                        {language === 'en' ? 'Explore Jobs' : 'வேலைகளைத் தேடு'}
                                        <FiChevronRight />
                                    </Link>
                                </div>
                                
                                <div className="recommendations-row-scroll">
                                    {recommendedJobs.slice(0, 3).map(job => {
                                        const title = language === 'ta' && job.title?.ta ? job.title.ta : job.title?.en || job.title
                                        const matchScore = job.match?.total || 85
                                        
                                        return (
                                            <Link to={`/jobs/${job._id}`} key={job._id} className="modern-rec-card">
                                                <div className="rec-card-match-score">
                                                    <span className="score-num">{matchScore}%</span>
                                                    <span className="score-label">{language === 'en' ? 'match' : 'பொருத்தம்'}</span>
                                                </div>
                                                <h3 className="rec-job-title">{title}</h3>
                                                
                                                <div className="rec-job-meta">
                                                    <span><FiMapPin size={12}/> {job.location}</span>
                                                    <span>₹{job.wage?.toLocaleString()}/day</span>
                                                </div>
                                                
                                                <div className="rec-match-reason">
                                                    <span>
                                                        {job.match?.breakdown?.skill > 30
                                                            ? (language === 'en' ? 'Matches your skills' : 'உங்கள் திறமைகளுடன் பொருந்துகிறது')
                                                            : (language === 'en' ? 'Near your location' : 'உங்கள் இடத்திற்கு அருகில்')}
                                                    </span>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Worker: Applications List */}
                        {isWorker && (
                            <div className="dashboard-panel">
                                <div className="panel-header">
                                    <div>
                                        <h2>{language === 'en' ? 'My Applications' : 'என் விண்ணப்பங்கள்'}</h2>
                                        <p className="panel-subtitle">{language === 'en' ? 'Track status of your submitted job applications' : 'உங்கள் சமர்ப்பிக்கப்பட்ட வேலை விண்ணப்பங்களின் நிலையைக் கண்காணிக்கவும்'}</p>
                                    </div>
                                    <Link to="/jobs" className="panel-action-link">
                                        {language === 'en' ? 'Find More Jobs' : 'வேலைகளைத் தேடு'}
                                        <FiChevronRight />
                                    </Link>
                                </div>

                                {loading ? (
                                    <div className="loading-state-premium">
                                        <div className="spinner-loader"></div>
                                        <span>{language === 'en' ? 'Retrieving applications...' : 'விண்ணப்பங்களைப் பெறுகிறது...'}</span>
                                    </div>
                                ) : myApplications.length === 0 ? (
                                    <div className="empty-panel-state-google">
                                        <div className="illustration-wrap"><FiBriefcase size={32} /></div>
                                        <h3>{language === 'en' ? 'No Applications Yet' : 'இன்னும் விண்ணப்பங்கள் இல்லை'}</h3>
                                        <p className="illustration-sub">{language === 'en' ? 'Start applying to local jobs. Most active workers receive offers within 2–3 applications!' : 'உள்ளூர் வேலைகளுக்கு விண்ணப்பிக்கத் தொடங்குங்கள். சுறுசுறுப்பான தொழிலாளர்கள் 2-3 விண்ணப்பங்களுக்குள் வாய்ப்புகளைப் பெறுவார்கள்!'}</p>
                                        <Link to="/jobs" className="btn btn-premium btn-md">
                                            <FiSearch className="btn-icon" />
                                            {language === 'en' ? 'Browse Jobs Near You' : 'உங்கள் அருகிலுள்ள வேலைகளைத் தேடுக'}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="applications-modern-list">
                                        {myApplications.slice(0, 5).map((item, index) => {
                                            const jobTitle = language === 'ta' && item.job?.title?.ta ? item.job.title.ta : item.job?.title?.en || item.job?.title
                                            const appStatus = item.application?.status || 'pending'
                                            return (
                                                <div key={index} className="app-list-row-card">
                                                    <div className="app-card-details">
                                                        <div className="app-job-icon">
                                                            <FiBriefcase />
                                                        </div>
                                                        <div className="app-job-info-text">
                                                            <h4>{jobTitle}</h4>
                                                            <p>
                                                                <span><FiMapPin size={11}/> {item.job?.location}</span>
                                                                <span className="dot-divider">•</span>
                                                                <strong>₹{item.job?.wage?.toLocaleString()}/day</strong>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="app-card-status">
                                                        <span className={`badge-status-pill badge-status-pill--${appStatus}`}>
                                                            {appStatus === 'pending' ? (language === 'en' ? 'Pending' : 'காத்திருக்கிறது') :
                                                                appStatus === 'accepted' ? (language === 'en' ? 'Accepted' : 'ஏற்கப்பட்டது') :
                                                                    (language === 'en' ? 'Rejected' : 'நிராகரிக்கப்பட்டது')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar / Quick Actions */}
                    <div className="layout-sidebar-col">
                        <div className="dashboard-panel sidebar-panel">
                            <h2>{language === 'en' ? 'Quick Actions' : 'விரைவு செயல்கள்'}</h2>
                            <p className="panel-subtitle">{language === 'en' ? 'Access your account shortcuts' : 'உங்கள் கணக்கு குறுக்குவழிகளை அணுகவும்'}</p>
                            
                            <div className="sidebar-actions-vertical">
                                <Link to="/profile" className="vertical-action-card">
                                    <div className="action-card-icon-wrap user-bg">
                                        <FiUser />
                                    </div>
                                    <div className="action-card-text">
                                        <h4>{language === 'en' ? 'Edit Profile' : 'சுயவிவரத்தைத் திருத்து'}</h4>
                                        <p>{language === 'en' ? 'Update skills, location & contact info' : 'திறன்கள், இடம் & தொடர்பு தகவலைப் புதுப்பிக்கவும்'}</p>
                                    </div>
                                    <FiChevronRight className="arrow-right" />
                                </Link>

                                <Link to="/jobs" className="vertical-action-card">
                                    <div className="action-card-icon-wrap search-bg">
                                        <FiSearch />
                                    </div>
                                    <div className="action-card-text">
                                        <h4>{language === 'en' ? 'Browse Jobs' : 'வேலைகளை உலாவு'}</h4>
                                        <p>{language === 'en' ? 'Filter open daily-wage listings' : 'தினசரி கூலி பட்டியல்களை வடிகட்டவும்'}</p>
                                    </div>
                                    <FiChevronRight className="arrow-right" />
                                </Link>

                                {isEmployer ? (
                                    <Link to="/post-job" className="vertical-action-card">
                                        <div className="action-card-icon-wrap workers-bg">
                                            <FiPlus />
                                        </div>
                                        <div className="action-card-text">
                                            <h4>{language === 'en' ? 'Post a Job' : 'வேலையை இடு'}</h4>
                                            <p>{language === 'en' ? 'Create a job listing to find workers' : 'தொழிலாளர்களைக் கண்டறிய வேலை பட்டியலை உருவாக்கவும்'}</p>
                                        </div>
                                        <FiChevronRight className="arrow-right" />
                                    </Link>
                                ) : (
                                    <Link to="/workers" className="vertical-action-card">
                                        <div className="action-card-icon-wrap workers-bg">
                                            <FiUsers />
                                        </div>
                                        <div className="action-card-text">
                                            <h4>{language === 'en' ? 'Find Workers' : 'தொழிலாளர்களைக் கண்டுபிடி'}</h4>
                                            <p>{language === 'en' ? 'Find verified service providers' : 'சரிபார்க்கப்பட்ட சேவை வழங்குநர்களைக் கண்டறியவும்'}</p>
                                        </div>
                                        <FiChevronRight className="arrow-right" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Top Performer Badge */}
                        {!isEmployer && (
                            <div className="sidebar-gradient-banner">
                                <div className="banner-glow-effect"></div>
                                <div className="banner-content">
                                    <FiAward className="banner-icon-gold" />
                                    <h3>{language === 'en' ? 'Verified Professional' : 'சரிபார்க்கப்பட்ட நிபுணர்'}</h3>
                                    <p>{language === 'en' ? 'Complete 5-star jobs to rank higher in search results and get recommended first!' : '5-நட்சத்திர வேலைகளை முடித்து தேடல் முடிவுகளில் உயர்ந்த இடத்தில் இருங்கள், முதலில் பரிந்துரைக்கப்படுங்கள்!'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
