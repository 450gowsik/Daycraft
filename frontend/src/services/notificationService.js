import api from './api';

const notificationService = {
    // Get all notifications for current user
    getNotifications: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },

    // Mark a notification as read
    markAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    // Mark all notifications as read
    markAllRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    }
};

export default notificationService;
