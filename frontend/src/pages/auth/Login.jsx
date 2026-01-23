import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import analytics from '../../utils/analytics'
import SuccessModal from '../../components/common/SuccessModal.jsx'
import './Auth.css'

function Login() {
    const { t, language } = useLanguage()
    const { login, sendOtp, verifyOtp, error, clearError } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
    const [otp, setOtp] = useState('')
    const [otpSent, setOtpSent] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
        remember: false
    })
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        analytics.trackAction('login_started');
        return () => clearError();
    }, [])

    const handleSendOtp = async (e) => {
        e.preventDefault()
        if (!formData.phone) {
            setFormError(language === 'ta' ? 'தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter phone number')
            return
        }

        setLoading(true)
        setFormError('')

        const result = await sendOtp(formData.phone)

        if (result.success) {
            setOtpSent(true)
        } else {
            setFormError(result.message || 'Failed to send OTP')
        }
        setLoading(false)
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        if (!otp || otp.length !== 6) {
            setFormError(language === 'ta' ? 'சரியான OTP ஐ உள்ளிடவும்' : 'Please enter valid OTP')
            return
        }

        setLoading(true)
        setFormError('')

        const result = await verifyOtp({
            phone: formData.phone,
            otp
        })

        if (result.success) {
            setShowSuccess(true)
            setTimeout(() => navigate(from, { replace: true }), 2500)
        } else {
            if (result.isNewUser || result.message?.includes('Name is required')) {
                setFormError(language === 'ta' ? 'கணக்கு காணப்படவில்லை. பதிவு செய்யவும்.' : 'Account not found. Please register.')
            } else {
                setFormError(result.message || 'Verification failed')
            }
        }
        setLoading(false)
    }

    const from = location.state?.from?.pathname || '/dashboard'

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        setFormError('')
        clearError()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setFormError('')

        const result = await login(formData.email, formData.password)

        if (result.success) {
            analytics.trackAction('login_success');
            setShowSuccess(true)
            setTimeout(() => navigate(from, { replace: true }), 2500)
        } else {
            setFormError(result.message || 'Login failed')
        }

        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <span className="auth-logo">🛠️</span>
                        <h1 className="auth-title">{t('auth.login.title')}</h1>
                        <p className="auth-subtitle">{t('auth.login.subtitle')}</p>
                    </div>

                    {(formError || error) && (
                        <div className="auth-error">
                            {formError || error}
                        </div>
                    )}

                    <div className="login-method-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button
                            className={`btn btn-block ${loginMethod === 'email' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setLoginMethod('email')}
                            style={{ flex: 1 }}
                        >
                            Email
                        </button>
                        <button
                            className={`btn btn-block ${loginMethod === 'phone' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setLoginMethod('phone')}
                            style={{ flex: 1 }}
                        >
                            Phone
                        </button>
                    </div>

                    {loginMethod === 'email' ? (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="label">{t('auth.login.email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="input w-full"
                                    placeholder="you@example.com"
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

                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-xs cursor-pointer" onClick={() => !loading && setFormData(p => ({ ...p, remember: !p.remember }))}>
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={formData.remember}
                                        readOnly
                                    />
                                    <span className="text-secondary">{t('auth.login.remember')}</span>
                                </div>
                                <Link to="/forgot-password" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                                    {t('auth.login.forgot')}
                                </Link>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={loading}>
                                {loading ? (language === 'ta' ? 'உள்நுழைகிறது...' : 'Logging in...') : t('auth.login.submit')}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="auth-form">
                            {!otpSent ? (
                                <>
                                    <div className="form-group">
                                        <label className="label">{t('auth.login.phone')}</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="input w-full"
                                            placeholder="+91 98765 43210"
                                            value={formData.phone || ''}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={loading}>
                                        {loading ? (language === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Sending OTP...') : (language === 'ta' ? 'OTP அனுப்பவும்' : 'Send One-Time Password')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="otp-wrapper">
                                        <label className="label text-center">
                                            {language === 'ta' ? `${formData.phone} எண்ணிற்கு அனுப்பப்பட்ட OTP ஐ உள்ளிடவும்` : `Enter OTP sent to ${formData.phone}`}
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
                                            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '24px' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block btn-lg mt-4" disabled={loading}>
                                        {loading ? (language === 'ta' ? 'சரிபார்க்கப்படுகிறது...' : 'Verifying...') : (language === 'ta' ? 'உள்நுழை' : 'Login')}
                                    </button>
                                    <button type="button" className="btn btn-ghost btn-block mt-2" onClick={() => setOtpSent(false)} disabled={loading}>
                                        {language === 'ta' ? 'எண்ணை மாற்றவும்' : 'Change Phone Number'}
                                    </button>
                                </>
                            )}
                        </form>
                    )}

                    <div className="auth-footer">
                        {t('auth.login.noAccount')}{' '}
                        <Link to="/register">{t('auth.login.register')}</Link>
                    </div>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                title={language === 'ta' ? 'வரவேற்கிறோம்!' : 'Welcome Back!'}
                subtitle={language === 'ta' ? 'உங்களை உள்நுழைய வைக்கிறோம்...' : 'Signing you in to your account...'}
            />
        </div>
    )
}

export default Login
