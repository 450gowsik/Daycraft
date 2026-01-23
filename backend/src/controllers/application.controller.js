const Application = require('../models/Application')
const Job = require('../models/Job')
const User = require('../models/User')
const { createNotification } = require('./notificationController')
const smsService = require('../services/smsService')

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Worker only)
exports.applyForJob = async (req, res) => {
    try {
        const { jobId, message } = req.body
        const workerId = req.user.id

        // Check if user is a worker
        const worker = await User.findById(workerId)
        if (!worker) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        // Get job details
        const job = await Job.findById(jobId)
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }

        // Check if job is still open
        if (job.status !== 'open') {
            return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' })
        }

        // Check if already applied (handled by unique index, but good to check first)
        const existingApplication = await Application.findOne({ job: jobId, worker: workerId })
        if (existingApplication) {
            return res.status(400).json({ success: false, message: 'You have already applied for this job' })
        }

        // Create application
        const application = await Application.create({
            job: jobId,
            worker: workerId,
            employer: job.employer,
            workerLocation: worker.location || '',
            message: message || ''
        })

        // Populate for response
        const populatedApplication = await Application.findById(application._id)
            .populate('job', 'title location wage')
            .populate('worker', 'name phone location skills')

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: populatedApplication
        })

        // Notify employer
        await createNotification({
            userId: job.employer,
            type: 'application_received',
            title: 'New Application',
            message: `${worker.name} applied for your job: ${job.title}`,
            data: {
                jobId: job._id,
                applicationId: application._id,
                senderId: worker._id
            }
        })
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already applied for this job' })
        }
        console.error('Apply error:', error)
        res.status(500).json({ success: false, message: 'Failed to submit application' })
    }
}

// @desc    Check if user has applied for a job
// @route   GET /api/applications/check/:jobId
// @access  Private
exports.checkApplication = async (req, res) => {
    try {
        const { jobId } = req.params
        const workerId = req.user.id

        const application = await Application.findOne({ job: jobId, worker: workerId })

        res.json({
            success: true,
            hasApplied: !!application,
            application: application || null
        })
    } catch (error) {
        console.error('Check application error:', error)
        res.status(500).json({ success: false, message: 'Failed to check application status' })
    }
}

// @desc    Get worker's applications
// @route   GET /api/applications/my
// @access  Private (Worker only)
exports.getMyApplications = async (req, res) => {
    try {
        const workerId = req.user.id
        const { status, page = 1, limit = 20 } = req.query

        const query = { worker: workerId }
        if (status) query.status = status

        const applications = await Application.find(query)
            .populate('job', 'title location wage category urgent status createdAt')
            .populate('employer', 'name companyName phone')
            .sort({ appliedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))

        const total = await Application.countDocuments(query)

        res.json({
            success: true,
            data: applications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Get my applications error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch applications' })
    }
}

// @desc    Get applicants for a job (Employer view)
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer only - job owner)
exports.getJobApplicants = async (req, res) => {
    try {
        const { jobId } = req.params
        const employerId = req.user.id
        const { status, page = 1, limit = 20 } = req.query

        // Verify job ownership
        const job = await Job.findById(jobId)
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }
        if (job.employer.toString() !== employerId) {
            return res.status(403).json({ success: false, message: 'Not authorized to view applicants' })
        }

        const query = { job: jobId }
        if (status) query.status = status

        const applications = await Application.find(query)
            .populate('worker', 'name phone location skills experience rating completedJobs avatar availability')
            .sort({ appliedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))

        const total = await Application.countDocuments(query)

        // Get status counts
        const statusCounts = await Application.aggregate([
            { $match: { job: job._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])

        res.json({
            success: true,
            job: {
                id: job._id,
                title: job.title,
                location: job.location
            },
            data: applications,
            statusCounts: statusCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count
                return acc
            }, {}),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Get job applicants error:', error)
        res.status(500).json({ success: false, message: 'Failed to fetch applicants' })
    }
}

// @desc    Update application status (Employer action)
// @route   PATCH /api/applications/:id/status
// @access  Private (Employer only)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status, notes } = req.body
        const employerId = req.user.id

        const validStatuses = ['viewed', 'shortlisted', 'hired', 'rejected']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' })
        }

        const application = await Application.findById(id).populate('job')
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' })
        }

        // Verify employer owns the job
        if (application.employer.toString() !== employerId) {
            return res.status(403).json({ success: false, message: 'Not authorized' })
        }

        application.status = status
        application.statusUpdatedAt = new Date()
        if (notes) application.employerNotes = notes

        await application.save()

        const updated = await Application.findById(id)
            .populate('worker', 'name phone location skills')
            .populate('job', 'title')

        res.json({
            success: true,
            message: `Application ${status}`,
            data: updated
        })

        // Notify worker
        await createNotification({
            userId: application.worker,
            type: status === 'hired' ? 'request_accepted' : 'system',
            title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your application for "${application.job.title}" has been ${status}.`,
            data: {
                jobId: application.job._id,
                applicationId: application._id,
                senderId: employerId
            }
        })

        // Notify worker via SMS for critical updates (Hired/Rejected)
        if (status === 'hired' || status === 'rejected') {
            try {
                const worker = await User.findById(application.worker);
                if (worker && worker.phone) {
                    await smsService.sendJobAlert(worker.phone, application.job.title, status);
                }
            } catch (smsError) {
                console.error('SMS Notification Error:', smsError.message);
            }
        }
    } catch (error) {
        console.error('Update status error:', error)
        res.status(500).json({ success: false, message: 'Failed to update status' })
    }
}

// @desc    Withdraw application (Worker action)
// @route   DELETE /api/applications/:id
// @access  Private (Worker only)
exports.withdrawApplication = async (req, res) => {
    try {
        const { id } = req.params
        const workerId = req.user.id

        const application = await Application.findById(id)
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' })
        }

        // Verify worker owns the application
        if (application.worker.toString() !== workerId) {
            return res.status(403).json({ success: false, message: 'Not authorized' })
        }

        // Can only withdraw if still in 'applied' status
        if (application.status !== 'applied') {
            return res.status(400).json({ success: false, message: 'Cannot withdraw application at this stage' })
        }

        await Application.findByIdAndDelete(id)

        res.json({
            success: true,
            message: 'Application withdrawn'
        })
    } catch (error) {
        console.error('Withdraw error:', error)
        res.status(500).json({ success: false, message: 'Failed to withdraw application' })
    }
}
