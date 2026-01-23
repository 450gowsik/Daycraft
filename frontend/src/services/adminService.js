import api from './api';

const adminService = {
    // Platform overview
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // User management
    getUsers: async (params = {}) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    updateUserStatus: async (id, isActive) => {
        const response = await api.patch(`/admin/users/${id}/status`, { isActive });
        return response.data;
    },

    // Job moderation
    getJobs: async () => {
        const response = await api.get('/admin/jobs');
        return response.data;
    }
};

export default adminService;
