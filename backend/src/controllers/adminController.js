const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')
const Job = require('../models/Job')

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        // Count from all collections
        const legacyUsers = await User.countDocuments()
        const newWorkers = await Worker.countDocuments()
        const newEmployers = await Employer.countDocuments()
        const legacyWorkers = await User.countDocuments({ role: 'worker' })
        const legacyEmployers = await User.countDocuments({ role: 'employer' })

        const totalUsers = legacyUsers + newWorkers + newEmployers
        const totalWorkers = newWorkers + legacyWorkers
        const totalEmployers = newEmployers + legacyEmployers

        const totalJobs = await Job.countDocuments()
        const activeJobs = await Job.countDocuments({ status: 'open' })
        const completedJobs = await Job.countDocuments({ status: 'completed' })

        // Recent registrations (last 7 days) from all collections
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentLegacy = await User.countDocuments({ createdAt: { $gte: weekAgo } })
        const recentWorkers = await Worker.countDocuments({ createdAt: { $gte: weekAgo } })
        const recentEmployers = await Employer.countDocuments({ createdAt: { $gte: weekAgo } })
        const recentUsers = recentLegacy + recentWorkers + recentEmployers
        const recentJobs = await Job.countDocuments({ createdAt: { $gte: weekAgo } })

        // Calculate total Volume (sum of all wages for jobs)
        const allJobs = await Job.find().select('wage requiredWorkers')
        const totalVolume = allJobs.reduce((sum, job) => sum + (job.wage * (job.requiredWorkers || 1)), 0)

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalWorkers,
                totalEmployers,
                totalJobs,
                activeJobs,
                completedJobs,
                recentUsers,
                recentJobs,
                totalVolume
            }
        })
    } catch (error) {
        console.error('Get stats error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        })
    }
}

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const { role, search, status } = req.query
        const query = {}

        if (status === 'active') query.isActive = true
        if (status === 'suspended') query.isActive = false
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ]
        }

        let users = []

        // Fetch from appropriate collections based on role filter
        if (!role || role === 'worker') {
            const workers = await Worker.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(100)
            users = [...users, ...workers.map(w => ({ ...w.toObject(), _collection: 'workers' }))]

            // Also fetch legacy workers
            const legacyWorkers = await User.find({ ...query, role: 'worker' })
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(100)
            users = [...users, ...legacyWorkers.map(w => ({ ...w.toObject(), _collection: 'users' }))]
        }

        if (!role || role === 'employer') {
            const employers = await Employer.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(100)
            users = [...users, ...employers.map(e => ({ ...e.toObject(), _collection: 'employers' }))]

            // Also fetch legacy employers
            const legacyEmployers = await User.find({ ...query, role: 'employer' })
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(100)
            users = [...users, ...legacyEmployers.map(e => ({ ...e.toObject(), _collection: 'users' }))]
        }

        if (role === 'admin') {
            const admins = await User.find({ ...query, role: 'admin' })
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(100)
            users = [...users, ...admins.map(a => ({ ...a.toObject(), _collection: 'users' }))]
        }

        // Sort by createdAt and limit
        users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        users = users.slice(0, 100)

        res.json({
            success: true,
            count: users.length,
            users
        })
    } catch (error) {
        console.error('Get users error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        })
    }
}

// @desc    Update user status
// @route   PUT /api/admin/users/:id
exports.updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body
        const userId = req.params.id

        // Try to find and update in all collections
        let user = await Worker.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        ).select('-password')

        if (!user) {
            user = await Employer.findByIdAndUpdate(
                userId,
                { isActive },
                { new: true }
            ).select('-password')
        }

        if (!user) {
            user = await User.findByIdAndUpdate(
                userId,
                { isActive },
                { new: true }
            ).select('-password')
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        res.json({
            success: true,
            message: isActive ? 'User activated' : 'User suspended',
            user
        })
    } catch (error) {
        console.error('Update user status error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        })
    }
}

// @desc    Get all jobs for moderation
// @route   GET /api/admin/jobs
exports.getJobsForModeration = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('employer', 'name email')
            .sort({ createdAt: -1 })
            .limit(100)

        res.json({
            success: true,
            count: jobs.length,
            jobs
        })
    } catch (error) {
        console.error('Get jobs error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs'
        })
    }
}

// @desc    Delete job (admin)
// @route   DELETE /api/admin/jobs/:id
exports.deleteJobAdmin = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id)

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            })
        }

        res.json({
            success: true,
            message: 'Job deleted successfully'
        })
    } catch (error) {
        console.error('Delete job error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to delete job'
        })
    }
}
