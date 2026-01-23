import api from './api'

export const jobService = {
    // Get all jobs with optional filters
    getJobs: async (filters = {}) => {
        const params = new URLSearchParams()
        if (filters.category) params.append('category', filters.category)
        if (filters.search) params.append('search', filters.search)
        if (filters.location) params.append('location', filters.location)

        const response = await api.get(`/jobs?${params}`)
        return response.data
    },

    // Get single job by ID
    getJob: async (id) => {
        const response = await api.get(`/jobs/${id}`)
        return response.data
    },

    // Create new job
    createJob: async (jobData) => {
        const response = await api.post('/jobs', jobData)
        return response.data
    },

    // Update job
    updateJob: async (id, jobData) => {
        const response = await api.put(`/jobs/${id}`, jobData)
        return response.data
    },

    // Delete job
    deleteJob: async (id) => {
        const response = await api.delete(`/jobs/${id}`)
        return response.data
    },

    // Apply for a job
    applyForJob: async (jobId) => {
        const response = await api.post(`/jobs/${jobId}/apply`)
        return response.data
    },

    // Get location-matched jobs (location-first matching)
    getLocationMatchedJobs: async (district, lat, lng, category = '') => {
        const params = new URLSearchParams()
        if (district) params.append('district', district)
        if (lat) params.append('lat', lat)
        if (lng) params.append('lng', lng)
        if (category) params.append('category', category)

        const response = await api.get(`/jobs/location-matched?${params}`)
        return response.data
    },

    // Get AI-powered personalized recommendations (Best for You)
    getBestForYouJobs: async (limit = 6, category = '') => {
        const params = new URLSearchParams()
        params.append('limit', limit)
        if (category) params.append('category', category)

        const response = await api.get(`/jobs/best-for-you?${params}`)
        return response.data
    },

    // Record job view for learning preferences
    recordJobView: async (jobId) => {
        try {
            await api.post(`/jobs/${jobId}/view`)
        } catch (error) {
            // Silently fail - this is non-critical tracking
            console.log('View tracking failed:', error.message)
        }
    },

    // Quick apply (uses same apply endpoint, but called from card)
    quickApply: async (jobId) => {
        const response = await api.post(`/jobs/${jobId}/apply`)
        return response.data
    }
}

export default jobService

