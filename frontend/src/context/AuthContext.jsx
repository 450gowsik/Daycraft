/**
 * AuthContext - Production-Grade State Machine
 * 
 * Features:
 * - Single useReducer for predictable, atomic state transitions.
 * - Stale closures solved via refs and dependency hygiene.
 * - Tokens stored in memory (accessToken) and HttpOnly Secure cookies (refreshToken).
 * - Automatic background token refresh.
 * - Re-render optimized via useMemo.
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react'
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

const initialState = {
    user: null,
    accessToken: null,
    loading: true,
    authState: AUTH_STATES.IDLE,
    error: null,
    stepData: {
        email: '',
        phone: '',
        name: '',
        role: '',
        location: '',
        isNewUser: false,
        cooldownRemaining: 0
    }
}

function authReducer(state, action) {
    switch (action.type) {
        case 'INIT_START':
            return {
                ...state,
                loading: true
            }
        case 'AUTH_SUCCESS':
            localStorage.setItem('daycraft_logged_in', 'true')
            return {
                ...state,
                user: action.payload.user,
                accessToken: action.payload.accessToken,
                authState: AUTH_STATES.AUTHENTICATED,
                loading: false,
                error: null
            }
        case 'AUTH_FAIL':
            localStorage.removeItem('daycraft_logged_in')
            return {
                ...initialState,
                loading: false
            }
        case 'SET_AUTH_STATE':
            return {
                ...state,
                authState: action.payload
            }
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false
            }
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            }
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            }
        case 'UPDATE_STEP_DATA':
            return {
                ...state,
                stepData: {
                    ...state.stepData,
                    ...action.payload
                }
            }
        case 'RESET_FLOW':
            return {
                ...state,
                authState: AUTH_STATES.IDLE,
                error: null,
                stepData: initialState.stepData
            }
        case 'UPDATE_USER_PROFILE':
            return {
                ...state,
                user: action.payload
            }
        default:
            return state
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState)
    const navigate = useNavigate()
    const refreshTimeoutRef = useRef(null)

    // Keep active state values in refs to prevent stale closure bugs in timers/effects
    const stateRef = useRef(state)
    useEffect(() => {
        stateRef.current = state
    }, [state])

    // ===========================================
    // TOKEN MANAGEMENT
    // ===========================================

    const scheduleRefresh = useCallback((access) => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
        }
        
        // Refresh 1 minute before access token expires (14 minutes)
        refreshTimeoutRef.current = setTimeout(() => {
            refreshAccessToken()
        }, 14 * 60 * 1000)
    }, [])

    const refreshAccessToken = useCallback(async () => {
        try {
            // POST request to refresh endpoint. Cookie is sent automatically by Axios (withCredentials: true)
            const response = await api.post('/auth/refresh-token')

            if (response.data.success) {
                const newAccessToken = response.data.accessToken
                setApiAccessToken(newAccessToken)
                scheduleRefresh(newAccessToken)
                return newAccessToken
            }
        } catch (error) {
            // Only log unexpected server/network errors, not expected 401s when the user is logged out
            if (error.response?.status !== 401) {
                console.error('Silent token refresh failed:', error)
            }
            dispatch({ type: 'AUTH_FAIL' })
            setApiAccessToken(null)
        }
        return null
    }, [scheduleRefresh])

    const fetchCurrentUser = useCallback(async (token) => {
        try {
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.data.success) {
                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: { user: response.data.user, accessToken: token }
                })
                return response.data.user
            }
        } catch (error) {
            console.error('Fetch current user failed:', error)
            dispatch({ type: 'AUTH_FAIL' })
            setApiAccessToken(null)
        }
        return null
    }, [])

    // ===========================================
    // EMAIL AUTH FLOW
    // ===========================================

    const emailStart = async (email) => {
        dispatch({ type: 'CLEAR_ERROR' })
        dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.EMAIL_ENTERED })

        try {
            const response = await api.post('/auth/email/start', { email })

            dispatch({
                type: 'UPDATE_STEP_DATA',
                payload: {
                    email,
                    isNewUser: !response.data.exists
                }
            })

            dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.PASSWORD_STEP })
            return {
                success: true,
                exists: response.data.exists,
                message: response.data.message
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to check email'
            dispatch({ type: 'SET_ERROR', payload: msg })
            dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.ERROR })
            return { success: false, message: msg }
        }
    }

    const emailRegister = async (password, userData = {}) => {
        dispatch({ type: 'CLEAR_ERROR' })
        dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.REGISTERING })

        try {
            const response = await api.post('/auth/email/register', {
                email: stateRef.current.stepData.email,
                password,
                name: userData.name || stateRef.current.stepData.name,
                role: userData.role || stateRef.current.stepData.role,
                location: userData.location || stateRef.current.stepData.location,
                geoLocation: userData.geoLocation
            })

            if (response.data.success) {
                const access = response.data.accessToken
                setApiAccessToken(access)
                scheduleRefresh(access)

                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: { user: response.data.user, accessToken: access }
                })
                return { success: true, user: response.data.user }
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed'
            dispatch({ type: 'SET_ERROR', payload: msg })
            dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.ERROR })
            return { success: false, message: msg }
        }
    }

    const login = async (email, password) => {
        dispatch({ type: 'CLEAR_ERROR' })
        dispatch({ type: 'SET_LOADING', payload: true })

        try {
            const response = await api.post('/auth/login', { email, password })

            if (response.data.success) {
                const access = response.data.accessToken
                setApiAccessToken(access)
                scheduleRefresh(access)

                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: { user: response.data.user, accessToken: access }
                })
                return { success: true, user: response.data.user }
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed'
            dispatch({ type: 'SET_ERROR', payload: msg })
            return { success: false, message: msg }
        }
    }

    // ===========================================
    // PHONE AUTH FLOW (OTP)
    // ===========================================

    const startCooldown = (seconds) => {
        dispatch({ type: 'UPDATE_STEP_DATA', payload: { cooldownRemaining: seconds } })

        const interval = setInterval(() => {
            const currentCooldown = stateRef.current.stepData.cooldownRemaining
            if (currentCooldown <= 1) {
                clearInterval(interval)
                dispatch({ type: 'UPDATE_STEP_DATA', payload: { cooldownRemaining: 0 } })
            } else {
                dispatch({ type: 'UPDATE_STEP_DATA', payload: { cooldownRemaining: currentCooldown - 1 } })
            }
        }, 1000)
    }

    const sendOtp = async (phone, userData = {}) => {
        dispatch({ type: 'CLEAR_ERROR' })
        dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.PHONE_ENTERED })

        try {
            const response = await api.post('/auth/phone/send-otp', {
                phone,
                name: userData.name || stateRef.current.stepData.name,
                role: userData.role || stateRef.current.stepData.role,
                location: userData.location || stateRef.current.stepData.location
            })

            if (response.data.success) {
                dispatch({
                    type: 'UPDATE_STEP_DATA',
                    payload: {
                        phone: response.data.phone,
                        isNewUser: response.data.isNewUser,
                        name: userData.name || stateRef.current.stepData.name,
                        role: userData.role || stateRef.current.stepData.role,
                        location: userData.location || stateRef.current.stepData.location
                    }
                })
                dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.OTP_SENT })

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
            dispatch({ type: 'SET_ERROR', payload: msg })

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
        dispatch({ type: 'CLEAR_ERROR' })
        dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.OTP_VERIFYING })

        try {
            const response = await api.post('/auth/phone/verify-otp', {
                phone: stateRef.current.stepData.phone,
                otp,
                name: stateRef.current.stepData.name,
                role: stateRef.current.stepData.role,
                location: stateRef.current.stepData.location
            })

            if (response.data.success) {
                const access = response.data.accessToken
                setApiAccessToken(access)
                scheduleRefresh(access)

                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: { user: response.data.user, accessToken: access }
                })
                return {
                    success: true,
                    user: response.data.user,
                    isNewUser: response.data.isNewUser
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'OTP verification failed'
            dispatch({ type: 'SET_ERROR', payload: msg })
            dispatch({ type: 'SET_AUTH_STATE', payload: AUTH_STATES.OTP_SENT })
            return {
                success: false,
                message: msg,
                remainingAttempts: error.response?.data?.remainingAttempts
            }
        }
    }

    const resendOtp = async () => {
        return sendOtp(stateRef.current.stepData.phone, {
            name: stateRef.current.stepData.name,
            role: stateRef.current.stepData.role,
            location: stateRef.current.stepData.location
        })
    }

    // ===========================================
    // GOOGLE AUTH
    // ===========================================

    const googleAuth = async (token, userData = {}) => {
        dispatch({ type: 'CLEAR_ERROR' })
        dispatch({ type: 'SET_LOADING', payload: true })

        try {
            const response = await api.post('/auth/google', {
                token,
                role: userData.role || stateRef.current.stepData.role,
                location: userData.location || stateRef.current.stepData.location,
                geoLocation: userData.geoLocation
            })

            if (response.data.success) {
                const access = response.data.accessToken
                setApiAccessToken(access)
                scheduleRefresh(access)

                dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: { user: response.data.user, accessToken: access }
                })
                return {
                    success: true,
                    user: response.data.user,
                    isNewUser: response.data.isNewUser
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Google auth failed'
            dispatch({ type: 'SET_ERROR', payload: msg })
            return { success: false, message: msg }
        }
    }

    // ===========================================
    // LOGOUT
    // ===========================================

    const logout = async () => {
        try {
            await api.post('/auth/logout') // Cookie cleared automatically by backend
        } catch (error) {
            console.error('Logout error:', error)
        }
        dispatch({ type: 'AUTH_FAIL' })
        setApiAccessToken(null)
        navigate('/login')
    }

    const logoutAllDevices = async () => {
        try {
            await api.post('/auth/logout-all')
        } catch (error) {
            console.error('Logout all error:', error)
        }
        dispatch({ type: 'AUTH_FAIL' })
        setApiAccessToken(null)
        navigate('/login')
    }

    // ===========================================
    // PROFILE
    // ===========================================

    const updateProfile = async (updates) => {
        try {
            const response = await api.put('/auth/profile', updates)
            if (response.data.success) {
                dispatch({ type: 'UPDATE_USER_PROFILE', payload: response.data.user })
                return { success: true, user: response.data.user }
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message }
        }
    }

    const updateStepData = (updates) => {
        dispatch({ type: 'UPDATE_STEP_DATA', payload: updates })
    }

    const resetAuthFlow = () => {
        dispatch({ type: 'RESET_FLOW' })
    }

    // ===========================================
    // INITIALIZATION
    // ===========================================

    useEffect(() => {
        const initAuth = async () => {
            dispatch({ type: 'INIT_START' })

            const hasSession = localStorage.getItem('daycraft_logged_in') === 'true'
            if (!hasSession) {
                dispatch({ type: 'AUTH_FAIL' })
                return
            }

            // Try to refresh token silently on startup using the HttpOnly cookie
            const access = await refreshAccessToken()
            if (access) {
                await fetchCurrentUser(access)
            } else {
                dispatch({ type: 'AUTH_FAIL' })
            }
        }

        initAuth()

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current)
            }
        }
    }, [refreshAccessToken, fetchCurrentUser])

    // ===========================================
    // MEMOIZED CONTEXT VALUE
    // ===========================================

    const value = useMemo(() => ({
        // State
        user: state.user,
        token: state.accessToken,
        accessToken: state.accessToken,
        refreshToken: null, // Left for legacy compatibility (omitted)
        loading: state.loading,
        authState: state.authState,
        error: state.error,
        stepData: state.stepData,

        // Computed properties
        isAuthenticated: !!state.user && !!state.accessToken,
        role: state.user?.activeRole || state.user?.role || 'worker',
        profile: state.user?.profile || null,
        isWorker: state.user?.roles?.includes('worker') || state.user?.role === 'worker',
        isEmployer: state.user?.roles?.includes('employer') || state.user?.role === 'employer',
        isAdmin: state.user?.roles?.includes('admin') || state.user?.role === 'admin',

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
        setAuthState: (status) => dispatch({ type: 'SET_AUTH_STATE', payload: status }),
        clearError: () => dispatch({ type: 'CLEAR_ERROR' })
    }), [
        state.user,
        state.accessToken,
        state.loading,
        state.authState,
        state.error,
        state.stepData,
        emailStart,
        emailRegister,
        login,
        sendOtp,
        verifyOtp,
        resendOtp,
        googleAuth,
        logout,
        logoutAllDevices,
        updateProfile,
        updateStepData,
        resetAuthFlow
    ])

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
