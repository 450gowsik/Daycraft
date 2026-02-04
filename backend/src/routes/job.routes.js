const express = require('express')
const {
    getJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    getMyJobs,
    applyToJob,
    updateApplicationStatus,
    getMyApplications,
    getNearbyJobs,
    getRecommendedJobs,
    getJobMatches,
    getLocationMatchedJobs,
    getBestForYouJobs,
    recordJobView
} = require('../controllers/job.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// Public routes
router.get('/', getJobs)
router.get('/nearby', getNearbyJobs)
router.get('/location-matched', getLocationMatchedJobs)

// AI-powered recommendations (requires auth to personalize)
router.get('/best-for-you', protect, authorize('worker'), getBestForYouJobs)

// Protected user-specific routes (MUST come before /:id to avoid route conflicts)
router.get('/user/my-jobs', protect, authorize('employer', 'admin'), getMyJobs)
router.get('/user/my-applications', protect, authorize('worker'), getMyApplications)
router.get('/user/recommended', protect, authorize('worker'), getRecommendedJobs)

// Dynamic ID routes (must come AFTER specific string routes)
router.get('/:id', getJob)
router.get('/:id/matches', protect, authorize('employer', 'admin'), getJobMatches)

// Other protected routes
router.post('/', protect, authorize('employer', 'admin'), createJob)
router.put('/:id', protect, updateJob)
router.delete('/:id', protect, deleteJob)

// Application routes
router.post('/:id/apply', protect, authorize('worker'), applyToJob)
router.put('/:id/applications/:appId', protect, authorize('employer', 'admin'), updateApplicationStatus)

// Learning/tracking routes
router.post('/:id/view', protect, authorize('worker'), recordJobView)

module.exports = router

