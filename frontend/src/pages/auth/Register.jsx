import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import LocationModal from '../../components/common/LocationModal.jsx'
import analytics from '../../utils/analytics'
import SuccessModal from '../../components/common/SuccessModal.jsx'
import './Auth.css'

function Register() {
    const { t, language } = useLanguage()
    const { register, sendOtp, verifyOtp, googleLogin, error, clearError } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        analytics.trackAction('signup_started');
        return () => clearError();
    }, [])

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: '',
        terms: false
    })

    const [registerMethod, setRegisterMethod] = useState('phone') // 'phone' or 'email'
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState('info') // info, otp, success
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState('')
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Ref to track role for use in callbacks
    const roleRef = useRef(formData.role)
    useEffect(() => {
        roleRef.current = formData.role
    }, [formData.role])

    const startGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Google Sign-In Success:', tokenResponse)
            const result = await googleLogin(
                tokenResponse.access_token,
                roleRef.current,
                selectedLocation?.displayText || '',
                selectedLocation?.coords ? {
                    type: 'Point',
                    coordinates: [selectedLocation.coords.lng, selectedLocation.coords.lat]
                } : undefined
            )

            if (result.success) {
                setShowSuccess(true)
                // Unified auth flow: redirect to dashboard
                setTimeout(() => navigate('/dashboard'), 2500)
            } else {
                setFormError(result.message || 'Google Sign-In Failed')
            }
        },
        onError: () => {
            setFormError('Google Sign-In Failed')
        }
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        setFormError('')
        clearError()
    }

    const getLocation = () => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // setLocation missing in previous version, using state if needed
            }
        )
    }

    const handleEmailRegister = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setFormError(language === 'ta' ? 'எல்லா விவரங்களையும் நிரப்பவும்' : 'Please fill in all details')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setFormError(language === 'ta' ? 'கடவுச்சொற்கள் பொருந்தவில்லை' : 'Passwords do not match')
            return
        }

        if (!formData.role) {
            setFormError(language === 'ta' ? 'தயவுசெய்து ஒரு பாத்திரத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select a role')
            return
        }

        if (!selectedLocation) {
            setFormError(language === 'ta' ? 'தயவுசெய்து உங்கள் இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select your location')
            return
        }

        if (!formData.terms) {
            setFormError(language === 'ta' ? 'விதிமுறைகளை ஏற்கவும்' : 'Please accept the terms and conditions')
            return
        }

        setLoading(true)
        setFormError('')

        const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            location: selectedLocation?.displayText || '',
            geoLocation: selectedLocation?.coords ? {
                type: 'Point',
                coordinates: [selectedLocation.coords.lng, selectedLocation.coords.lat]
            } : undefined,
            phone: formData.phone || undefined
        })

        if (result.success) {
            analytics.trackAction('registration_completed');
            setShowSuccess(true)
            setTimeout(() => navigate('/'), 2500)
        } else {
            setFormError(result.message || 'Registration failed')
        }
        setLoading(false)
    }

    const handleSubmit = (e) => {
        if (registerMethod === 'email') {
            handleEmailRegister(e)
        } else {
            handleSendOtp(e)
        }
    }

    const handleSendOtp = async (e) => {
        e.preventDefault()

        if (!formData.phone || !formData.name) {
            setFormError(language === 'ta' ? 'பெயர் மற்றும் தொலைபேசி எண்ணை நிரப்பவும்' : 'Please fill in name and phone number')
            return
        }

        if (!formData.role) {
            setFormError(language === 'ta' ? 'தயவுசெய்து ஒரு பாத்திரத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select a role')
            return
        }

        if (!selectedLocation) {
            setFormError(language === 'ta' ? 'தயவுசெய்து உங்கள் இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select your location')
            return
        }

        if (!formData.terms) {
            setFormError(language === 'ta' ? 'விதிமுறைகளை ஏற்கவும்' : 'Please accept the terms and conditions')
            return
        }

        setLoading(true)
        setFormError('')

        const result = await sendOtp(formData.phone)

        if (result.success) {
            setStep('otp')
            getLocation()
        } else {
            setFormError(result.message || 'Failed to send OTP')
        }
        setLoading(false)
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()

        if (!otp || otp.length !== 6) {
            setFormError(language === 'ta' ? 'சரியான 6-இலக்க OTP ஐ உள்ளிடவும்' : 'Please enter a valid 6-digit OTP')
            return
        }

        setLoading(true)
        setFormError('')

        const result = await verifyOtp({
            phone: formData.phone,
            otp,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            location: selectedLocation?.displayText || '',
            geoLocation: selectedLocation?.coords ? {
                type: 'Point',
                coordinates: [selectedLocation.coords.lng, selectedLocation.coords.lat]
            } : undefined
        })

        if (result.success) {
            setShowSuccess(true)
            // Auto-login happens in AuthContext, just redirect to home
            setTimeout(() => navigate('/'), 2500)
        } else {
            setFormError(result.message || 'Verification failed')
        }
        setLoading(false)
    }

    // Success Modal is handled at bottom of render


    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <span className="auth-logo">🛠️</span>
                        <h1 className="auth-title">{t('auth.register.title')}</h1>
                        <p className="auth-subtitle">{step === 'info' ? t('auth.register.subtitle') : (language === 'ta' ? 'உங்கள் போன் நம்பரை சரிபார்க்கவும்' : 'Verify your phone number')}</p>
                    </div>

                    {(formError || error) && (
                        <div className="auth-error">
                            {formError || error}
                        </div>
                    )}

                    {step === 'info' ? (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="login-method-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    className={`btn btn-block ${registerMethod === 'phone' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setRegisterMethod('phone')}
                                    style={{ flex: 1 }}
                                >
                                    Phone
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-block ${registerMethod === 'email' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setRegisterMethod('email')}
                                    style={{ flex: 1 }}
                                >
                                    Email
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="label">{t('auth.register.role')}</label>
                                <div className={`role-selector ${formError && !formData.role ? 'error-border' : ''}`}>
                                    <div
                                        className={`role-option ${formData.role === 'employer' ? 'active' : ''}`}
                                        onClick={() => !loading && setFormData(p => ({ ...p, role: 'employer' }))}
                                    >
                                        <span className="role-icon">👔</span>
                                        <span>{t('auth.register.employer')}</span>
                                    </div>
                                    <div
                                        className={`role-option ${formData.role === 'worker' ? 'active' : ''}`}
                                        onClick={() => !loading && setFormData(p => ({ ...p, role: 'worker' }))}
                                    >
                                        <span className="role-icon">👷</span>
                                        <span>{t('auth.register.worker')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="label">{language === 'ta' ? 'இருப்பிடம்' : 'Location'}</label>
                                <button
                                    type="button"
                                    className={`btn btn-block ${!selectedLocation && formError ? 'error-border' : ''}`}
                                    onClick={() => setIsLocationModalOpen(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'white',
                                        border: '2px solid #e2e8f0',
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        color: selectedLocation ? '#1e293b' : '#94a3b8'
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>📍</span>
                                    <span style={{ flex: 1 }}>
                                        {selectedLocation ? selectedLocation.displayText : (language === 'ta' ? 'இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்' : 'Select your location')}
                                    </span>
                                    <span>▶</span>
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="label">{t('auth.register.name')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input w-full"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {registerMethod === 'email' ? (
                                <>
                                    <button
                                        type="button"
                                        className="google-btn"
                                        onClick={() => {
                                            if (!formData.role) {
                                                setFormError(language === 'ta' ? 'தொடர ஒரு பாத்திரத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select a role to continue')
                                                return
                                            }
                                            setFormError('')
                                            startGoogleLogin()
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            width: '100%',
                                            padding: '12px',
                                            background: 'white',
                                            border: '2px solid #e0e0e0',
                                            borderRadius: '8px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#333',
                                            cursor: 'pointer',
                                            marginTop: '16px',
                                            marginBottom: '16px'
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        {t('auth.login.google')}
                                    </button>

                                    <div className="divider" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 16px' }}>
                                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                                        <span style={{ fontSize: '13px', color: '#999' }}>or</span>
                                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                                    </div>

                                    <div className="form-group">
                                        <label className="label">{language === 'ta' ? 'மின்னஞ்சல்' : 'Email Address'}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="input w-full"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">{t('auth.login.password')}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="input w-full"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">{language === 'ta' ? 'கடவுச்சொல்லை உறுதிப்படுத்தவும்' : 'Confirm Password'}</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            className="input w-full"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="form-group">
                                    <label className="label">{t('auth.register.phone')}</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="input w-full"
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-sm mt-2">
                                <input
                                    type="checkbox"
                                    name="terms"
                                    className="checkbox"
                                    id="terms"
                                    checked={formData.terms}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                                <label htmlFor="terms" className="text-sm text-secondary cursor-pointer">
                                    {t('auth.register.terms')}
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={loading}>
                                {loading ? (language === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Loading...') : (registerMethod === 'email' ? (language === 'ta' ? 'பதிவு செய்யவும்' : 'Register') : (language === 'ta' ? 'OTP அனுப்பவும்' : 'Send Verification OTP'))}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="auth-form">
                            <div className="otp-wrapper">
                                <label className="label text-center">
                                    {language === 'ta' ? `${formData.phone} எண்ணிற்கு அனுப்பப்பட்ட 6 ஐலக்க OTP ஐ உள்ளிடவும்` : `Enter 6-Digit OTP sent to ${formData.phone}`}
                                </label>
                                <input
                                    type="text"
                                    className="otp-input-field"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                    required
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                                {loading ? (language === 'ta' ? 'சரிபார்க்கப்படுகிறது...' : 'Verifying...') : (language === 'ta' ? 'சரிபார் & முடி' : 'Verify & Complete')}
                            </button>

                            <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep('info')} disabled={loading}>
                                {language === 'ta' ? 'எண்ணை மாற்றவும்' : 'Change Phone Number'}
                            </button>
                        </form>
                    )}

                    <div className="auth-footer">
                        {t('auth.register.hasAccount')}{' '}
                        <Link to="/login">{t('auth.register.login')}</Link>
                    </div>

                    <LocationModal
                        isOpen={isLocationModalOpen}
                        onClose={() => setIsLocationModalOpen(false)}
                        onSelect={(loc) => {
                            setSelectedLocation(loc)
                            setFormError('')
                        }}
                        selectedLocation={selectedLocation}
                    />
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                title={language === 'ta' ? 'அற்புதம்!' : 'Welcome to DayCraft!'}
                subtitle={language === 'ta' ? 'உங்கள் கணக்கை உருவாக்குகிறோம்...' : 'Creating your professional account...'}
            />
        </div>
    )
}

export default Register
