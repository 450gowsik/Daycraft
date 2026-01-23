import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './JobApplicants.css'

function JobApplicants() {
    const { jobId } = useParams()
    const navigate = useNavigate()
    const { language } = useLanguage()
    const { user } = useAuth()

    const [applicants, setApplicants] = useState([])
    const [jobTitle, setJobTitle] = useState('')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ applied: 0, shortlisted: 0, hired: 0, rejected: 0 })
    const [filterStatus, setFilterStatus] = useState('all')

    // Mock data for development
    const mockApplicants = [
        {
            _id: 'app1',
            worker: {
                _id: 'w1',
                name: 'Ramesh Kumar',
                phone: '9876543210',
                location: 'Chennai, Velachery',
                skills: [{ en: 'Painting', ta: 'பெயிண்டிங்' }, { en: 'Polishing', ta: 'பாலிஷிங்' }],
                rating: 4.5,
                completedJobs: 12,
                avatar: ''
            },
            status: 'applied',
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            message: 'I have 5 years of experience in painting and own tools.'
        },
        {
            _id: 'app2',
            worker: {
                _id: 'w2',
                name: 'Suresh B',
                phone: '9876543211',
                location: 'Chennai, Adyar',
                skills: [{ en: 'Painting', ta: 'பெயிண்டிங்' }],
                rating: 3.8,
                completedJobs: 5,
                avatar: ''
            },
            status: 'shortlisted',
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            message: 'Ready to start immediately.'
        },
        {
            _id: 'app3',
            worker: {
                _id: 'w3',
                name: 'Muthu',
                phone: '9876543212',
                location: 'Chennai, Guindy',
                skills: [{ en: 'Carpenter', ta: 'தச்சன்' }], // Mismatch skill for demo
                rating: 0,
                completedJobs: 0,
                avatar: ''
            },
            status: 'rejected',
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            message: ''
        }
    ]

    useEffect(() => {
        // Fetch applicants
        const fetchApplicants = async () => {
            setLoading(true)
            try {
                // In production: const res = await fetch(`/api/applications/job/${jobId}`)
                await new Promise(resolve => setTimeout(resolve, 800))

                setApplicants(mockApplicants)
                setJobTitle('Waterproofing Work') // Mock title

                // Calculate stats
                const newStats = { applied: 0, shortlisted: 0, hired: 0, rejected: 0 }
                mockApplicants.forEach(app => {
                    if (newStats[app.status] !== undefined) {
                        newStats[app.status]++
                    }
                })
                setStats(newStats)

            } catch (error) {
                console.error('Error fetching applicants:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchApplicants()
    }, [jobId])

    const handleStatusChange = async (applicationId, newStatus) => {
        // Optimistic update
        setApplicants(prev => prev.map(app =>
            app._id === applicationId ? { ...app, status: newStatus } : app
        ))

        try {
            // API call would go here
            console.log(`Updating application ${applicationId} to ${newStatus}`)
        } catch (error) {
            console.error('Update failed:', error)
            // Revert on error
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'shortlisted': return 'status-purple'
            case 'hired': return 'status-green'
            case 'rejected': return 'status-red'
            default: return 'status-blue'
        }
    }

    const t = {
        back: language === 'ta' ? 'பின்செல்க' : 'Back',
        applicantsFor: language === 'ta' ? 'விண்ணப்பதாரர்கள்:' : 'Applicants for',
        noApplicants: language === 'ta' ? 'விண்ணப்பதாரர்கள் இல்லை' : 'No applicants yet',
        filterAll: language === 'ta' ? 'அனைத்தும்' : 'All',
        statusApplied: language === 'ta' ? 'புதியது' : 'Applied',
        statusShortlisted: language === 'ta' ? 'தேர்வு பட்டியல்' : 'Shortlisted',
        statusHired: language === 'ta' ? 'பணியமர்த்தப்பட்டார்' : 'Hired',
        statusRejected: language === 'ta' ? 'நிராகரிக்கப்பட்டது' : 'Rejected',
        actions: language === 'ta' ? 'செயல்கள்' : 'Actions',
        call: language === 'ta' ? 'அழைப்பு' : 'Call',
        experience: language === 'ta' ? 'அனுபவம்' : 'Experience',
        jobsDone: language === 'ta' ? 'வேலைகள்' : 'Jobs'
    }

    const filteredApplicants = filterStatus === 'all'
        ? applicants
        : applicants.filter(app => app.status === filterStatus)

    return (
        <div className="applicants-page">
            {/* Header */}
            <div className="applicants-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← {t.back}
                </button>
                <div className="header-content">
                    <h1>{t.applicantsFor} <span className="highlight">{jobTitle}</span></h1>
                    <div className="stats-pills">
                        <div className="stat-pill">
                            <span className="label">Total</span>
                            <span className="value">{applicants.length}</span>
                        </div>
                        <div className="stat-pill green">
                            <span className="label">Hired</span>
                            <span className="value">{stats.hired}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                >
                    {t.filterAll}
                </button>
                <button
                    className={`filter-tab ${filterStatus === 'applied' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('applied')}
                >
                    {t.statusApplied} ({stats.applied || 0})
                </button>
                <button
                    className={`filter-tab ${filterStatus === 'shortlisted' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('shortlisted')}
                >
                    {t.statusShortlisted} ({stats.shortlisted || 0})
                </button>
                <button
                    className={`filter-tab ${filterStatus === 'hired' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('hired')}
                >
                    {t.statusHired} ({stats.hired || 0})
                </button>
            </div>

            {/* Content */}
            <div className="applicants-list">
                {loading ? (
                    <div className="loading-spinner"></div>
                ) : filteredApplicants.length === 0 ? (
                    <div className="empty-state">
                        <p>{t.noApplicants}</p>
                    </div>
                ) : (
                    filteredApplicants.map(app => (
                        <div key={app._id} className="applicant-card">
                            <div className="applicant-header">
                                <div className="applicant-info">
                                    <div className="avatar-circle">
                                        {app.worker.avatar ? (
                                            <img src={app.worker.avatar} alt={app.worker.name} />
                                        ) : (
                                            app.worker.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3>{app.worker.name}</h3>
                                        <p className="location">📍 {app.worker.location}</p>
                                    </div>
                                </div>
                                <span className={`status-badge ${getStatusColor(app.status)}`}>
                                    {app.status}
                                </span>
                            </div>

                            <div className="applicant-stats">
                                <div className="stat-item">
                                    <span className="icon">⭐</span>
                                    <span>{app.worker.rating}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="icon">💼</span>
                                    <span>{app.worker.completedJobs} {t.jobsDone}</span>
                                </div>
                            </div>

                            <div className="skills-row">
                                {app.worker.skills.map((skill, idx) => (
                                    <span key={idx} className="skill-pill">
                                        {skill[language] || skill.en || skill}
                                    </span>
                                ))}
                            </div>

                            {app.message && (
                                <div className="cover-note">
                                    "{app.message}"
                                </div>
                            )}

                            <div className="card-actions" style={{
                                display: 'flex',
                                gap: '10px',
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid #eee'
                            }}>
                                {/* Call Button */}
                                <a
                                    href={`tel:${app.worker.phone}`}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '12px 16px',
                                        background: 'white',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '10px',
                                        color: '#333',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    📞 {t.call}
                                </a>

                                {/* Accept/Hire Button */}
                                {app.status !== 'hired' && app.status !== 'rejected' && (
                                    <button
                                        onClick={() => handleStatusChange(app._id, app.status === 'shortlisted' ? 'hired' : 'shortlisted')}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '12px 16px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: 'white',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {app.status === 'shortlisted' ? '✅ Hire Now' : '👍 Accept'}
                                    </button>
                                )}

                                {/* Reject Button */}
                                {app.status !== 'hired' && app.status !== 'rejected' && (
                                    <button
                                        onClick={() => handleStatusChange(app._id, 'rejected')}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            padding: '12px 16px',
                                            background: 'white',
                                            border: '2px solid #ff6b6b',
                                            borderRadius: '10px',
                                            color: '#ff6b6b',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        ❌ Reject
                                    </button>
                                )}

                                {/* Show status badge for hired/rejected */}
                                {app.status === 'hired' && (
                                    <div style={{
                                        flex: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '14px'
                                    }}>
                                        ✅ Hired Successfully
                                    </div>
                                )}

                                {app.status === 'rejected' && (
                                    <div style={{
                                        flex: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px',
                                        background: '#fff5f5',
                                        border: '1px solid #ffcdd2',
                                        borderRadius: '10px',
                                        color: '#e53935',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}>
                                        Not Selected
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default JobApplicants
