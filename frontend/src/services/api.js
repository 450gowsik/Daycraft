/**
 * API Service with Token Refresh
 * 
 * Features:
 * - Automatic token refresh on 401
 * - Request queuing during refresh
 * - Memory-based access token
 */

import axios from 'axios'
import { API_BASE_URL, buildApiUrl } from './apiConfig'

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Token storage (in memory for security)
let accessToken = null
let isRefreshing = false
let refreshSubscribers = []

// Set access token (called from AuthContext)
export const setAccessToken = (token) => {
    accessToken = token
}

// Get access token
export const getAccessToken = () => accessToken

// Subscribe to token refresh
const subscribeTokenRefresh = (callback) => {
    refreshSubscribers.push(callback)
}

// Notify subscribers with new token
const onTokenRefreshed = (newToken) => {
    refreshSubscribers.forEach(callback => callback(newToken))
    refreshSubscribers = []
}

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        // Use memory token first, fall back to trying Authorization header if set
        const token = accessToken || config.headers.Authorization?.replace('Bearer ', '')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // If 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            const refreshToken = localStorage.getItem('refreshToken')

            // No refresh token, reject
            if (!refreshToken) {
                return Promise.reject(error)
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`
                        resolve(api(originalRequest))
                    })
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                // Attempt token refresh
                const response = await axios.post(buildApiUrl('/auth/refresh-token'), {
                    refreshToken
                })

                if (response.data.success) {
                    const newAccessToken = response.data.accessToken
                    const newRefreshToken = response.data.refreshToken

                    // Update tokens
                    accessToken = newAccessToken
                    localStorage.setItem('refreshToken', newRefreshToken)

                    // Notify queued requests
                    onTokenRefreshed(newAccessToken)

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    return api(originalRequest)
                }
            } catch (refreshError) {
                // Refresh failed - clear tokens and reject
                accessToken = null
                localStorage.removeItem('refreshToken')

                // Optionally redirect to login
                // window.location.href = '/login'

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api
