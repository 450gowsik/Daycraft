const Job = require('../models/Job')
const User = require('../models/User')
const Application = require('../models/Application')
const WorkerPreference = require('../models/WorkerPreference')
const { getRecommendedJobs, getPersonalizedRecommendations } = require('../services/matchingService')
const { createNotification } = require('./notificationController')
const smsService = require('../services/smsService')


// @desc    Get all jobs (with filters)
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
    try {
        const { category, role, location, urgent, lat, lng, distance, limit } = req.query

        let query = { status: 'open' }

        if (category) query.category = category
        if (role) query.role = role
        if (urgent === 'true') query.urgent = true
        if (location) query.location = { $regex: location, $options: 'i' }

        // Geo-spatial query if coordinates provided
        if (lat && lng) {
            query.locationCoordinates = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: (parseInt(distance) || 10) * 1000 // default 10km
                }
            }
        }

        // Build query with optional limit
        let jobQuery = Job.find(query)
            .populate('employer', 'name rating photoVerified companyName')
            .sort({ createdAt: -1 })
            .lean() // Use lean() for faster read-only queries

        // Apply limit if specified
        if (limit && parseInt(limit) > 0) {
            jobQuery = jobQuery.limit(parseInt(limit))
        }

        const jobs = await jobQuery

        res.json({
            success: true,
            count: jobs.length,
            jobs
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: 'Server Error'
        })
    }
}

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Employer only)
exports.createJob = async (req, res) => {
    try {
        // 1. Role Check
        if (req.user.role !== 'employer') {
            return res.status(403).json({
                success: false,
                message: 'Only verified employers can post jobs'
            })
        }

        // 2. Profile Completion Check
        const user = await User.findById(req.user.id)
        if (!user.profileCompleted) {
            return res.status(400).json({
                success: false,
                message: 'Please complete your profile first'
            })
        }

        // 3. Create Job
        const {
            title,
            description,
            category,
            role,
            location,
            wage,
            wageType,
            duration,
            requiredWorkers,
            urgent
        } = req.body

        const job = await Job.create({
            employer: req.user.id,
            title,
            description,
            category,
            role,
            location,
            wage,
            wageType,
            duration,
            requiredWorkers,
            urgent,
            status: 'open'
        })

        res.status(201).json({
            success: true,
            job
        })

        // Notify matching workers (Intelligent Matching)
        try {
            // 1. Fetch potential candidates with hard filters
            const candidates = await User.find({
                role: 'worker',
                isActive: true,
                phoneVerified: true
            }).select('name phone skills location availability rating completedJobs geoLocation');

            // 2. Use matching service to rank and score
            const matchingService = require('../services/matchingService');
            const rankedWorkers = matchingService.getTopMatchingWorkers(candidates, job, 50); // Get top 50 to filter locally

            // 3. Filter by threshold (65+) and limit to Top 5
            const smsCandidates = rankedWorkers
                .filter(m => m.match.total >= 65)
                .slice(0, 5);

            for (const { worker, match } of smsCandidates) {
                // Backend internal notification
                await createNotification({
                    userId: worker._id,
                    type: 'job_match',
                    title: 'Recommended Job for You',
                    message: `Matched ${match.total}%: A new ${job.title} job is available in ${job.location}`,
                    data: {
                        jobId: job._id,
                        senderId: req.user.id,
                        matchScore: match.total
                    }
                });

                // External SMS alert
                if (worker.phone) {
                    try {
                        // Use distance context from match breakdown if available
                        const distanceText = match.breakdown.distance > 0 ? `${Math.round(30 - match.breakdown.distance)}km away` : 'near you';
                        await smsService.sendMatchAlert(worker.phone, job.title, job.location, distanceText);
                    } catch (smsError) {
                        console.error('Match SMS Error:', smsError.message);
                    }
                }
            }
        } catch (notifyError) {
            console.error('Intelligent matching notification error:', notifyError)
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: 'Server Error'
        })
    }
}

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('employer', 'name companyName avatar')

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }

        res.json({ success: true, job })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
exports.updateJob = async (req, res) => {
    try {
        let job = await Job.findById(req.params.id)

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }

        // Make sure user is job owner
        if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to update this job' })
        }

        job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })

        res.json({ success: true, job })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }

        // Make sure user is job owner
        if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this job' })
        }

        await job.deleteOne()

        res.json({ success: true, message: 'Job removed' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Get jobs posted by current employer
// @route   GET /api/jobs/user/my-jobs
// @access  Private
exports.getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ employer: req.user.id }).sort({ createdAt: -1 })
        res.json({ success: true, count: jobs.length, jobs })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Get nearby jobs
// @route   GET /api/jobs/nearby
// @access  Public
exports.getNearbyJobs = async (req, res) => {
    // Re-use getJobs logic for now
    return exports.getJobs(req, res)
}

