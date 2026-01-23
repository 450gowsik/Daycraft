import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import analytics from '../utils/analytics'
import mapError from '../utils/errorMapper'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('daycraft-token'))
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Standardized Re-hydration logic
    const rehydrate = async () => {
        if (!token) {
            setLoading(false)
            return
        }

        try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
                setUser(response.data.user)
                analytics.trackAuth('rehydrated', 'token');
            }
        } catch (err) {
            console.error('Session re-hydration failed:', err)
            // If the error is 401, api.js interceptor will handle token removal
            // but we should still clear state here if needed
            if (err.response?.status === 401) {
                setUser(null)
                setToken(null)
            }
        } finally {
            setLoading(false)
        }
    }

    // Load user on mount
    useEffect(() => {
        rehydrate()
    }, [])

    const register = async (userData) => {
        setError(null)
        analytics.trackAuth('signup_started', 'email');
        try {
            const response = await api.post('/auth/register', userData);
            const { data } = response;

            if (data.success) {
                localStorage.setItem('daycraft-token', data.token)
                setToken(data.token)
                setUser(data.user)
                analytics.trackAuth('signup_completed', 'email');
                return { success: true }
            }
        } catch (err) {
            const technicalMsg = err.response?.data?.message || 'Server Error';
            const message = mapError(technicalMsg);
            setError(message)
            return { success: false, message }
        }
    }

    const login = async (email, password) => {
        setError(null)
        try {
            const response = await api.post('/auth/login', { email, password });
            const { data } = response;

            if (data.success) {
                localStorage.setItem('daycraft-token', data.token)
                setToken(data.token)
                setUser(data.user)
                analytics.trackAuth('login_success', 'email');
                return { success: true }
            }
        } catch (err) {
            const technicalMsg = err.response?.data?.message || 'Server Error';
            const message = mapError(technicalMsg);
            setError(message)
            analytics.trackAuth('login_failed', 'email', { error: technicalMsg });
            return { success: false, message }
        }
    }

    const logout = () => {
        localStorage.removeItem('daycraft-token')
        setToken(null)
        setUser(null)
        analytics.trackAuth('logout', 'manual');
    }

    const updateProfile = async (profileData) => {
        setError(null)
        try {
            const response = await api.put('/auth/profile', profileData);
            const { data } = response;

            if (data.success) {
                setUser(data.user)
                if (profileData.profileCompleted) {
                    analytics.trackAction('profile_completed');
                }
                return { success: true }
            }
        } catch (err) {
            const message = mapError(err.response?.data?.message || 'Server Error');
            setError(message)
            return { success: false, message }
        }
    }

    const sendOtp = async (phone) => {
        setError(null)
        try {
            const response = await api.post('/auth/send-otp', { phone });
            return response.data;
        } catch (err) {
            const message = mapError(err.response?.data?.message || 'Server Error');
            setError(message)
            return { success: false, message }
        }
    }

    const verifyOtp = async (otpData) => {
        setError(null)
        try {
            const response = await api.post('/auth/verify-otp', otpData);
            const { data } = response;

            if (data.success) {
                localStorage.setItem('daycraft-token', data.token)
                setToken(data.token)
                setUser(data.user)
                analytics.trackAuth('login_success', 'phone');
                return { success: true, user: data.user }
            }
        } catch (err) {
            const technicalMsg = err.response?.data?.message || 'Server Error';
            const message = mapError(technicalMsg);
            setError(message)
            analytics.trackAuth('login_failed', 'phone', { error: technicalMsg });
            return { success: false, message }
        }
    }

    const googleLogin = async (googleToken, role, location, geoLocation) => {
        setError(null)
        analytics.trackAuth('login_started', 'google');
        try {
            const response = await api.post('/auth/google', {
                token: googleToken,
                role,
                location,
                geoLocation
            });
            const { data } = response;

            if (data.success) {
                localStorage.setItem('daycraft-token', data.token)
                setToken(data.token)
                setUser(data.user)
                analytics.trackAuth('login_success', 'google', { isNewUser: data.isNewUser });
                return { success: true, isNewUser: data.isNewUser, user: data.user }
            }
        } catch (err) {
            console.error('Google Login Error:', err)
            const technicalMsg = err.response?.data?.message || 'Server Error';
            const message = mapError(technicalMsg);
            setError(message)
            analytics.trackAuth('login_failed', 'google', { error: technicalMsg });
            return { success: false, message }
        }
    }

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        isWorker: user?.role === 'worker',
        isEmployer: user?.role === 'employer',
        isAdmin: user?.role === 'admin',
        // Verification status helpers
        needsProfileCompletion: !!user && !user.profileCompleted,
        needsPhoneVerification: user?.role === 'worker' && !user?.phoneVerified,
        needsEmailVerification: !!user && !user?.emailVerified,
        register,
        login,
        logout,
        updateProfile,
        sendOtp,
        verifyOtp,
        googleLogin,
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
