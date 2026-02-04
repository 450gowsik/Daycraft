/**
 * Register Page - Google-Style Step-Based Flow
 * 
 * Steps:
 * 1. Choose auth method (Email/Phone) + Role
 * 2. Enter details (Name, Location)
 * 3. Credentials (Password for email, OTP for phone)
 * 4. Success
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth, AUTH_STATES } from '../../context/AuthContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'
import LocationPicker from '../../components/common/LocationPicker.jsx'
import { toast } from 'react-hot-toast'
import logo from '../../assets/images/logo.png'
import './Auth.css'

// Step definitions
const STEPS = {
    METHOD: 'method',      // Choose email or phone
    DETAILS: 'details',    // Name, role, location
    CREDENTIALS: 'credentials', // Password or OTP
    SUCCESS: 'success'
}

function Register() {
    const { language } = useLanguage()
    const navigate = useNavigate()
    const {
        isAuthenticated,
        authState,
        stepData,
        error,
        emailStart,
        emailRegister,
        sendOtp,
        verifyOtp,
        resendOtp,
        googleAuth,
        updateStepData,
        resetAuthFlow,
        clearError
    } = useAuth()

    // Local state
    const [step, setStep] = useState(STEPS.METHOD)
    const [authMethod, setAuthMethod] = useState('email') // 'email' or 'phone'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: '',
        location: '',
        geoLocation: null
    })
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [localError, setLocalError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState(0)

    const otpRefs = useRef([])

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    // Sync with auth state
    useEffect(() => {
        if (authState === AUTH_STATES.OTP_SENT) {
            setStep(STEPS.CREDENTIALS)
        } else if (authState === AUTH_STATES.AUTHENTICATED) {
            setStep(STEPS.SUCCESS)
            setTimeout(() => navigate('/'), 2000)
        }
    }, [authState, navigate])

    // Password strength calculator
    useEffect(() => {
        const password = formData.password
        let strength = 0
        if (password.length >= 6) strength++
        if (password.length >= 8) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++
        setPasswordStrength(strength)
    }, [formData.password])

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setLocalError('')
        clearError()
    }

    // Handle location selection
    const handleLocationSelect = (locationObj) => {
        if (locationObj) {
            setFormData(prev => ({
                ...prev,
                location: locationObj.displayText || locationObj.name || locationObj,
                geoLocation: locationObj.coordinates || null
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                location: '',
                geoLocation: null
            }))
        }
    }

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1)
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }

        // Auto-submit when complete
        if (newOtp.every(d => d) && newOtp.join('').length === 6) {
            handleVerifyOtp(newOtp.join(''))
        }
    }

    // Handle OTP backspace
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    // Step 1: Choose auth method and continue
    const handleMethodContinue = () => {
        if (!formData.role) {
            setLocalError('Please select your role')
            return
        }

        if (authMethod === 'email' && !formData.email) {
            setLocalError('Please enter your email')
            return
        }

        if (authMethod === 'phone' && !formData.phone) {
            setLocalError('Please enter your phone number')
            return
        }

        updateStepData({
            email: formData.email,
            phone: formData.phone,
            role: formData.role
        })

        setStep(STEPS.DETAILS)
    }

    // Step 2: Enter details and continue
    const handleDetailsContinue = async () => {
        if (!formData.name.trim()) {
            setLocalError('Please enter your name')
            return
        }

        if (!formData.location) {
            setLocalError('Please select your location')
            return
        }

        updateStepData({
            name: formData.name,
            location: formData.location
        })

        setLoading(true)

        if (authMethod === 'email') {
            // Check if email exists
            const result = await emailStart(formData.email)
            if (result.success) {
                if (result.exists) {
                    // Email exists - redirect to login
                    setLocalError('An account with this email already exists. Please login.')
                    setLoading(false)
                    return
                }
                setStep(STEPS.CREDENTIALS)
            } else {
                setLocalError(result.message || 'Something went wrong')
            }
        } else {
            // Send OTP
            const result = await sendOtp(formData.phone, {
                name: formData.name,
                role: formData.role,
                location: formData.location
            })

            if (result.success) {
                setStep(STEPS.CREDENTIALS)
                // DEV: Show OTP in console and Toast
                if (result.devOtp) {
                    console.log('DEV OTP:', result.devOtp)
                    toast('DEV MODE: Your OTP is ' + result.devOtp, {
                        icon: '🔑',
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    })
                }
            } else {
                setLocalError(result.message || 'Failed to send OTP')
            }
        }

        setLoading(false)
    }

    // Step 3a: Submit email registration
    const handleEmailSubmit = async (e) => {
        e.preventDefault()

        if (formData.password.length < 6) {
            setLocalError('Password must be at least 6 characters')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match')
            return
        }

        setLoading(true)

        const result = await emailRegister(formData.password, {
            name: formData.name,
            role: formData.role,
            location: formData.location,
            geoLocation: formData.geoLocation
        })

        if (result.success) {
            setStep(STEPS.SUCCESS)
        } else {
            setLocalError(result.message || 'Registration failed')
        }

        setLoading(false)
    }

    // Step 3b: Verify OTP
    const handleVerifyOtp = async (otpCode) => {
        setLoading(true)

        const result = await verifyOtp(otpCode)

        if (result.success) {
            setStep(STEPS.SUCCESS)
        } else {
            setLocalError(result.message || 'Invalid OTP')
            setOtp(['', '', '', '', '', ''])
            otpRefs.current[0]?.focus()
        }

        setLoading(false)
    }

    // Resend OTP handler
    const handleResendOtp = async () => {
        setLoading(true)
        const result = await resendOtp()
        if (result.devOtp) {
            console.log('DEV OTP:', result.devOtp)
            toast('DEV MODE: Your OTP is ' + result.devOtp, {
                icon: '🔑',
                duration: 6000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            })
        }
        setLoading(false)
    }

    // Google login
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (response) => {
            if (!formData.role) {
                setLocalError('Please select your role first')
                return
            }

            setLoading(true)
            const result = await googleAuth(response.access_token, {
                role: formData.role,
                location: formData.location,
                geoLocation: formData.geoLocation
            })

            if (result.success) {
                // If new user, redirect to complete profile
                if (result.isNewUser) {
                    navigate('/complete-profile')
                } else {
                    // Existing user, go to home
                    navigate('/')
                }
            } else {
                setLocalError(result.message || 'Google login failed')
            }
            setLoading(false)
        },
        onError: () => {
            setLocalError('Google login failed. Please try again.')
        }
    })

    // Go back handler
    const handleBack = () => {
        if (step === STEPS.DETAILS) {
            setStep(STEPS.METHOD)
        } else if (step === STEPS.CREDENTIALS) {
            setStep(STEPS.DETAILS)
        }
        clearError()
        setLocalError('')
    }

    // Get password strength label
    const getPasswordStrengthLabel = () => {
        if (passwordStrength <= 1) return { label: 'Weak', color: '#ef4444' }
        if (passwordStrength <= 2) return { label: 'Fair', color: '#f97316' }
        if (passwordStrength <= 3) return { label: 'Good', color: '#eab308' }
        return { label: 'Strong', color: '#22c55e' }
    }

    // Calculate progress
    const getProgress = () => {
        const steps = [STEPS.METHOD, STEPS.DETAILS, STEPS.CREDENTIALS, STEPS.SUCCESS]
        return ((steps.indexOf(step) + 1) / steps.length) * 100
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
                {/* Progress Bar */}
                <div className="auth-progress">
                    <div
                        className="auth-progress-bar"
                        style={{ width: `${getProgress()}%` }}
                    ></div>
                </div>

                {/* Logo */}
                <div className="auth-logo">
                    <img src={logo} alt="DayCraft" className="logo-img" />
                </div>

                {/* Step Indicator */}
                {step !== STEPS.SUCCESS && (
                    <div className="step-indicator">
                        <span className={`step-dot ${step === STEPS.METHOD ? 'active' : 'completed'}`}>1</span>
                        <span className="step-line"></span>
                        <span className={`step-dot ${step === STEPS.DETAILS ? 'active' : step === STEPS.CREDENTIALS ? 'completed' : ''}`}>2</span>
                        <span className="step-line"></span>
                        <span className={`step-dot ${step === STEPS.CREDENTIALS ? 'active' : ''}`}>3</span>
                    </div>
                )}

                {/* Error Message */}
                {displayError && (
                    <div className="auth-error">
                        <span className="error-icon">⚠️</span>
                        <span>{displayError}</span>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 1: METHOD & ROLE */}
                {/* ============================================ */}
                {step === STEPS.METHOD && (
                    <div className="auth-step">
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join DayCraft to post jobs or find employment</p>

                        {/* Role Selection */}
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-option ${formData.role === 'employer' ? 'selected' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, role: 'employer' }))}
                            >
                                <span className="role-icon">👔</span>
                                <span className="role-label">
                                    {language === 'ta' ? 'வேலை அளிக்கிறேன்' : "I'm posting jobs"}
                                </span>
                                <span className="role-type">Job Provider</span>
                            </button>
                            <button
                                type="button"
                                className={`role-option ${formData.role === 'worker' ? 'selected' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, role: 'worker' }))}
                            >
                                <span className="role-icon">👷</span>
                                <span className="role-label">
                                    {language === 'ta' ? 'வேலை செய்ய விரும்புகிறேன்' : "I'm looking for work"}
                                </span>
                                <span className="role-type">Employee</span>
                            </button>
                        </div>

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

                        {/* Email/Phone Input */}
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
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn btn-primary btn-full"
                                onClick={handleMethodContinue}
                                disabled={loading}
                            >
                                Continue
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="auth-divider">
                            <span>or continue with</span>
                        </div>

                        {/* Google Login */}
                        <button
                            type="button"
                            className="btn btn-google btn-full"
                            onClick={() => handleGoogleLogin()}
                            disabled={loading || !formData.role}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Login Link */}
                        <p className="auth-link">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 2: DETAILS */}
                {/* ============================================ */}
                {step === STEPS.DETAILS && (
                    <div className="auth-step">
                        <button className="back-button" onClick={handleBack}>
                            ← Back
                        </button>

                        <h1 className="auth-title">Tell us about yourself</h1>
                        <p className="auth-subtitle">This helps us personalize your experience</p>

                        <div className="auth-form">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Location *</label>
                                <LocationPicker
                                    value={formData.location ? { displayText: formData.location } : null}
                                    onChange={handleLocationSelect}
                                    placeholder="Select your city/area"
                                />
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary btn-full"
                                onClick={handleDetailsContinue}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="btn-loader"></span>
                                ) : (
                                    authMethod === 'email' ? 'Continue' : 'Send OTP'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 3: CREDENTIALS */}
                {/* ============================================ */}
                {step === STEPS.CREDENTIALS && (
                    <div className="auth-step">
                        <button className="back-button" onClick={handleBack}>
                            ← Back
                        </button>

                        {authMethod === 'email' ? (
                            // EMAIL: Password
                            <>
                                <h1 className="auth-title">Create password</h1>
                                <p className="auth-subtitle">
                                    Choose a strong password for {formData.email}
                                </p>

                                <form className="auth-form" onSubmit={handleEmailSubmit}>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <div className="password-input-group">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="At least 6 characters"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>

                                        {/* Password Strength */}
                                        {formData.password && (
                                            <div className="password-strength">
                                                <div className="strength-bar">
                                                    <div
                                                        className="strength-fill"
                                                        style={{
                                                            width: `${(passwordStrength / 5) * 100}%`,
                                                            backgroundColor: getPasswordStrengthLabel().color
                                                        }}
                                                    ></div>
                                                </div>
                                                <span
                                                    className="strength-label"
                                                    style={{ color: getPasswordStrengthLabel().color }}
                                                >
                                                    {getPasswordStrengthLabel().label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Re-enter password"
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-full"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="btn-loader"></span>
                                        ) : (
                                            'Create Account'
                                        )}
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
                                    {/* OTP Input */}
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

                                    {/* Resend OTP */}
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
                                        {loading ? (
                                            <span className="btn-loader"></span>
                                        ) : (
                                            'Verify & Continue'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ============================================ */}
                {/* STEP 4: SUCCESS */}
                {/* ============================================ */}
                {step === STEPS.SUCCESS && (
                    <div className="auth-step success-step">
                        <div className="success-animation">
                            <div className="success-checkmark">
                                <svg viewBox="0 0 52 52">
                                    <circle cx="26" cy="26" r="25" fill="none" />
                                    <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="auth-title">Welcome aboard! 🎉</h1>
                        <p className="auth-subtitle">
                            Your account has been created successfully
                        </p>

                        <p className="redirect-message">
                            Redirecting to home...
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Register
