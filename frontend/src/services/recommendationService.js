import api from './api';

const recommendationService = {
    // Get recommended jobs for the current worker
    getRecommendedJobs: async () => {
        const response = await api.get('/jobs/user/recommended');
        return response.data;
    },

    // Get top matching workers for a specific job (Employer view)
    getTopWorkers: async (jobId) => {
        const response = await api.get(`/workers/recommended/${jobId}`);
        return response.data;
    }
};

export default recommendationService;
