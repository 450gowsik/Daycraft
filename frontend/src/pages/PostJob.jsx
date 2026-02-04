import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { JOB_CATEGORIES, ROLES_BY_CATEGORY } from '../constants/categories.js'
import LocationPicker from '../components/common/LocationPicker.jsx'
import './PostJob.css'

const API_URL = 'http://localhost:5000/api'

function PostJob() {
    const { language } = useLanguage()
    const { token, user, loading: authLoading } = useAuth()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        titleEn: '',
        titleTa: '',
        descriptionEn: '',
        descriptionTa: '',
        category: '',
        role: '',
        location: '',
        locationObj: null, // For LocationPicker
        geoLocation: null, // For GPS coordinates
        wage: '',
        wageType: 'daily',
        duration: '1 day',
        requiredWorkers: 1,
        urgent: false
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Available roles based on selected category
    const [availableRoles, setAvailableRoles] = useState([])

    // Check Profile Completion (role check handled by ProtectedRoute)
    useEffect(() => {
        if (authLoading || !user) return

        // Check Profile Completion - redirect to complete profile if not done
        if (!user.profileCompleted) {
            navigate('/complete-profile')
            return
        }
    }, [user, authLoading, navigate])

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <div className="post-job-page">
                <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        )
    }

    // Update available roles when category changes
    useEffect(() => {
        if (formData.category && ROLES_BY_CATEGORY[formData.category]) {
            setAvailableRoles(ROLES_BY_CATEGORY[formData.category])
        } else {
            setAvailableRoles([])
        }
    }, [formData.category])

    // Available roles based on selected category

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        if (name === 'category') {
            // Reset role when category changes
            setFormData(prev => ({
                ...prev,
                category: value,
                role: ''
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }))
        }
    }

    // Handle location selection from LocationPicker
    const handleLocationSelect = (locationObj) => {
        if (locationObj) {
            setFormData(prev => ({
                ...prev,
                location: locationObj.displayText || '',
                locationObj: locationObj,
                geoLocation: locationObj.coords || null
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                location: '',
                locationObj: null,
                geoLocation: null
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const jobData = {
                title: { en: formData.titleEn, ta: formData.titleTa },
                description: { en: formData.descriptionEn, ta: formData.descriptionTa },
                category: formData.category,
                role: formData.role,
                location: formData.location,
                wage: parseInt(formData.wage),
                wageType: formData.wageType,
                duration: formData.duration,
                requiredWorkers: parseInt(formData.requiredWorkers),
                urgent: formData.urgent
            }

            const response = await fetch(`${API_URL}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(jobData)
            })

            const data = await response.json()

            if (data.success) {
                navigate('/dashboard')
            } else {
                setError(data.message || 'Failed to post job')
            }
        } catch (err) {
            setError('Failed to post job. Please try again.')
        }

        setLoading(false)
    }

    return (
        <div className="post-job-page">
            <div className="container">
                <div className="post-job-header">
                    <h1>{language === 'en' ? 'Post a New Job' : 'புதிய வேலையை இடுங்கள்'}</h1>
                    <p>{language === 'en' ? 'Fill in the details to find workers for your job' : 'உங்கள் வேலைக்கு தொழிலாளர்களைக் கண்டுபிடிக்க விவரங்களை நிரப்பவும்'}</p>
                </div>

                <form className="post-job-form" onSubmit={handleSubmit}>
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-section">
                        <h3>{language === 'en' ? 'Job Title' : 'வேலை தலைப்பு'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{language === 'en' ? 'Title (English)' : 'தலைப்பு (ஆங்கிலம்)'} *</label>
                                <input
                                    type="text"
                                    name="titleEn"
                                    value={formData.titleEn}
                                    onChange={handleChange}
                                    placeholder="e.g., House Painting Work"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{language === 'en' ? 'Title (Tamil)' : 'தலைப்பு (தமிழ்)'}</label>
                                <input
                                    type="text"
                                    name="titleTa"
                                    value={formData.titleTa}
                                    onChange={handleChange}
                                    placeholder="எ.கா., வீடு வண்ணம் பூசும் வேலை"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>{language === 'en' ? 'Job Description' : 'வேலை விளக்கம்'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{language === 'en' ? 'Description (English)' : 'விளக்கம் (ஆங்கிலம்)'} *</label>
                                <textarea
                                    name="descriptionEn"
                                    value={formData.descriptionEn}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe the job requirements, skills needed, working hours..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{language === 'en' ? 'Description (Tamil)' : 'விளக்கம் (தமிழ்)'}</label>
                                <textarea
                                    name="descriptionTa"
                                    value={formData.descriptionTa}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="வேலை தேவைகள், தேவையான திறன்கள், வேலை நேரம்..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>{language === 'en' ? 'Job Details' : 'வேலை விவரங்கள்'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{language === 'en' ? 'Category' : 'வகை'} *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">{language === 'en' ? 'Select Category' : 'வகையைத் தேர்ந்தெடுக்கவும்'}</option>
                                    {JOB_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {language === 'ta' ? cat.ta : cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{language === 'en' ? 'Role' : 'பணி'} *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.category}
                                >
                                    <option value="">{language === 'en' ? 'Select Role' : 'பணியைத் தேர்ந்தெடுக்கவும்'}</option>
                                    {availableRoles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {language === 'ta' ? role.ta : role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{language === 'en' ? 'Location' : 'இடம்'} *</label>
                                <LocationPicker
                                    value={formData.locationObj}
                                    onChange={handleLocationSelect}
                                    placeholder={language === 'en' ? 'Select Location' : 'இடம் தேர்வு செய்க'}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>{language === 'en' ? 'Payment & Duration' : 'கட்டணம் & காலம்'}</h3>
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label>{language === 'en' ? 'Wage (₹)' : 'ஊதியம் (₹)'} *</label>
                                <input
                                    type="number"
                                    name="wage"
                                    value={formData.wage}
                                    onChange={handleChange}
                                    placeholder="500"
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{language === 'en' ? 'Wage Type' : 'ஊதிய வகை'}</label>
                                <select
                                    name="wageType"
                                    value={formData.wageType}
                                    onChange={handleChange}
                                >
                                    <option value="daily">{language === 'en' ? 'Per Day' : 'தினசரி'}</option>
                                    <option value="hourly">{language === 'en' ? 'Per Hour' : 'மணி நேரம்'}</option>
                                    <option value="fixed">{language === 'en' ? 'Fixed' : 'நிலையான'}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{language === 'en' ? 'Duration' : 'காலம்'}</label>
                                <input
                                    type="text"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    placeholder={language === 'en' ? '1 day, 1 week...' : '1 நாள், 1 வாரம்...'}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>{language === 'en' ? 'Additional Options' : 'கூடுதல் விருப்பங்கள்'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{language === 'en' ? 'Employees Needed' : 'தேவையான தொழிலாளர்கள்'}</label>
                                <input
                                    type="number"
                                    name="requiredWorkers"
                                    value={formData.requiredWorkers}
                                    onChange={handleChange}
                                    min="1"
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="urgent"
                                        checked={formData.urgent}
                                        onChange={handleChange}
                                    />
                                    <span className="urgent-label">
                                        🔥 {language === 'en' ? 'Mark as Urgent' : 'அவசரமாக குறி'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            {language === 'en' ? 'Cancel' : 'ரத்து செய்'}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading
                                ? (language === 'en' ? 'Posting...' : 'இடுகிறது...')
                                : (language === 'en' ? 'Post Job' : 'வேலையை இடு')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PostJob
