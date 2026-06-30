/**
 * API Service with Token Refresh
 * 
 * Features:
 * - Automatic token refresh on 401
 * - Request queuing during refresh
 * - Memory-based access token
 * - Refresh token via HttpOnly cookie (no localStorage)
 */

import axios from 'axios'
import { API_BASE_URL, buildApiUrl } from './apiConfig'

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    withCredentials: true, // Send cookies with every request
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

// Notify subscribers of refresh failure
const onTokenRefreshFailed = () => {
    refreshSubscribers.forEach(callback => callback(null))
    refreshSubscribers = []
}

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
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

        const isAuthRoute = originalRequest?.url?.includes('/auth/refresh-token') || 
                            originalRequest?.url?.includes('/auth/login') ||
                            originalRequest?.url?.includes('/auth/logout')

        // If 401, we haven't tried to refresh yet, and it is not an auth route itself
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((newToken) => {
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`
                            resolve(api(originalRequest))
                        } else {
                            reject(error)
                        }
                    })
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                // Attempt token refresh — cookie is sent automatically
                const response = await axios.post(buildApiUrl('/auth/refresh-token'), {}, {
                    withCredentials: true
                })

                if (response.data.success) {
                    const newAccessToken = response.data.accessToken

                    // Update in-memory token
                    accessToken = newAccessToken

                    // Notify queued requests
                    onTokenRefreshed(newAccessToken)

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    return api(originalRequest)
                }
            } catch (refreshError) {
                // Refresh failed - clear token
                accessToken = null
                onTokenRefreshFailed()

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api
