import api from './api'

export const authService = {
    // Register new user
    register: async (userData) => {
        const response = await api.post('/auth/register', userData)
        if (response.data.token) {
            localStorage.setItem('daycraft-token', response.data.token)
        }
        return response.data
    },

    // Login user
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials)
        if (response.data.token) {
            localStorage.setItem('daycraft-token', response.data.token)
        }
        return response.data
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('daycraft-token')
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await api.get('/auth/me')
        return response.data
    },

    // Update user profile
    updateProfile: async (userData) => {
        const response = await api.put('/auth/profile', userData)
        return response.data
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('daycraft-token')
    }
}

export default authService
