import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import adminService from '../services/adminService'
import './Admin.css'

const API_URL = 'http://localhost:5000/api'

function AdminDashboard() {
    const { language } = useLanguage()
    const { token } = useAuth()
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [jobs, setJobs] = useState([])
    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [activeTab])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'overview' || !stats) {
                const data = await adminService.getStats()
                if (data.success) setStats(data.stats)
            }

            if (activeTab === 'users') {
                const data = await adminService.getUsers()
                if (data.success) setUsers(data.users)
            }

            if (activeTab === 'jobs') {
                const data = await adminService.getJobs()
                if (data.success) setJobs(data.jobs)
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error)
        }
        setLoading(false)
    }

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const data = await adminService.updateUserStatus(userId, !currentStatus)
            if (data.success) {
                setUsers(users.map(u => u._id === userId ? data.user : u))
            }
        } catch (error) {
            console.error('Failed to update user:', error)
        }
    }

    const deleteJob = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job?')) return
        try {
            // Reusing existing logic if needed or implementing in adminService
            const res = await fetch(`${API_URL}/admin/jobs/${jobId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setJobs(jobs.filter(j => j._id !== jobId))
            }
        } catch (error) {
            console.error('Failed to delete job:', error)
        }
    }

    return (
        <div className="admin-page">
            <div className="container">
                <div className="admin-header">
                    <h1>⚙️ {language === 'en' ? 'Admin Dashboard' : 'நிர்வாக டாஷ்போர்டு'}</h1>
                </div>

                <div className="admin-tabs">
                    <button
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 {language === 'en' ? 'Overview' : 'கண்ணோட்டம்'}
                    </button>
                    <button
                        className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 {language === 'en' ? 'Users' : 'பயனர்கள்'}
                    </button>
                    <button
                        className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        📋 {language === 'en' ? 'Jobs' : 'வேலைகள்'}
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'overview' && stats && (
                            <div className="admin-overview">
                                <div className="stats-row">
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">👥</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalUsers}</span>
                                            <span className="stat-label">{language === 'en' ? 'Total Users' : 'மொத்த பயனர்கள்'}</span>
                                        </div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">👷</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalWorkers}</span>
                                            <span className="stat-label">{language === 'en' ? 'Workers' : 'தொழிலாளர்கள்'}</span>
                                        </div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">👔</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalEmployers}</span>
                                            <span className="stat-label">{language === 'en' ? 'Employers' : 'முதலாளிகள்'}</span>
                                        </div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">📋</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.totalJobs}</span>
                                            <span className="stat-label">{language === 'en' ? 'Total Jobs' : 'மொத்த வேலைகள்'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="stats-row">
                                    <div className="admin-stat-card highlight">
                                        <span className="stat-icon">🟢</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.activeJobs}</span>
                                            <span className="stat-label">{language === 'en' ? 'Active Jobs' : 'செயலில் உள்ள வேலைகள்'}</span>
                                        </div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">✅</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.completedJobs}</span>
                                            <span className="stat-label">{language === 'en' ? 'Completed' : 'முடிந்தவை'}</span>
                                        </div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">💰</span>
                                        <div className="stat-info">
                                            <span className="stat-value">₹{stats.totalVolume?.toLocaleString()}</span>
                                            <span className="stat-label">{language === 'en' ? 'Total Volume' : 'மொத்த அளவு'}</span>
                                        </div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">📈</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.recentUsers}</span>
                                            <span className="stat-label">{language === 'en' ? 'New Users (7d)' : 'புதிய பயனர்கள் (7நா)'}</span>
                                        </div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <span className="stat-icon">📝</span>
                                        <div className="stat-info">
                                            <span className="stat-value">{stats.recentJobs}</span>
                                            <span className="stat-label">{language === 'en' ? 'New Jobs (7d)' : 'புதிய வேலைகள் (7நா)'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="admin-section">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>{language === 'en' ? 'Name' : 'பெயர்'}</th>
                                            <th>{language === 'en' ? 'Email' : 'மின்னஞ்சல்'}</th>
                                            <th>{language === 'en' ? 'Role' : 'பங்கு'}</th>
                                            <th>{language === 'en' ? 'Status' : 'நிலை'}</th>
                                            <th>{language === 'en' ? 'Actions' : 'செயல்கள்'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user._id}>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    {/* Handle both roles array and legacy role */}
                                                    {(user.roles || [user.role]).map(role => (
                                                        <span key={role} className={`role-tag ${role}`}>{role}</span>
                                                    ))}
                                                </td>
                                                <td>
                                                    <span className={`status-tag ${user.isActive ? 'active' : 'suspended'}`}>
                                                        {user.isActive ? 'Active' : 'Suspended'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                                                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                                                    >
                                                        {user.isActive ? 'Suspend' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'jobs' && (
                            <div className="admin-section">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>{language === 'en' ? 'Title' : 'தலைப்பு'}</th>
                                            <th>{language === 'en' ? 'Employer' : 'முதலாளி'}</th>
                                            <th>{language === 'en' ? 'Location' : 'இடம்'}</th>
                                            <th>{language === 'en' ? 'Wage' : 'ஊதியம்'}</th>
                                            <th>{language === 'en' ? 'Status' : 'நிலை'}</th>
                                            <th>{language === 'en' ? 'Actions' : 'செயல்கள்'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map(job => (
                                            <tr key={job._id}>
                                                <td>{job.title?.en || job.title}</td>
                                                <td>{job.employer?.name}</td>
                                                <td>{job.location}</td>
                                                <td>₹{job.wage}</td>
                                                <td>
                                                    <span className={`status-tag ${job.status}`}>{job.status}</span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => deleteJob(job._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard
