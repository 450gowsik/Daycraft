import api from './api';

const paymentService = {
    /**
     * Create a Razorpay Order
     */
    createOrder: async (jobId, workerId, amount) => {
        try {
            const response = await api.post('/payments/create-order', {
                jobId,
                workerId,
                amount
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Failed to initiate payment';
        }
    },

    /**
     * Confirm Mock Payment
     */
    confirmMockPayment: async (paymentId) => {
        try {
            const response = await api.post('/payments/confirm-mock', {
                paymentId
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Failed to confirm payment';
        }
    },

    /**
     * Release Funds to Worker
     */
    releaseFunds: async (paymentId) => {
        try {
            const response = await api.post(`/payments/release/${paymentId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Failed to release payment';
        }
    },

    /**
     * Get Payment History
     */
    getHistory: async () => {
        try {
            const response = await api.get('/payments/history');
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Failed to fetch payment history';
        }
    }
};

export default paymentService;
