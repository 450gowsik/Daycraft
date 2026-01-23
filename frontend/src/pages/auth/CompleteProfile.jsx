import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import './Auth.css'
import MapPicker from '../../components/common/MapPicker.jsx'
import analytics from '../../utils/analytics'
import SuccessModal from '../../components/common/SuccessModal.jsx'


import { JOB_CATEGORIES, ROLES_BY_CATEGORY, ALL_SKILLS } from '../../constants/categories.js'




const DISTRICTS = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi',
    'Dindigul', 'Thanjavur', 'Ranipet', 'Virudhunagar', 'Karur',
    'Nilgiris', 'Krishnagiri', 'Kanyakumari', 'Cuddalore', 'Kancheepuram'
]

function CompleteProfile() {
    const { language } = useLanguage()
    const { user, updateProfile } = useAuth()
    const navigate = useNavigate()

    // If user already has a role from registration, skip step 0 (role selection)
    const [step, setStep] = useState(user?.role ? 1 : 0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [locationGranted, setLocationGranted] = useState(false)
    const [location, setLocation] = useState(null)
    const [manualLocation, setManualLocation] = useState('')
    const [showMap, setShowMap] = useState(false)
    const [activeCategory, setActiveCategory] = useState(JOB_CATEGORIES[0].id)

    // Step 1: Location Logic
    const renderLocationStep = () => (
        <div className="profile-step">
            <div className="step-icon">📍</div>
            <h2>{language === 'ta' ? 'உங்கள் இருப்பிடம்' : 'Your Location'}</h2>
            <p className="step-description">
                {language === 'ta'
                    ? 'வேலைகளைக் கண்டறிய நாங்கள் உங்கள் இருப்பிடத்தைப் பயன்படுத்துகிறோம்'
                    : 'We use your location to find jobs near you'}
            </p>

            {!locationGranted ? (
                <div className="location-options">
                    <button className="btn btn-outline btn-block mb-3" onClick={handleLocationRequest} disabled={loading}>
                        📍 {language === 'ta' ? 'தற்போதைய இருப்பிடத்தைப் பயன்படுத்தவும்' : 'Use Current Location'}
                    </button>

                    <div className="divider-text">OR</div>

                    <button className="btn btn-outline btn-block mb-3" onClick={() => setShowMap(true)}>
                        🗺️ {language === 'ta' ? 'வரைபடத்தில் பின் செய்யவும்' : 'Pin on Map'}
                    </button>

                    <input
                        type="text"
                        className="input w-full mb-3"
                        placeholder={language === 'ta' ? 'கைமுறையாக நகரத்தை உள்ளிடவும்' : 'Enter city manually (e.g. Chennai)'}
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                    />

                    {(manualLocation || location) && (
                        <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>
                            {language === 'ta' ? 'தொடர்க' : 'Continue'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="location-success">
                    <p>✅ {manualLocation || 'Location Detected'}</p>
                    <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>
                        {language === 'ta' ? 'தொடர்க' : 'Continue'}
                    </button>
                    <button className="btn btn-ghost btn-block btn-sm" onClick={() => setLocationGranted(false)}>
                        {language === 'ta' ? 'மாற்றவும்' : 'Change'}
                    </button>
                </div>
            )}

            {showMap && (
                <div className="map-modal-overlay">
                    <div className="map-modal">
                        <h3>{language === 'ta' ? 'இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்' : 'Pick Location'}</h3>
                        <div style={{ height: '300px', background: '#eee', marginBottom: '10px' }}>
                            {/* Map Integration */}
                            <MapPicker onLocationSelect={handleMapSelect} />
                        </div>
                        <button className="btn btn-ghost" onClick={() => setShowMap(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )

    // Step 2: Photo or Business Details
    const renderStep2 = () => {
        if (role === 'worker') {
            return (
                <div className="profile-step">
                    <div className="step-icon">📸</div>
                    <h2>{language === 'ta' ? 'சுயவிவரப் படம்' : 'Profile Photo'}</h2>
                    <p className="step-description">
                        {language === 'ta' ? 'ஒரு தெளிவான புகைப்படத்தைப் பதிவேற்றவும்' : 'Upload a clear photo of yourself'}
                    </p>

                    <div className="photo-upload-container" style={{ textAlign: 'center', margin: '20px 0' }}>
                        <div
                            className="photo-circle"
                            style={{
                                width: '100px', height: '100px', borderRadius: '50%', background: '#f0f0f0',
                                margin: '0 auto 15px', overflow: 'hidden', border: '2px solid #ddd',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '30px' }}>📷</span>
                            )}
                        </div>
                        <label className="btn btn-outline btn-sm">
                            {language === 'ta' ? 'புகைப்படத்தைத் தேர்வுசெய்யவும்' : 'Choose Photo'}
                            <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
                        </label>
                    </div>

                    <div className="step-actions">
                        <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                        <button className="btn btn-primary" onClick={() => setStep(3)}>Continue</button>
                    </div>
                </div>
            )
        } else {
            // Employer - Company Details
            return (
                <div className="profile-step">
                    <div className="step-icon">🏢</div>
                    <h2>{language === 'ta' ? 'நிறுவனத்தின் விவரங்கள்' : 'Company Details'}</h2>

                    <div className="form-group">
                        <label className="label">{language === 'ta' ? 'நிறுவனத்தின் பெயர்' : 'Company / Business Name'}</label>
                        <input
                            type="text" className="input w-full"
                            value={businessName} onChange={e => setBusinessName(e.target.value)}
                            placeholder="e.g. Star Constructions"
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">{language === 'ta' ? 'முகவரி' : 'Office Address'}</label>
                        <input
                            type="text" className="input w-full"
                            value={workLocation} onChange={e => setWorkLocation(e.target.value)}
                            placeholder="e.g. Anna Nagar, Chennai"
                        />
                    </div>

                    <div className="step-actions">
                        <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleComplete}
                            disabled={loading || !businessName}
                        >
                            {loading ? 'Saving...' : (language === 'ta' ? 'முடிக்கவும்' : 'Complete')}
                        </button>
                    </div>
                </div>
            )
        }
    }

    // Render Category Tabs
    const renderCategoryTabs = () => (
        <div className="category-tabs" style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '12px', marginBottom: '16px', scrollbarWidth: 'none' }}>
            {JOB_CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid #ddd',
                        background: activeCategory === cat.id ? '#14a800' : 'white',
                        color: activeCategory === cat.id ? 'white' : '#666',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ marginRight: '6px' }}>{cat.icon}</span>
                    {language === 'ta' ? cat.ta : cat.label}
                </button>
            ))}
        </div>
    )

    // Step 3: Skills (Worker only)
    const renderSkillsStep = () => (
        <div className="profile-step">
            <div className="step-icon">🛠️</div>
            <h2>{language === 'ta' ? 'உங்கள் திறன்களைத் தேர்ந்தெடுக்கவும்' : 'Select Your Skills'}</h2>
            <p className="step-description">
                {language === 'ta'
                    ? 'நீங்கள் செய்யக்கூடிய வேலைகளைத் தேர்ந்தெடுக்கவும்'
                    : 'Choose the jobs you can do'}
            </p>

            {renderCategoryTabs()}

            <div className="skills-grid">
                {ROLES_BY_CATEGORY[activeCategory]?.map(skill => (
                    <div
                        key={skill.id}
                        className={`skill-chip ${selectedSkills.includes(skill.id) ? 'selected' : ''}`}
                        onClick={() => toggleSkill(skill.id)}
                    >
                        <span className="skill-icon">🔹</span>
                        <span>{language === 'ta' ? skill.ta : skill.label}</span>
                        {selectedSkills.includes(skill.id) && <span className="check">✓</span>}
                    </div>
                ))}
            </div>

            <div className="step-actions">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>
                    {language === 'ta' ? 'பின் செல்' : 'Back'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleComplete}
                    disabled={loading || selectedSkills.length === 0}
                >
                    {loading ? (language === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (language === 'ta' ? 'சுயவிவரத்தை முடி' : 'Complete Profile')}
                </button>
            </div>

            {selectedSkills.length === 0 && (
                <p className="hint-text">{language === 'ta' ? 'குறைந்தது 1 திறனைத் தேர்ந்தெடுக்கவும்' : 'Select at least 1 skill'}</p>
            )}
        </div>
    )

    // ... (rest of code)

    const handleMapSelect = (latlng) => {
        setLocation({
            type: 'Point',
            coordinates: [latlng.lng, latlng.lat]
        })
        setManualLocation('Pinned on Map') // UI feedback
        setLocationGranted(true)
        // Don't auto advance, let them see the pin? 
        // Or auto advance like other methods. Let's wait for user to click "Continue" or auto-advance.
        // Actually rendering logic expects Step 2 if locationGranted.
        // But if I want them to see the map, maybe simply set locationGranted.
        // The renderLocationStep hides buttons if locationGranted.
        setStep(2)
    }

    // Worker fields
    const [selectedSkills, setSelectedSkills] = useState([])
    const [photo, setPhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState('')

    // Employer fields
    const [businessName, setBusinessName] = useState('')
    const [workLocation, setWorkLocation] = useState('')

    // Check if user already completed profile
    useEffect(() => {
        if (user?.profileCompleted) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    const isWorker = user?.role === 'worker'
    const totalSteps = isWorker ? 3 : 2

    // Request location permission
    const handleLocationRequest = () => {
        if (!navigator.geolocation) {
            setError(language === 'ta' ? 'இருப்பிடம் ஆதரிக்கப்படவில்லை' : 'Geolocation not supported')
            return
        }

        setLoading(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    type: 'Point',
                    coordinates: [position.coords.longitude, position.coords.latitude]
                })
                setLocationGranted(true)
                setLoading(false)
                setStep(2)
            },
            (err) => {
                setError(language === 'ta' ? 'இருப்பிடத்தை அணுக முடியவில்லை' : 'Could not access location')
                setLoading(false)
            }
        )
    }

    // Skip location
    const handleSkipLocation = () => {
        setStep(2)
    }

    // Handle photo upload
    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    // Toggle skill selection
    const toggleSkill = (skillId) => {
        setSelectedSkills(prev =>
            prev.includes(skillId)
                ? prev.filter(id => id !== skillId)
                : [...prev, skillId]
        )
    }

    const [role, setRole] = useState(user?.role || '') // Default to existing role if any

    // Step 0: Role Selection (New First Step)
    const renderRoleStep = () => (
        <div className="profile-step">
            <div className="step-icon">👤</div>
            <h2>{language === 'ta' ? 'நீங்கள் யார்?' : 'I am a'}</h2>
            <p className="step-description">
                {language === 'ta'
                    ? 'உங்கள் தேவையின் அடிப்படையில் ஒரு பாத்திரத்தைத் தேர்ந்தெடுக்கவும்'
                    : 'Choose a role based on your needs'}
            </p>

            <div className="role-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div
                    className={`role-card ${role === 'employer' ? 'selected' : ''}`}
                    onClick={() => setRole('employer')}
                    style={{
                        padding: '20px',
                        border: `2px solid ${role === 'employer' ? '#14a800' : '#ddd'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: role === 'employer' ? '#f0fdf4' : 'white',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>👔</div>
                    <h3 style={{ margin: 0, color: '#333' }}>{language === 'ta' ? 'வேலையளிப்பவர்' : 'Employer'}</h3>
                </div>

                <div
                    className={`role-card ${role === 'worker' ? 'selected' : ''}`}
                    onClick={() => setRole('worker')}
                    style={{
                        padding: '20px',
                        border: `2px solid ${role === 'worker' ? '#14a800' : '#ddd'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: role === 'worker' ? '#f0fdf4' : 'white',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>👷</div>
                    <h3 style={{ margin: 0, color: '#333' }}>{language === 'ta' ? 'வேலை தேடுபவர்' : 'Job Seeker'}</h3>
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#555' }}>
                    <input type="checkbox" defaultChecked />
                    {language === 'ta' ? 'சேவை விதிமுறைகளை ஏற்கிறேன்' : 'I agree to the Terms of Service'}
                </label>
            </div>

            <button
                className="btn btn-primary btn-block"
                onClick={() => setStep(1)}
                disabled={!role}
            >
                {language === 'ta' ? 'தொடர்க' : 'Continue'}
            </button>
        </div>
    )

    // Complete profile
    const handleComplete = async () => {
        setLoading(true)
        analytics.trackAction('profile_completion_started')
        setError('')

        try {
            const profileData = {
                profileCompleted: true,
                locationVerified: locationGranted,
                role: role // Save the selected role
            }

            if (location) {
                profileData.geoLocation = location
            } else if (manualLocation) {
                profileData.location = manualLocation
                // Default coordinates for manual entry (center of TN approx)
                profileData.geoLocation = {
                    type: 'Point',
                    coordinates: [78.6569, 11.1271]
                }
            }

            if (role === 'worker') {
                profileData.skills = selectedSkills.map(id => {
                    // Find skill in global list since SKILL_OPTIONS logic was removed
                    const flatSkill = ALL_SKILLS.find(s => s.id === id)
                    return { en: flatSkill?.label, ta: flatSkill?.ta }
                })
                if (photoPreview) {
                    profileData.avatar = photoPreview
                    profileData.photoVerified = true
                }
            } else {
                profileData.companyName = businessName
                profileData.location = workLocation
            }

            const result = await updateProfile(profileData)

            if (result.success) {
                setShowSuccess(true)
                analytics.trackAction('profile_completed_success', { role })

                // Show success for 2 seconds then navigate
                setTimeout(() => {
                    if (role === 'employer') {
                        navigate('/post-job')
                    } else {
                        navigate('/jobs')
                    }
                }, 2500);
            } else {
                setError(result.message || 'Failed to update profile')
            }
        } catch (err) {
            console.error(err)
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    // Dynamic Step Logic based on Role
    const isWorkerRole = role === 'worker'
    // Steps: 0=Role, 1=Location, 2=Photo/Biz, 3=Skills(Worker only)
    // If Employer: 0->1->2->Complete
    // If Worker: 0->1->2->3->Complete
    // But 'step' state starts at 0 now? Or let's keep 1-based and add 0.
    // Let's use step 0 for Role.

    // Determine current flow
    // Updated render logic below

    // Success Modal is handled at bottom of render


    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card complete-profile-card">
                    <div className="auth-header">
                        <span className="auth-logo">👤</span>
                        <h1 className="auth-title">
                            {language === 'ta' ? 'சுயவிவரத்தை முடிக்கவும்' : 'Complete Your Profile'}
                        </h1>
                    </div>

                    {/* Progress Indicator (Only show after step 0) */}
                    {step > 0 && (
                        <div className="profile-progress">
                            {/* Custom progress based on role */}
                            {[1, 2, ...(isWorkerRole ? [3] : [])].map((s) => (
                                <div
                                    key={s}
                                    className={`progress-step ${s <= step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
                                >
                                    {s < step ? '✓' : s}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    {step === 0 && renderRoleStep()}
                    {step === 1 && renderLocationStep()}
                    {step === 2 && renderStep2()}
                    {step === 3 && isWorkerRole && renderSkillsStep()}
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                title={language === 'ta' ? 'அற்புதம்!' : 'Profile Completed!'}
                subtitle={language === 'ta' ? 'உங்கள் டேஷ்போர்டிற்கு உங்களை அழைத்துச் செல்கிறோம்...' : 'Taking you to your professional dashboard...'}
            />
        </div>
    )
}

export default CompleteProfile