// @desc    Apply to a job
// @route   POST /api/jobs/:id/apply
// @access  Private
exports.applyToJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' })

        // Check if already applied (Mocking logic as Application model might not be set up)
        // const existingApp = await Application.findOne({ job: req.params.id, worker: req.user.id })
        // if(existingApp) return res.status(400).json({ success: false, message: 'Already applied' })

        res.status(200).json({ success: true, message: 'Application submitted successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Get my applications
// @route   GET /api/jobs/user/my-applications
// @access  Private
exports.getMyApplications = async (req, res) => {
    try {
        // Mock response
        res.json({ success: true, applications: [] })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Update application status
// @route   PUT /api/jobs/:id/applications/:appId
// @access  Private
exports.updateApplicationStatus = async (req, res) => {
    try {
        res.json({ success: true, message: 'Status updated' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Get recommended jobs for worker
// @route   GET /api/jobs/user/recommended
// @access  Private (Worker)
exports.getRecommendedJobs = async (req, res) => {
    try {
        const worker = await User.findById(req.user.id)
        if (!worker) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        // Fetch all open jobs that the worker hasn't applied to yet
        const myApplications = await Application.find({ worker: req.user.id }).select('job')
        const appliedJobIds = myApplications.map(app => app.job.toString())

        const jobs = await Job.find({
            status: 'open',
            _id: { $nin: appliedJobIds }
        })
            .populate('employer', 'name rating photoVerified companyName avatar')
            .lean()

        const recommendedResult = getRecommendedJobs(jobs, worker, 10)

        res.json({
            success: true,
            count: recommendedResult.length,
            jobs: recommendedResult.map(r => ({
                ...r.job,
                match: r.match
            }))
        })
    } catch (error) {
        console.error('Recommended jobs error:', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Get top matching workers for a job
// @route   GET /api/jobs/:id/matches
// @access  Private (Employer)
exports.getJobMatches = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }

        // Authorization check
        if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' })
        }

        const matchingService = require('../services/matching.service')
        const matches = await matchingService.findMatchesForJob(req.params.id)

        res.json({
            success: true,
            count: matches.length,
            matches
        })
    } catch (error) {
        console.error('Matching error:', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Get location-matched jobs (location-first matching)
// @route   GET /api/jobs/location-matched
// @access  Public
exports.getLocationMatchedJobs = async (req, res) => {
    try {
        const { district, lat, lng, category } = req.query
        const { calculateMatchScore } = require('../services/matchingService')

        // Build base query
        let baseQuery = { status: 'open' }
        if (category) baseQuery.category = category

        // 1. Get jobs in exact same district (PRIORITY SECTION)
        let priorityJobs = []
        if (district) {
            const localQuery = {
                ...baseQuery,
                location: { $regex: district, $options: 'i' }
            }

            const localJobs = await Job.find(localQuery)
                .populate('employer', 'name rating photoVerified companyName avatar')
                .sort({ createdAt: -1 })
                .lean()

            // Score local jobs if user coordinates available
            if (lat && lng) {
                const userCoords = { lat: parseFloat(lat), lng: parseFloat(lng) }
                priorityJobs = localJobs.map(job => {
                    // Create a mock worker object for scoring
                    const mockWorker = {
                        skills: [],
                        geoLocation: { coordinates: [userCoords.lng, userCoords.lat] },
                        rating: 0,
                        completedJobs: 0
                    }
                    const matchResult = calculateMatchScore(mockWorker, job)
                    return {
                        ...job,
                        matchScore: matchResult.total,
                        matchBreakdown: matchResult.breakdown
                    }
                }).sort((a, b) => b.matchScore - a.matchScore)
            } else {
                priorityJobs = localJobs.map(job => ({
                    ...job,
                    matchScore: 80, // High default for local jobs
                    matchBreakdown: { skill: 0, distance: 30, quality: 10 }
                }))
            }
        }

        // 2. Get nearby jobs (OTHER SECTION - different from priority)
        let otherJobs = []
        const priorityJobIds = priorityJobs.map(j => j._id.toString())

        if (lat && lng) {
            // Use geo-spatial query for nearby jobs
            const nearbyQuery = {
                ...baseQuery,
                ...(priorityJobIds.length > 0 && { _id: { $nin: priorityJobIds.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) } }),
                geoLocation: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        $maxDistance: 100000 // 100km radius (expanded for better coverage)
                    }
                }
            }

            try {
                const nearbyRaw = await Job.find(nearbyQuery)
                    .populate('employer', 'name rating photoVerified companyName avatar')
                    .limit(30)
                    .lean()

                if (nearbyRaw.length > 0) {
                    const userCoords = { lat: parseFloat(lat), lng: parseFloat(lng) }
                    otherJobs = nearbyRaw.map(job => {
                        const mockWorker = {
                            skills: [],
                            geoLocation: { coordinates: [userCoords.lng, userCoords.lat] },
                            rating: 0,
                            completedJobs: 0
                        }
                        const matchResult = calculateMatchScore(mockWorker, job)
                        return {
                            ...job,
                            matchScore: matchResult.total,
                            matchBreakdown: matchResult.breakdown
                        }
                    }).sort((a, b) => b.matchScore - a.matchScore)
                }
            } catch (geoErr) {
                console.log('Geo query failed:', geoErr.message)
                // Will use fallback below
            }

            // Fallback: If geo-query returns empty or fails, get all other jobs
            if (otherJobs.length === 0) {
                console.log('Using fallback for otherJobs - no geo results')
                const fallbackJobs = await Job.find({
                    ...baseQuery,
                    ...(priorityJobIds.length > 0 && { _id: { $nin: priorityJobIds } })
                })
                    .populate('employer', 'name rating photoVerified companyName avatar')
                    .sort({ createdAt: -1 })
                    .limit(30)
                    .lean()

                otherJobs = fallbackJobs.map(job => ({
                    ...job,
                    matchScore: 50,
                    matchBreakdown: { skill: 0, distance: 10, quality: 10 }
                }))
            }
        } else {
            // No coordinates - just get remaining jobs
            const remainingJobs = await Job.find({
                ...baseQuery,
                ...(priorityJobIds.length > 0 && { _id: { $nin: priorityJobIds } })
            })
                .populate('employer', 'name rating photoVerified companyName avatar')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean()

            otherJobs = remainingJobs.map(job => ({
                ...job,
                matchScore: 50,
                matchBreakdown: { skill: 0, distance: 10, quality: 10 }
            }))
        }

        res.json({
            success: true,
            priorityJobs: priorityJobs.slice(0, 8), // First 8 jobs for "above the fold"
            otherJobs: otherJobs,
            counts: {
                priority: priorityJobs.length,
                other: otherJobs.length,
                total: priorityJobs.length + otherJobs.length
            }
        })
    } catch (error) {
        console.error('Location matched jobs error:', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Get AI-powered personalized job recommendations
// @route   GET /api/jobs/best-for-you
// @access  Private (requires auth)
exports.getBestForYouJobs = async (req, res) => {
    try {
        const workerId = req.user._id
        const { limit = 6, category } = req.query

        // Get worker profile
        const worker = await User.findById(workerId).lean()
        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found' })
        }

        // Get or create worker preferences
        let preferences = await WorkerPreference.findOne({ worker: workerId })
        if (!preferences) {
            // Create default preferences for new worker
            preferences = await WorkerPreference.create({ worker: workerId })
        }

        // Build job query
        let jobQuery = { status: 'open' }
        if (category) jobQuery.category = category

        // Prioritize jobs in worker's location if set
        if (worker.location) {
            // Get all open jobs, but we'll score location in matching
        }

        // Get available jobs
        const jobs = await Job.find(jobQuery)
            .populate('employer', 'name rating photoVerified companyName avatar')
            .sort({ createdAt: -1 })
            .limit(100) // Get more jobs for better selection
            .lean()

        // Get personalized recommendations
        const recommendations = getPersonalizedRecommendations(
            jobs,
            worker,
            preferences,
            parseInt(limit)
        )

        // Add "why recommended" reasons
        const enrichedRecommendations = recommendations.map(job => {
            const reasons = []

            if (job.matchBreakdown?.skill > 30) {
                reasons.push('Matches your skills')
            }
            if (job.matchBreakdown?.distance > 20) {
                reasons.push('Near your location')
            }
            if (job.matchBreakdown?.personalization > 15) {
                reasons.push('Based on your history')
            }
            if (job.wage && preferences.avgAppliedWage && job.wage >= preferences.avgAppliedWage) {
                reasons.push('Good pay rate')
            }

            return {
                ...job,
                whyRecommended: reasons.slice(0, 2) // Max 2 reasons
            }
        })

        res.json({
            success: true,
            recommendations: enrichedRecommendations,
            count: enrichedRecommendations.length,
            hasPreferences: preferences.stats.totalApplied > 0,
            message: preferences.stats.totalApplied > 0
                ? 'Personalized based on your activity'
                : 'Recommended based on your profile'
        })
    } catch (error) {
        console.error('Best for you jobs error:', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

// @desc    Record job view (for learning preferences) 
// @route   POST /api/jobs/:id/view
// @access  Private
exports.recordJobView = async (req, res) => {
    try {
        const jobId = req.params.id
        const workerId = req.user._id

        const job = await Job.findById(jobId).lean()
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' })
        }

        // Get or create preferences
        let preferences = await WorkerPreference.findOne({ worker: workerId })
        if (!preferences) {
            preferences = await WorkerPreference.create({ worker: workerId })
        }

        // Record the view
        await preferences.recordView(job)

        res.json({ success: true, message: 'View recorded' })
    } catch (error) {
        console.error('Record view error:', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}
