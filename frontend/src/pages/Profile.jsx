import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Profile.css'

function Profile() {
    const { t, language } = useLanguage()
    const { user, updateProfile, isWorker, isEmployer } = useAuth()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        bio: '',
        // Worker fields
        skills: [],
        experience: '',
        availability: 'available',
        dailyRate: 0,
        // Employer fields
        companyName: '',
        companyDescription: '',
        industry: ''
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [newSkill, setNewSkill] = useState({ en: '', ta: '' })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                location: user.location || '',
                bio: user.bio || '',
                skills: user.skills || [],
                experience: user.experience || '',
                availability: user.availability || 'available',
                dailyRate: user.dailyRate || 0,
                companyName: user.companyName || '',
                companyDescription: user.companyDescription || '',
                industry: user.industry || ''
            })
        }
    }, [user])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'dailyRate' ? parseInt(value) || 0 : value
        }))
    }

    const addSkill = () => {
        if (newSkill.en.trim()) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, { en: newSkill.en.trim(), ta: newSkill.ta.trim() }]
            }))
            setNewSkill({ en: '', ta: '' })
        }
    }

    const removeSkill = (index) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        const result = await updateProfile(formData)

        if (result.success) {
            setMessage({ type: 'success', text: language === 'en' ? 'Profile updated successfully!' : 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' })
        } else {
            setMessage({ type: 'error', text: result.message })
        }

        setLoading(false)
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="profile-loading">Loading...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-header">
                    <h1>{language === 'en' ? 'My Profile' : 'என் சுயவிவரம்'}</h1>
                    <p>{language === 'en' ? 'Manage your account information' : 'உங்கள் கணக்கு தகவலை நிர்வகிக்கவும்'}</p>
                </div>

                <div className="profile-content">
                    <div className="profile-sidebar">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} />
                                ) : (
                                    <span>{user.name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            <h3>{user.name}</h3>
                            <span className={`role-badge ${user.role}`}>
                                {user.role === 'worker' ? '👷 Worker' : user.role === 'employer' ? '👔 Employer' : '⚙️ Admin'}
                            </span>
                            <p className="profile-email">{user.email}</p>
                        </div>

                        <div className="profile-stats">
                            {isWorker && (
                                <>
                                    <div className="stat-item">
                                        <span className="stat-value">{user.completedJobs || 0}</span>
                                        <span className="stat-label">{language === 'en' ? 'Jobs Done' : 'முடிந்த வேலைகள்'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">⭐ {user.rating || 0}</span>
                                        <span className="stat-label">{language === 'en' ? 'Rating' : 'மதிப்பீடு'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <form className="profile-form" onSubmit={handleSubmit}>
                        {message.text && (
                            <div className={`profile-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="form-section">
                            <h3>{language === 'en' ? 'Basic Information' : 'அடிப்படை தகவல்'}</h3>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{language === 'en' ? 'Full Name' : 'முழு பெயர்'}</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{language === 'en' ? 'Phone Number' : 'தொலைபேசி எண்'}</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>{language === 'en' ? 'Location' : 'இடம்'}</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder={language === 'en' ? 'City, District' : 'நகரம், மாவட்டம்'}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>{language === 'en' ? 'Bio' : 'சுயகுறிப்பு'}</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder={language === 'en' ? 'Tell us about yourself...' : 'உங்களைப் பற்றி சொல்லுங்கள்...'}
                                    />
                                </div>
                            </div>
                        </div>

                        {isWorker && (
                            <div className="form-section">
                                <h3>{language === 'en' ? 'Work Details' : 'வேலை விவரங்கள்'}</h3>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{language === 'en' ? 'Experience' : 'அனுபவம்'}</label>
                                        <input
                                            type="text"
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            placeholder={language === 'en' ? 'e.g., 5 years' : 'எ.கா., 5 ஆண்டுகள்'}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>{language === 'en' ? 'Daily Rate (₹)' : 'தினசரி ஊதியம் (₹)'}</label>
                                        <input
                                            type="number"
                                            name="dailyRate"
                                            value={formData.dailyRate}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>{language === 'en' ? 'Availability' : 'கிடைக்கும் நிலை'}</label>
                                        <select
                                            name="availability"
                                            value={formData.availability}
                                            onChange={handleChange}
                                        >
                                            <option value="available">{language === 'en' ? 'Available' : 'கிடைக்கும்'}</option>
                                            <option value="busy">{language === 'en' ? 'Busy' : 'பிஸி'}</option>
                                            <option value="unavailable">{language === 'en' ? 'Unavailable' : 'கிடைக்காது'}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>{language === 'en' ? 'Skills' : 'திறன்கள்'}</label>
                                    <div className="skills-container">
                                        {formData.skills.map((skill, index) => (
                                            <span key={index} className="skill-tag">
                                                {language === 'ta' && skill.ta ? skill.ta : skill.en}
                                                <button type="button" onClick={() => removeSkill(index)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="add-skill-row">
                                        <input
                                            type="text"
                                            placeholder={language === 'en' ? 'Skill (English)' : 'திறன் (ஆங்கிலம்)'}
                                            value={newSkill.en}
                                            onChange={(e) => setNewSkill(prev => ({ ...prev, en: e.target.value }))}
                                        />
                                        <input
                                            type="text"
                                            placeholder={language === 'en' ? 'Skill (Tamil)' : 'திறன் (தமிழ்)'}
                                            value={newSkill.ta}
                                            onChange={(e) => setNewSkill(prev => ({ ...prev, ta: e.target.value }))}
                                        />
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addSkill}>
                                            {language === 'en' ? 'Add' : 'சேர்'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEmployer && (
                            <div className="form-section">
                                <h3>{language === 'en' ? 'Company Details' : 'நிறுவன விவரங்கள்'}</h3>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{language === 'en' ? 'Company Name' : 'நிறுவன பெயர்'}</label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>{language === 'en' ? 'Industry' : 'தொழில்துறை'}</label>
                                        <input
                                            type="text"
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleChange}
                                            placeholder={language === 'en' ? 'e.g., Construction' : 'எ.கா., கட்டுமானம்'}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>{language === 'en' ? 'Company Description' : 'நிறுவன விளக்கம்'}</label>
                                        <textarea
                                            name="companyDescription"
                                            value={formData.companyDescription}
                                            onChange={handleChange}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (language === 'en' ? 'Saving...' : 'சேமிக்கிறது...') : (language === 'en' ? 'Save Changes' : 'மாற்றங்களைச் சேமி')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Profile
