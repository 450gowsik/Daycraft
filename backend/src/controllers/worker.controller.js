const User = require('../models/User')
const Worker = require('../models/Worker')
const Job = require('../models/Job')
const { getTopMatchingWorkers } = require('../services/matchingService')

// @desc    Get all workers
// @route   GET /api/workers
exports.getWorkers = async (req, res) => {
    try {
        const { search, skills, location, minRate, maxRate } = req.query

        const query = { isActive: true }

        if (location) query.location = new RegExp(location, 'i')

        if (minRate || maxRate) {
            query.dailyRate = {}
            if (minRate) query.dailyRate.$gte = parseInt(minRate)
            if (maxRate) query.dailyRate.$lte = parseInt(maxRate)
        }

        if (skills) {
            const skillList = skills.split(',')
            query.$or = [
                { 'skills.en': { $in: skillList.map(s => new RegExp(s, 'i')) } },
                { 'skills.ta': { $in: skillList.map(s => new RegExp(s, 'i')) } }
            ]
        }

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { bio: new RegExp(search, 'i') },
                { 'skills.en': new RegExp(search, 'i') },
                { 'skills.ta': new RegExp(search, 'i') },
                { location: new RegExp(search, 'i') }
            ]
        }

        // Fetch from new Worker collection
        const newWorkers = await Worker.find(query)
            .select('-password')
            .sort({ rating: -1, completedJobs: -1 })

        // Also fetch from legacy User collection (for backward compatibility)
        const legacyQuery = { ...query, role: 'worker' }
        const legacyWorkers = await User.find(legacyQuery)
            .select('-password')
            .sort({ rating: -1, completedJobs: -1 })

        // Combine both results, avoiding duplicates by email
        const emailSet = new Set(newWorkers.map(w => w.email))
        const combinedWorkers = [
            ...newWorkers,
            ...legacyWorkers.filter(w => !emailSet.has(w.email))
        ]

        res.json({
            success: true,
            count: combinedWorkers.length,
            workers: combinedWorkers
        })
    } catch (error) {
        console.error('Get workers error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workers'
        })
    }
}

// @desc    Get single worker
// @route   GET /api/workers/:id
exports.getWorker = async (req, res) => {
    try {
        // Check Worker collection first, then fallback to User
        let worker = await Worker.findById(req.params.id).select('-password')
        if (!worker) {
            worker = await User.findOne({ _id: req.params.id, role: 'worker' }).select('-password')
        }

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            })
        }

        res.json({
            success: true,
            worker
        })
    } catch (error) {
        console.error('Get worker error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch worker'
        })
    }
}

// @desc    Get my profile
// @route   GET /api/workers/profile/me
exports.getMyProfile = async (req, res) => {
    try {
        // Check Worker collection first, then fallback to User
        let worker = await Worker.findById(req.user.id).select('-password')
        if (!worker) {
            worker = await User.findById(req.user.id).select('-password')
        }
        res.json({
            success: true,
            worker
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        })
    }
}

// @desc    Update profile
// @route   PUT /api/workers/profile/me
exports.updateProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            phone: req.body.phone,
            location: req.body.location,
            bio: req.body.bio,
            skills: req.body.skills,
            experience: req.body.experience,
            dailyRate: req.body.dailyRate,
            availability: req.body.availability
        }

        const worker = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        }).select('-password')

        res.json({
            success: true,
            worker
        })
    } catch (error) {
        console.error('Update worker profile error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        })
    }
}

// @desc    Get top matching workers for a specific job
// @route   GET /api/workers/recommended/:jobId
// @access  Private (Employer)
exports.getRecommendedWorkers = async (req, res) => {
    try {
        const { jobId } = req.params

        // 1. Get job details
        const job = await Job.findById(jobId)
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }

        // 2. Fetch all active workers
        const workers = await User.find({
            role: 'worker',
            isActive: true,
            availability: 'available',
            phoneVerified: true,
            profileCompleted: true
        }).select('-password').lean()

        // 3. Score and sort
        const recommended = getTopMatchingWorkers(workers, job, 10)

        res.json({
            success: true,
            count: recommended.length,
            workers: recommended.map(r => ({
                ...r.worker,
                match: r.match
            }))
        })
    } catch (error) {
        console.error('Recommended workers error:', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}
