/**
 * Login Page - Google-Style Step-Based Flow
 * 
 * Steps:
 * 1. Enter email or phone
 * 2. Enter password or OTP
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth, AUTH_STATES } from '../../context/AuthContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import logo from '../../assets/images/logo.png'
import './Auth.css'

const STEPS = {
    IDENTIFIER: 'identifier',
    CREDENTIALS: 'credentials'
}

function Login() {
    const { language } = useLanguage()
    const navigate = useNavigate()
    const location = useLocation()
    const {
        isAuthenticated,
        authState,
        stepData,
        error,
        login,
        emailStart,
        sendOtp,
        verifyOtp,
        resendOtp,
        googleAuth,
        updateStepData,
        clearError
    } = useAuth()

    // Get redirect destination
    const from = location.state?.from?.pathname || '/dashboard'

    // Local state
    const [step, setStep] = useState(STEPS.IDENTIFIER)
    const [authMethod, setAuthMethod] = useState('email')
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: ''
    })
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [localError, setLocalError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const otpRefs = useRef([])

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true })
        }
    }, [isAuthenticated, navigate, from])

    // Sync with auth state
    useEffect(() => {
        if (authState === AUTH_STATES.OTP_SENT) {
            setStep(STEPS.CREDENTIALS)
        } else if (authState === AUTH_STATES.AUTHENTICATED) {
            navigate(from, { replace: true })
        }
    }, [authState, navigate, from])

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setLocalError('')
        clearError()
    }

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }

        if (newOtp.every(d => d) && newOtp.join('').length === 6) {
            handleVerifyOtp(newOtp.join(''))
        }
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    // Step 1: Enter identifier and continue
    const handleIdentifierContinue = async () => {
        if (authMethod === 'email' && !formData.email) {
            setLocalError('Please enter your email')
            return
        }

        if (authMethod === 'phone' && !formData.phone) {
            setLocalError('Please enter your phone number')
            return
        }

        setLoading(true)

        if (authMethod === 'email') {
            // Check if email exists
            const result = await emailStart(formData.email)
            if (result.success) {
                if (!result.exists) {
                    setLocalError('No account found with this email. Please register.')
                    setLoading(false)
                    return
                }
                updateStepData({ email: formData.email })
                setStep(STEPS.CREDENTIALS)
            } else {
                setLocalError(result.message || 'Something went wrong')
            }
        } else {
            // Send OTP
            const result = await sendOtp(formData.phone)
            if (result.success) {
                updateStepData({ phone: formData.phone })
                setStep(STEPS.CREDENTIALS)
                if (result.devOtp) {
                    console.log('DEV OTP:', result.devOtp)
                }
            } else {
                setLocalError(result.message || 'Failed to send OTP')
            }
        }

        setLoading(false)
    }

    // Email login
    const handleEmailLogin = async (e) => {
        e.preventDefault()

        if (!formData.password) {
            setLocalError('Please enter your password')
            return
        }

        setLoading(true)

        const result = await login(formData.email, formData.password)

        if (!result.success) {
            setLocalError(result.message || 'Login failed')
        }

        setLoading(false)
    }

    // Verify OTP
    const handleVerifyOtp = async (otpCode) => {
        setLoading(true)

        const result = await verifyOtp(otpCode)

        if (!result.success) {
            setLocalError(result.message || 'Invalid OTP')
            setOtp(['', '', '', '', '', ''])
            otpRefs.current[0]?.focus()
        }

        setLoading(false)
    }

    // Resend OTP
    const handleResendOtp = async () => {
        setLoading(true)
        const result = await resendOtp()
        if (result.devOtp) {
            console.log('DEV OTP:', result.devOtp)
        }
        setLoading(false)
    }

    // Google login
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (response) => {
            setLoading(true)
            const result = await googleAuth(response.access_token)

            if (!result.success) {
                setLocalError(result.message || 'Google login failed')
            }
            setLoading(false)
        },
        onError: () => {
            setLocalError('Google login failed. Please try again.')
        }
    })

    // Go back
    const handleBack = () => {
        setStep(STEPS.IDENTIFIER)
        setOtp(['', '', '', '', '', ''])
        clearError()
        setLocalError('')
    }

    const displayError = localError || error

    return (
        <div className="auth-page">
            {/* Animated Background */}
            <div className="auth-background">
                <div className="auth-orb auth-orb-1"></div>
                <div className="auth-orb auth-orb-2"></div>
                <div className="auth-orb auth-orb-3"></div>
            </div>

            <div className="auth-container">
                {/* Logo */}
                <div className="auth-logo">
                    <img src={logo} alt="DayCraft" className="logo-img" />
                </div>

                {/* Error Message */}
                {displayError && (
                    <div className="auth-error">
                        <span className="error-icon">⚠️</span>
                        <span>{displayError}</span>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 1: IDENTIFIER */}
                {/* ============================================ */}
                {step === STEPS.IDENTIFIER && (
                    <div className="auth-step">
                        <h1 className="auth-title">Welcome back</h1>
                        <p className="auth-subtitle">Sign in to continue to DayCraft</p>

                        {/* Auth Method Tabs */}
                        <div className="auth-method-tabs">
                            <button
                                type="button"
                                className={`method-tab ${authMethod === 'email' ? 'active' : ''}`}
                                onClick={() => setAuthMethod('email')}
                            >
                                ✉️ Email
                            </button>
                            <button
                                type="button"
                                className={`method-tab ${authMethod === 'phone' ? 'active' : ''}`}
                                onClick={() => setAuthMethod('phone')}
                            >
                                📱 Phone
                            </button>
                        </div>

                        <div className="auth-form">
                            {authMethod === 'email' ? (
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                        onKeyDown={(e) => e.key === 'Enter' && handleIdentifierContinue()}
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <div className="phone-input-group">
                                        <span className="phone-prefix">+91</span>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter 10-digit number"
                                            maxLength="10"
                                            autoComplete="tel"
                                            onKeyDown={(e) => e.key === 'Enter' && handleIdentifierContinue()}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn btn-primary btn-full"
                                onClick={handleIdentifierContinue}
                                disabled={loading}
                            >
                                {loading ? <span className="btn-loader"></span> : 'Continue'}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        {/* Google Login */}
                        <button
                            type="button"
                            className="btn btn-google btn-full"
                            onClick={() => handleGoogleLogin()}
                            disabled={loading}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Register Link */}
                        <p className="auth-link">
                            Don't have an account? <Link to="/register">Create one</Link>
                        </p>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 2: CREDENTIALS */}
                {/* ============================================ */}
                {step === STEPS.CREDENTIALS && (
                    <div className="auth-step">
                        <button className="back-button" onClick={handleBack}>
                            ← Back
                        </button>

                        {authMethod === 'email' ? (
                            // EMAIL: Password
                            <>
                                <h1 className="auth-title">Enter password</h1>
                                <p className="auth-subtitle">
                                    for {formData.email}
                                </p>

                                <form className="auth-form" onSubmit={handleEmailLogin}>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <div className="password-input-group">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Enter your password"
                                                autoComplete="current-password"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="forgot-password">
                                        <Link to="/forgot-password">Forgot password?</Link>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-full"
                                        disabled={loading}
                                    >
                                        {loading ? <span className="btn-loader"></span> : 'Sign In'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            // PHONE: OTP
                            <>
                                <h1 className="auth-title">Verify your phone</h1>
                                <p className="auth-subtitle">
                                    Enter the 6-digit code sent to {stepData.phone || formData.phone}
                                </p>

                                <div className="auth-form">
                                    <div className="otp-input-group">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={el => otpRefs.current[index] = el}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                className="otp-input"
                                                autoFocus={index === 0}
                                            />
                                        ))}
                                    </div>

                                    <div className="otp-resend">
                                        {stepData.cooldownRemaining > 0 ? (
                                            <span className="resend-countdown">
                                                Resend in {stepData.cooldownRemaining}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="resend-button"
                                                onClick={handleResendOtp}
                                                disabled={loading}
                                            >
                                                Didn't receive code? Resend
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-primary btn-full"
                                        onClick={() => handleVerifyOtp(otp.join(''))}
                                        disabled={loading || otp.some(d => !d)}
                                    >
                                        {loading ? <span className="btn-loader"></span> : 'Verify & Sign In'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Login
