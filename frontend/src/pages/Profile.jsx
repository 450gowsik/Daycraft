import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LocationPicker from '../components/common/LocationPicker.jsx';
import { 
    FiUser, 
    FiBriefcase, 
    FiCheckCircle, 
    FiX, 
    FiShield, 
    FiAlertCircle, 
    FiMapPin 
} from 'react-icons/fi';
import './Profile.css';

function Profile() {
    const { language } = useLanguage();
    const { user, profile, role, isWorker, isEmployer, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        locationObj: null,
        geoLocation: null,
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
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [newSkill, setNewSkill] = useState({ en: '', ta: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                location: user.location || '',
                locationObj: user.location ? { displayText: user.location } : null,
                geoLocation: user.geoLocation || null,
                bio: profile?.bio || '',
                // Worker profile data
                skills: profile?.skills || [],
                experience: profile?.experience || '',
                availability: profile?.availability || 'available',
                dailyRate: profile?.dailyRate || 0,
                // Employer profile data
                companyName: profile?.companyName || '',
                companyDescription: profile?.companyDescription || '',
                industry: profile?.industry || ''
            });
        }
    }, [user, profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'dailyRate' ? parseInt(value) || 0 : value
        }));
    };

    const handleLocationSelect = (locationObj) => {
        if (locationObj) {
            setFormData(prev => ({
                ...prev,
                location: locationObj.displayText || '',
                locationObj: locationObj,
                geoLocation: locationObj.coords || null
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                location: '',
                locationObj: null,
                geoLocation: null
            }));
        }
    };

    const addSkill = () => {
        if (newSkill.en.trim()) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, { en: newSkill.en.trim(), ta: newSkill.ta.trim() }]
            }));
            setNewSkill({ en: '', ta: '' });
        }
    };

    const removeSkill = (index) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const result = await updateProfile(formData);

        if (result.success) {
            setMessage({ 
                type: 'success', 
                text: language === 'en' ? 'Profile updated successfully!' : 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' 
            });
            // Clear message after 4 seconds
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
        }

        setLoading(false);
    };

    const getRoleDisplay = (role) => {
        if (role === 'worker') return language === 'en' ? 'Employee' : 'பணியாளர்';
        if (role === 'employer') return language === 'en' ? 'Job Provider' : 'வேலை வழங்குநர்';
        if (role === 'admin') return language === 'en' ? 'Admin' : 'நிர்வாகி';
        return role;
    };

    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-loader">{language === 'en' ? 'Loading profile data...' : 'சுயவிவர தரவை ஏற்றுகிறது...'}</div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            
            {/* Top Banner Cover */}
            <div className="profile-banner-bg">
                <div className="profile-banner-glow"></div>
                <div className="profile-banner-content"></div>
            </div>

            {/* Profile Workspace Container */}
            <div className="profile-container">
                <div className="profile-main-grid">
                    
                    {/* Left Column: Sidebar Card */}
                    <div className="profile-sidebar-card">
                        
                        {/* Avatar */}
                        <div className="profile-avatar-container">
                            <div className="profile-avatar-wrapper">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} />
                                ) : (
                                    <span>{user.name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                        </div>

                        {/* Name & Mail */}
                        <h2 className="profile-username">{user.name}</h2>
                        <p className="profile-email-label">{user.email || user.phone}</p>

                        {/* Role Badge */}
                        <span className={`profile-role-badge ${role}`}>
                            {role === 'worker' ? '👷' : role === 'employer' ? '👔' : '⚙️'} {getRoleDisplay(role)}
                        </span>

                        {/* Stats Info */}
                        <div className="profile-stats-card">
                            {isWorker && (
                                <>
                                    <div className="sidebar-stat-box">
                                        <span className="val">{profile?.completedJobs || 0}</span>
                                        <span className="lbl">{language === 'en' ? 'Jobs Done' : 'முடிந்தவை'}</span>
                                    </div>
                                    <div className="sidebar-stat-box">
                                        <span className="val">⭐ {profile?.rating || '0.0'}</span>
                                        <span className="lbl">{language === 'en' ? 'Rating' : 'மதிப்பீடு'}</span>
                                    </div>
                                </>
                            )}
                            {isEmployer && (
                                <>
                                    <div className="sidebar-stat-box">
                                        <span className="val">{profile?.totalJobsPosted || 0}</span>
                                        <span className="lbl">{language === 'en' ? 'Posted' : 'வெளியிட்டவை'}</span>
                                    </div>
                                    <div className="sidebar-stat-box">
                                        <span className="val">{profile?.totalHires || 0}</span>
                                        <span className="lbl">{language === 'en' ? 'Hires' : 'பணியமர்த்தல்'}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Trust / Verification Checklist */}
                        <div className="profile-trust-list">
                            <h4>{language === 'en' ? 'Verifications' : 'சரிபார்ப்புகள்'}</h4>
                            <div className="trust-item">
                                {user.idVerified ? (
                                    <FiCheckCircle className="trust-icon-verified" />
                                ) : (
                                    <FiAlertCircle className="trust-icon-pending" />
                                )}
                                <span>{language === 'en' ? 'ID Verification' : 'அடையாள சரிபார்ப்பு'}</span>
                            </div>
                            <div className="trust-item">
                                {user.phoneVerified || user.phone ? (
                                    <FiCheckCircle className="trust-icon-verified" />
                                ) : (
                                    <FiAlertCircle className="trust-icon-pending" />
                                )}
                                <span>{language === 'en' ? 'Phone Number' : 'தொலைபேசி எண்'}</span>
                            </div>
                            <div className="trust-item">
                                {user.emailVerified || user.email ? (
                                    <FiCheckCircle className="trust-icon-verified" />
                                ) : (
                                    <FiAlertCircle className="trust-icon-pending" />
                                )}
                                <span>{language === 'en' ? 'Email Verification' : 'மின்னஞ்சல் சரிபார்ப்பு'}</span>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Form Card Panel */}
                    <div className="profile-form-area">
                        
                        {/* Status Message */}
                        {message.text && (
                            <div className={`profile-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            {/* General Details Panel */}
                            <div className="profile-card-panel">
                                <div className="profile-card-header">
                                    <h3>
                                        <FiUser className="profile-card-header-icon" /> 
                                        {language === 'en' ? 'Basic Information' : 'அடிப்படை தகவல்'}
                                    </h3>
                                </div>

                                <div className="form-grid-2col">
                                    <div className="form-group-wrap">
                                        <label>{language === 'en' ? 'Full Name' : 'முழு பெயர்'}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="profile-input-field"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group-wrap">
                                        <label>{language === 'en' ? 'Phone Number' : 'தொலைபேசி எண்'}</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="profile-input-field"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group-wrap full-width">
                                        <label>{language === 'en' ? 'Location' : 'இடம்'}</label>
                                        <LocationPicker
                                            value={formData.locationObj}
                                            onChange={handleLocationSelect}
                                            placeholder={language === 'en' ? 'Select Location' : 'இடம் தேர்வு செய்க'}
                                        />
                                    </div>

                                    <div className="form-group-wrap full-width">
                                        <label>{language === 'en' ? 'Bio' : 'சுயகுறிப்பு'}</label>
                                        <textarea
                                            name="bio"
                                            className="profile-input-field"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder={language === 'en' ? 'Tell us about yourself...' : 'உங்களைப் பற்றி சொல்லுங்கள்...'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Worker specific Panel */}
                            {isWorker && (
                                <div className="profile-card-panel">
                                    <div className="profile-card-header">
                                        <h3>
                                            <FiBriefcase className="profile-card-header-icon" />
                                            {language === 'en' ? 'Work Details & Skills' : 'வேலை விவரங்கள் & திறன்கள்'}
                                        </h3>
                                    </div>

                                    <div className="form-grid-2col">
                                        <div className="form-group-wrap">
                                            <label>{language === 'en' ? 'Experience Level' : 'அனுபவம்'}</label>
                                            <input
                                                type="text"
                                                name="experience"
                                                className="profile-input-field"
                                                value={formData.experience}
                                                onChange={handleChange}
                                                placeholder={language === 'en' ? 'e.g. 5 years' : 'எ.கா., 5 ஆண்டுகள்'}
                                            />
                                        </div>

                                        <div className="form-group-wrap">
                                            <label>{language === 'en' ? 'Daily Rate (₹)' : 'தினசரி ஊதியம் (₹)'}</label>
                                            <input
                                                type="number"
                                                name="dailyRate"
                                                className="profile-input-field"
                                                value={formData.dailyRate}
                                                onChange={handleChange}
                                                min="0"
                                            />
                                        </div>

                                        <div className="form-group-wrap full-width">
                                            <label>{language === 'en' ? 'Availability Status' : 'கிடைக்கும் நிலை'}</label>
                                            <select
                                                name="availability"
                                                className="profile-input-field"
                                                value={formData.availability}
                                                onChange={handleChange}
                                            >
                                                <option value="available">{language === 'en' ? 'Available to work' : 'கிடைக்கும்'}</option>
                                                <option value="busy">{language === 'en' ? 'Busy on other projects' : 'பிஸி'}</option>
                                                <option value="unavailable">{language === 'en' ? 'Currently Unavailable' : 'கிடைக்காது'}</option>
                                            </select>
                                        </div>

                                        <div className="form-group-wrap full-width">
                                            <label>{language === 'en' ? 'Skills' : 'திறன்கள்'}</label>
                                            
                                            {/* Skill tags */}
                                            <div className="profile-skills-box">
                                                {formData.skills.map((skill, index) => (
                                                    <span key={index} className="profile-skill-badge">
                                                        {language === 'ta' && skill.ta ? skill.ta : skill.en}
                                                        <button type="button" onClick={() => removeSkill(index)}>
                                                            <FiX size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Add Skill row */}
                                            <div className="profile-add-skill-row">
                                                <input
                                                    type="text"
                                                    className="profile-input-field"
                                                    placeholder={language === 'en' ? 'Skill (English)' : 'திறன் (ஆங்கிலம்)'}
                                                    value={newSkill.en}
                                                    onChange={(e) => setNewSkill(prev => ({ ...prev, en: e.target.value }))}
                                                />
                                                <input
                                                    type="text"
                                                    className="profile-input-field"
                                                    placeholder={language === 'en' ? 'Skill (Tamil)' : 'திறன் (தமிழ்)'}
                                                    value={newSkill.ta}
                                                    onChange={(e) => setNewSkill(prev => ({ ...prev, ta: e.target.value }))}
                                                />
                                                <button type="button" className="btn-premium-add-skill" onClick={addSkill}>
                                                    {language === 'en' ? 'Add' : 'சேர்'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Employer specific Panel */}
                            {isEmployer && (
                                <div className="profile-card-panel">
                                    <div className="profile-card-header">
                                        <h3>
                                            <FiBriefcase className="profile-card-header-icon" />
                                            {language === 'en' ? 'Company Details' : 'நிறுவன விவரங்கள்'}
                                        </h3>
                                    </div>

                                    <div className="form-grid-2col">
                                        <div className="form-group-wrap">
                                            <label>{language === 'en' ? 'Company Name' : 'நிறுவன பெயர்'}</label>
                                            <input
                                                type="text"
                                                name="companyName"
                                                className="profile-input-field"
                                                value={formData.companyName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="form-group-wrap">
                                            <label>{language === 'en' ? 'Industry Sector' : 'தொழில்துறை'}</label>
                                            <input
                                                type="text"
                                                name="industry"
                                                className="profile-input-field"
                                                value={formData.industry}
                                                onChange={handleChange}
                                                placeholder={language === 'en' ? 'e.g. Construction' : 'எ.கா., கட்டுமானம்'}
                                            />
                                        </div>

                                        <div className="form-group-wrap full-width">
                                            <label>{language === 'en' ? 'Company description' : 'நிறுவன விளக்கம்'}</label>
                                            <textarea
                                                name="companyDescription"
                                                className="profile-input-field"
                                                value={formData.companyDescription}
                                                onChange={handleChange}
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Form buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <button
                                    type="submit"
                                    className="btn-premium-save"
                                    disabled={loading}
                                >
                                    {loading ? (language === 'en' ? 'Saving changes...' : 'சேமிக்கிறது...') : (language === 'en' ? 'Save Profile' : 'சுயவிவரம் சேமி')}
                                </button>
                            </div>

                        </form>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default Profile;
