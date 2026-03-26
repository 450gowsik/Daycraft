/**
 * AuthContext - World-Class State Machine
 * 
 * Features:
 * - Step-based authentication flows
 * - Multi-role support (roles array + activeRole)
 * - Token stored in memory (not localStorage)
 * - Automatic token refresh
 * - Role switching capability
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setAccessToken as setApiAccessToken } from '../services/api'

const AuthContext = createContext()

// Auth states for step-based flow
export const AUTH_STATES = {
    IDLE: 'idle',
    EMAIL_ENTERED: 'email_entered',
    PASSWORD_STEP: 'password_step',
    PHONE_ENTERED: 'phone_entered',
    OTP_SENT: 'otp_sent',
    OTP_VERIFYING: 'otp_verifying',
    REGISTERING: 'registering',
    AUTHENTICATED: 'authenticated',
    ERROR: 'error'
}

export function AuthProvider({ children }) {
    // Core state
    const [user, setUser] = useState(null)
    const [accessToken, setAccessToken] = useState(null)
    const [refreshToken, setRefreshToken] = useState(() => {
        return localStorage.getItem('refreshToken')
    })
    const [loading, setLoading] = useState(true)
    const [authState, setAuthState] = useState(AUTH_STATES.IDLE)
    const [error, setError] = useState(null)

    // Step flow data
    const [stepData, setStepData] = useState({
        email: '',
        phone: '',
        name: '',
        role: '',
        location: '',
        isNewUser: false,
        cooldownRemaining: 0
    })

    const navigate = useNavigate()
    const refreshTimeoutRef = useRef(null)

    // ===========================================
    // TOKEN MANAGEMENT
    // ===========================================

    const saveTokens = useCallback((access, refresh) => {
        setAccessToken(access)
        setApiAccessToken(access) // Fix: Sync to API service
        if (refresh) {
            setRefreshToken(refresh)
            localStorage.setItem('refreshToken', refresh)
        }

        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
        }
        refreshTimeoutRef.current = setTimeout(() => {
            refreshAccessToken()
        }, 14 * 60 * 1000)
    }, [])

    const refreshAccessToken = useCallback(async () => {
        const storedRefresh = refreshToken || localStorage.getItem('refreshToken')
        if (!storedRefresh) {
            setLoading(false)
            return false
        }

        try {
            const response = await api.post('/auth/refresh-token', {
                refreshToken: storedRefresh
            })

            if (response.data.success) {
                saveTokens(response.data.accessToken, response.data.refreshToken)
                return true
            }
        } catch (error) {
            console.error('Token refresh failed:', error)
            clearAuth()
        }
        return false
    }, [refreshToken, saveTokens])

    const clearAuth = useCallback(() => {
        setUser(null)
        setAccessToken(null)
        setRefreshToken(null)
        setAuthState(AUTH_STATES.IDLE)
        setStepData({
            email: '',
            phone: '',
            name: '',
            role: '',
            location: '',
            isNewUser: false,
            cooldownRemaining: 0
        })
        localStorage.removeItem('refreshToken')
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
        }
    }, [])

    const fetchCurrentUser = useCallback(async (token) => {
        try {
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.data.success) {
                setUser(response.data.user)
                setAuthState(AUTH_STATES.AUTHENTICATED)
                return response.data.user
            }
        } catch (error) {
            console.error('Fetch user failed:', error)
            clearAuth()
        }
        return null
    }, [clearAuth])

    // Role management methods removed at user request to revert to old structure

    // ===========================================
    // EMAIL AUTH FLOW
    // ===========================================

    const emailStart = async (email) => {
        setError(null)
        setAuthState(AUTH_STATES.EMAIL_ENTERED)

        try {
            const response = await api.post('/auth/email/start', { email })

            setStepData(prev => ({
                ...prev,
                email,
                isNewUser: !response.data.exists
            }))

            setAuthState(AUTH_STATES.PASSWORD_STEP)
            return {
                success: true,
                exists: response.data.exists,
                message: response.data.message
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to check email')
            setAuthState(AUTH_STATES.ERROR)
            return { success: false, message: error.response?.data?.message }
        }
    }

    const emailRegister = async (password, userData = {}) => {
        setError(null)
        setAuthState(AUTH_STATES.REGISTERING)

        try {
            const response = await api.post('/auth/email/register', {
                email: stepData.email,
                password,
                name: userData.name || stepData.name,
                role: userData.role || stepData.role,
                location: userData.location || stepData.location,
                geoLocation: userData.geoLocation
            })

            if (response.data.success) {
                saveTokens(response.data.accessToken, response.data.refreshToken)
                setUser(response.data.user)
                setAuthState(AUTH_STATES.AUTHENTICATED)
                return { success: true, user: response.data.user }
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed')
            setAuthState(AUTH_STATES.ERROR)
            return { success: false, message: error.response?.data?.message }
        }
    }

    const login = async (email, password) => {
        setError(null)
        setLoading(true)

        try {
            const response = await api.post('/auth/login', { email, password })

            if (response.data.success) {
                saveTokens(response.data.accessToken, response.data.refreshToken)
                setUser(response.data.user)
                setAuthState(AUTH_STATES.AUTHENTICATED)
                setLoading(false)
                return { success: true, user: response.data.user }
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed')
            setLoading(false)
            return { success: false, message: error.response?.data?.message }
        }
    }

    // ===========================================
    // PHONE AUTH FLOW (OTP)
    // ===========================================

    const sendOtp = async (phone, userData = {}) => {
        setError(null)
        setAuthState(AUTH_STATES.PHONE_ENTERED)

        try {
            const response = await api.post('/auth/phone/send-otp', {
                phone,
                name: userData.name || stepData.name,
                role: userData.role || stepData.role,
                location: userData.location || stepData.location
            })

            if (response.data.success) {
                setStepData(prev => ({
                    ...prev,
                    phone: response.data.phone,
                    isNewUser: response.data.isNewUser,
                    name: userData.name || prev.name,
                    role: userData.role || prev.role,
                    location: userData.location || prev.location
                }))
                setAuthState(AUTH_STATES.OTP_SENT)

                if (response.data.cooldownRemaining) {
                    startCooldown(response.data.cooldownRemaining)
                }

                return {
                    success: true,
                    isNewUser: response.data.isNewUser,
                    phone: response.data.phone,
                    devOtp: response.data.devOtp
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to send OTP'
            setError(msg)

            if (error.response?.status === 429) {
                const remaining = error.response.data?.cooldownRemaining || 30
                startCooldown(remaining)
            }

            if (error.response?.data?.requiresRegistration) {
                return {
                    success: false,
                    requiresRegistration: true,
                    message: msg
                }
            }

            return { success: false, message: msg }
        }
    }

    const verifyOtp = async (otp) => {
        setError(null)
        setAuthState(AUTH_STATES.OTP_VERIFYING)

        try {
            const response = await api.post('/auth/phone/verify-otp', {
                phone: stepData.phone,
                otp,
                name: stepData.name,
                role: stepData.role,
                location: stepData.location
            })

            if (response.data.success) {
                saveTokens(response.data.accessToken, response.data.refreshToken)
                setUser(response.data.user)
                setAuthState(AUTH_STATES.AUTHENTICATED)
                return {
                    success: true,
                    user: response.data.user,
                    isNewUser: response.data.isNewUser
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'OTP verification failed'
            setError(msg)
            setAuthState(AUTH_STATES.OTP_SENT)
            return {
                success: false,
                message: msg,
                remainingAttempts: error.response?.data?.remainingAttempts
            }
        }
    }

    const resendOtp = async () => {
        return sendOtp(stepData.phone, {
            name: stepData.name,
            role: stepData.role,
            location: stepData.location
        })
    }

    const startCooldown = (seconds) => {
        setStepData(prev => ({ ...prev, cooldownRemaining: seconds }))

        const interval = setInterval(() => {
            setStepData(prev => {
                const remaining = prev.cooldownRemaining - 1
                if (remaining <= 0) {
                    clearInterval(interval)
                    return { ...prev, cooldownRemaining: 0 }
                }
                return { ...prev, cooldownRemaining: remaining }
            })
        }, 1000)
    }

    // ===========================================
    // GOOGLE AUTH
    // ===========================================

    const googleAuth = async (token, userData = {}) => {
        setError(null)
        setLoading(true)

        try {
            const response = await api.post('/auth/google', {
                token,
                role: userData.role || stepData.role,
                location: userData.location || stepData.location,
                geoLocation: userData.geoLocation
            })

            if (response.data.success) {
                saveTokens(response.data.accessToken, response.data.refreshToken)
                setUser(response.data.user)
                setAuthState(AUTH_STATES.AUTHENTICATED)
                setLoading(false)
                return {
                    success: true,
                    user: response.data.user,
                    isNewUser: response.data.isNewUser
                }
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Google auth failed')
            setLoading(false)
            return { success: false, message: error.response?.data?.message }
        }
    }

    // ===========================================
    // LOGOUT
    // ===========================================

    const logout = async () => {
        try {
            await api.post('/auth/logout', { refreshToken })
        } catch (error) {
            console.error('Logout error:', error)
        }
        clearAuth()
        navigate('/login')
    }

    const logoutAllDevices = async () => {
        try {
            await api.post('/auth/logout-all', {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        } catch (error) {
            console.error('Logout all error:', error)
        }
        clearAuth()
        navigate('/login')
    }

    // ===========================================
    // PROFILE
    // ===========================================

    const updateProfile = async (updates) => {
        try {
            const response = await api.put('/auth/profile', updates, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            if (response.data.success) {
                setUser(response.data.user)
                return { success: true, user: response.data.user }
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message }
        }
    }

    const updateStepData = (updates) => {
        setStepData(prev => ({ ...prev, ...updates }))
    }

    const resetAuthFlow = () => {
        setAuthState(AUTH_STATES.IDLE)
        setError(null)
        setStepData({
            email: '',
            phone: '',
            name: '',
            role: '',
            location: '',
            isNewUser: false,
            cooldownRemaining: 0
        })
    }

    // ===========================================
    // INITIALIZATION
    // ===========================================

    useEffect(() => {
        const initAuth = async () => {
            const storedRefresh = localStorage.getItem('refreshToken')

            if (storedRefresh) {
                const refreshed = await refreshAccessToken()
                if (refreshed && accessToken) {
                    await fetchCurrentUser(accessToken)
                }
            }

            setLoading(false)
        }

        initAuth()

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (accessToken && !user) {
            fetchCurrentUser(accessToken)
        }
    }, [accessToken, user, fetchCurrentUser])

    // ===========================================
    // CONTEXT VALUE
    // ===========================================

    const value = {
        // State
        user,
        token: accessToken,
        accessToken,
        refreshToken,
        loading,
        authState,
        error,
        stepData,

        // Computed properties
        isAuthenticated: !!user && !!accessToken,
        role: user?.activeRole || user?.role || 'worker',
        profile: user?.profile || null,
        isWorker: user?.roles?.includes('worker') || user?.role === 'worker',
        isEmployer: user?.roles?.includes('employer') || user?.role === 'employer',
        isAdmin: user?.roles?.includes('admin') || user?.role === 'admin',

        // Email auth
        emailStart,
        emailRegister,
        login,

        // Phone auth
        sendOtp,
        verifyOtp,
        resendOtp,

        // Google auth
        googleAuth,

        // Session management
        logout,
        logoutAllDevices,

        // Profile
        updateProfile,

        // Flow control
        updateStepData,
        resetAuthFlow,
        setAuthState,
        clearError: () => setError(null)
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
