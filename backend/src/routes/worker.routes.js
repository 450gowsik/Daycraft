const express = require('express')
const { getWorkers, getWorker, getMyProfile, updateProfile, getRecommendedWorkers } = require('../controllers/worker.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// Public routes
router.get('/', getWorkers)
router.get('/:id', getWorker)

// Protected routes
router.get('/profile/me', protect, getMyProfile)
router.put('/profile/me', protect, updateProfile)
router.get('/recommended/:jobId', protect, authorize('employer', 'admin'), getRecommendedWorkers)

module.exports = router
