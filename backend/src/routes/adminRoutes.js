const express = require('express')
const {
    getStats,
    getUsers,
    updateUserStatus,
    getJobsForModeration,
    deleteJobAdmin
} = require('../controllers/adminController')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// All admin routes require admin role
router.use(protect, authorize('admin'))

router.get('/stats', getStats)
router.get('/users', getUsers)
router.put('/users/:id', updateUserStatus)
router.get('/jobs', getJobsForModeration)
router.delete('/jobs/:id', deleteJobAdmin)

module.exports = router
