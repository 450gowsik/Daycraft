/**
 * Worker Controller
 * 
 * Updated for new Worker model that links to User via userId.
 * Workers are now profiles, not auth entities.
 */

const User = require('../models/User')
const Worker = require('../models/Worker')
const Job = require('../models/Job')
const { getTopMatchingWorkers } = require('../services/matchingService')

/**
 * Build worker response with user data
 */
const buildWorkerResponse = async (worker) => {
    const user = await User.findById(worker.userId).select('-password')
    if (!user) return null

    return {
        _id: worker._id,
        userId: worker.userId,
        // User data
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        location: user.location,
        geoLocation: user.geoLocation,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        idVerified: user.idVerified,
        isActive: user.isActive,
        // Worker-specific data
        skills: worker.skills,
        experience: worker.experience,
        availability: worker.availability,
        dailyRate: worker.dailyRate,
        bio: worker.bio,
        rating: worker.rating,
        completedJobs: worker.completedJobs,
        workLocation: worker.workLocation,
        workRadius: worker.workRadius,
        profileCompleted: worker.profileCompleted,
        skillsVerified: worker.skillsVerified,
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt
    }
}

// @desc    Get all workers
// @route   GET /api/workers
exports.getWorkers = async (req, res) => {
    try {
        const { search, skills, location, minRate, maxRate } = req.query

        // Build query for Worker collection
        const workerQuery = {}

        if (minRate || maxRate) {
            workerQuery.dailyRate = {}
            if (minRate) workerQuery.dailyRate.$gte = parseInt(minRate)
            if (maxRate) workerQuery.dailyRate.$lte = parseInt(maxRate)
        }

        if (skills) {
            const skillList = skills.split(',')
            workerQuery.$or = [
                { 'skills.en': { $in: skillList.map(s => new RegExp(s, 'i')) } },
                { 'skills.ta': { $in: skillList.map(s => new RegExp(s, 'i')) } }
            ]
        }

        // Fetch workers
        let workers = await Worker.find(workerQuery)
            .populate({
                path: 'userId',
                model: 'User',
                select: '-password',
                match: { isActive: true }
            })
            .sort({ rating: -1, completedJobs: -1 })

        // Filter out workers whose user is null (inactive or deleted)
        workers = workers.filter(w => w.userId !== null)

        // Apply location filter (location is in User model)
        if (location) {
            workers = workers.filter(w =>
                w.userId.location &&
                w.userId.location.toLowerCase().includes(location.toLowerCase())
            )
        }

        // Apply search filter
        if (search) {
            const searchRegex = new RegExp(search, 'i')
            workers = workers.filter(w =>
                searchRegex.test(w.userId.name) ||
                searchRegex.test(w.bio) ||
                w.skills.some(s => searchRegex.test(s.en) || searchRegex.test(s.ta)) ||
                searchRegex.test(w.userId.location)
            )
        }

        // Transform response
        const workerResponses = workers.map(w => ({
            _id: w._id,
            userId: w.userId._id,
            name: w.userId.name,
            email: w.userId.email,
            phone: w.userId.phone,
            avatar: w.userId.avatar,
            location: w.userId.location,
            geoLocation: w.userId.geoLocation,
            phoneVerified: w.userId.phoneVerified,
            isActive: w.userId.isActive,
            skills: w.skills,
            experience: w.experience,
            availability: w.availability,
            dailyRate: w.dailyRate,
            bio: w.bio,
            rating: w.rating,
            completedJobs: w.completedJobs,
            profileCompleted: w.profileCompleted
        }))

        res.json({
            success: true,
            count: workerResponses.length,
            workers: workerResponses
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
        const worker = await Worker.findById(req.params.id)
            .populate({
                path: 'userId',
                model: 'User',
                select: '-password'
            })

        if (!worker || !worker.userId) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            })
        }

        const workerResponse = await buildWorkerResponse(worker)

        res.json({
            success: true,
            worker: workerResponse
        })
    } catch (error) {
        console.error('Get worker error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch worker'
        })
    }
}

// @desc    Get my worker profile
// @route   GET /api/workers/profile/me
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user._id

        let worker = await Worker.findOne({ userId })

        if (!worker) {
            // Create profile if doesn't exist and user has worker role
            if (req.user.roles.includes('worker')) {
                worker = await Worker.create({ userId })
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Worker profile not found. Add worker role first.'
                })
            }
        }

        const workerResponse = await buildWorkerResponse(worker)

        res.json({
            success: true,
            worker: workerResponse
        })
    } catch (error) {
        console.error('Get my profile error:', error)
        res.status(500).json({
            success: false,
            message: 'Server Error'
        })
    }
}

// @desc    Update worker profile
// @route   PUT /api/workers/profile/me
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id

        // User-level fields to update
        const userFields = {}
        if (req.body.name) userFields.name = req.body.name
        if (req.body.phone) userFields.phone = req.body.phone
        if (req.body.location) userFields.location = req.body.location
        if (req.body.avatar) userFields.avatar = req.body.avatar

        if (Object.keys(userFields).length > 0) {
            await User.findByIdAndUpdate(userId, userFields)
        }

        // Worker-level fields to update
        const workerFields = {}
        if (req.body.bio) workerFields.bio = req.body.bio
        if (req.body.skills) workerFields.skills = req.body.skills
        if (req.body.experience) workerFields.experience = req.body.experience
        if (req.body.dailyRate) workerFields.dailyRate = req.body.dailyRate
        if (req.body.availability) workerFields.availability = req.body.availability
        if (req.body.workLocation) workerFields.workLocation = req.body.workLocation
        if (req.body.workRadius) workerFields.workRadius = req.body.workRadius
        if (req.body.preferredJobTypes) workerFields.preferredJobTypes = req.body.preferredJobTypes
        if (req.body.profileCompleted !== undefined) workerFields.profileCompleted = req.body.profileCompleted

        const worker = await Worker.findOneAndUpdate(
            { userId },
            workerFields,
            { new: true, upsert: true }
        )

        const workerResponse = await buildWorkerResponse(worker)

        res.json({
            success: true,
            worker: workerResponse
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

        // 2. Fetch all active workers with user data
        const workers = await Worker.find({
            profileCompleted: true,
            availability: 'available'
        }).populate({
            path: 'userId',
            model: 'User',
            select: '-password',
            match: {
                isActive: true,
                phoneVerified: true
            }
        }).lean()

        // Filter out workers with null userId (user not matching criteria)
        const activeWorkers = workers.filter(w => w.userId !== null)

        // Transform to format expected by matching service
        const workerData = activeWorkers.map(w => ({
            _id: w._id,
            userId: w.userId._id,
            name: w.userId.name,
            location: w.userId.location,
            geoLocation: w.userId.geoLocation,
            skills: w.skills,
            experience: w.experience,
            dailyRate: w.dailyRate,
            rating: w.rating,
            completedJobs: w.completedJobs,
            availability: w.availability
        }))

        // 3. Score and sort
        const recommended = getTopMatchingWorkers(workerData, job, 10)

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
