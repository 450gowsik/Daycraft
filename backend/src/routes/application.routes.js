const express = require('express')
const router = express.Router()
const {
    applyForJob,
    checkApplication,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus,
    withdrawApplication
} = require('../controllers/application.controller')
const { protect } = require('../middleware/auth')

// All routes require authentication
router.use(protect)

// Worker routes
router.post('/', applyForJob)
router.get('/check/:jobId', checkApplication)
router.get('/my', getMyApplications)
router.delete('/:id', withdrawApplication)

// Employer routes
router.get('/job/:jobId', getJobApplicants)
router.patch('/:id/status', updateApplicationStatus)

module.exports = router
