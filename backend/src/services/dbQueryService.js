/**
 * Database Query Service for AI Chatbot
 * Provides real-time data from MongoDB to eliminate LLM hallucinations
 */

const Worker = require('../models/Worker')
const User = require('../models/User')
const Job = require('../models/Job')
const Employer = require('../models/Employer')

/**
 * Get worker count by location
 * @param {string} location - Location to filter (optional)
 * @param {number} minRating - Minimum rating to filter by (optional)
 * @returns {Object} { total, verified, available }
 */
const getWorkerCount = async (location = null, minRating = 0) => {
    try {
        const matchStage = {}

        if (location) {
            matchStage.location = { $regex: new RegExp(location, 'i') }
        }

        if (minRating > 0) {
            matchStage.rating = { $gte: Number(minRating) }
        }

        // Query Worker collection
        const workerStats = await Worker.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    verified: { $sum: { $cond: [{ $eq: ['$idVerified', true] }, 1, 0] } },
                    available: { $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] } }
                }
            }
        ])

        // Also check User collection for workers (backward compatibility)
        const userStats = await User.aggregate([
            { $match: { role: 'worker', ...matchStage } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    verified: { $sum: { $cond: [{ $eq: ['$idVerified', true] }, 1, 0] } },
                    available: { $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] } }
                }
            }
        ])

        const ws = workerStats[0] || { total: 0, verified: 0, available: 0 }
        const us = userStats[0] || { total: 0, verified: 0, available: 0 }

        return {
            total: ws.total + us.total,
            verified: ws.verified + us.verified,
            available: ws.available + us.available,
            location: location || 'all locations',
            minRating: minRating || 0
        }
    } catch (error) {
        console.error('getWorkerCount error:', error)
        return { total: 0, verified: 0, available: 0, error: error.message }
    }
}

/**
 * Search for worker by name (fuzzy match)
 * @param {string} name - Name to search
 * @returns {Object} { found, workers: [...] }
 */
const searchWorker = async (name) => {
    try {
        if (!name || name.trim().length < 2) {
            return { found: false, workers: [], message: 'Name too short' }
        }

        const searchRegex = new RegExp(name.trim(), 'i')

        // Search in Worker collection
        const workers = await Worker.find({ name: searchRegex })
            .select('name rating experience completedJobs skills location availability dailyRate')
            .limit(5)
            .lean()

        // Also search in User collection
        const users = await User.find({ name: searchRegex, role: 'worker' })
            .select('name rating experience completedJobs skills location availability dailyRate')
            .limit(5)
            .lean()

        const allWorkers = [...workers, ...users]

        return {
            found: allWorkers.length > 0,
            count: allWorkers.length,
            workers: allWorkers.map(w => ({
                id: w._id,
                name: w.name,
                rating: w.rating || 0,
                experience: w.experience || 'Not specified',
                completedJobs: w.completedJobs || 0,
                location: w.location || 'Not specified',
                availability: w.availability || 'unknown',
                dailyRate: w.dailyRate || 0,
                skills: (w.skills || []).map(s => s.en || s).slice(0, 3)
            }))
        }
    } catch (error) {
        console.error('searchWorker error:', error)
        return { found: false, workers: [], error: error.message }
    }
}

/**
 * Get detailed worker profile by name
 * @param {string} name - Worker name
 * @returns {Object} Worker profile details
 */
const getWorkerProfile = async (name) => {
    try {
        const searchRegex = new RegExp(name.trim(), 'i')

        let worker = await Worker.findOne({ name: searchRegex })
            .select('name rating experience completedJobs skills location availability dailyRate bio phoneVerified idVerified createdAt')
            .lean()

        if (!worker) {
            worker = await User.findOne({ name: searchRegex, role: 'worker' })
                .select('name rating experience completedJobs skills location availability dailyRate bio phoneVerified idVerified createdAt')
                .lean()
        }

        if (!worker) {
            return { found: false, message: `No worker found with name "${name}"` }
        }

        return {
            found: true,
            profile: {
                name: worker.name,
                rating: worker.rating || 0,
                experience: worker.experience || 'Not specified',
                completedJobs: worker.completedJobs || 0,
                location: worker.location || 'Not specified',
                availability: worker.availability || 'unknown',
                dailyRate: worker.dailyRate || 0,
                skills: (worker.skills || []).map(s => s.en || s),
                bio: worker.bio || '',
                verified: worker.idVerified || false,
                phoneVerified: worker.phoneVerified || false,
                memberSince: worker.createdAt
            }
        }
    } catch (error) {
        console.error('getWorkerProfile error:', error)
        return { found: false, error: error.message }
    }
}

/**
 * Get job count by location and status
 * @param {string} location - Location filter (optional)
 * @param {string} status - Job status filter (optional)
 * @returns {Object} { total, open, urgent, inProgress }
 */
const getJobCount = async (location = null, status = null) => {
    try {
        const matchStage = {}
        if (location) {
            matchStage.location = { $regex: new RegExp(location, 'i') }
        }
        if (status) {
            matchStage.status = status
        }

        const stats = await Job.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
                    urgent: { $sum: { $cond: ['$urgent', 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }
                }
            }
        ])

        const s = stats[0] || { total: 0, open: 0, urgent: 0, inProgress: 0 }

        return {
            total: s.total,
            open: s.open,
            urgent: s.urgent,
            inProgress: s.inProgress,
            location: location || 'all locations'
        }
    } catch (error) {
        console.error('getJobCount error:', error)
        return { total: 0, open: 0, urgent: 0, error: error.message }
    }
}

/**
 * Search jobs by keyword or category
 * @param {string} query - Search query
 * @param {string} location - Location filter (optional)
 * @returns {Object} { jobs: [...] }
 */
const searchJobs = async (query, location = null) => {
    try {
        const matchStage = { status: 'open' }

        if (query) {
            matchStage.$or = [
                { 'title.en': { $regex: new RegExp(query, 'i') } },
                { 'description.en': { $regex: new RegExp(query, 'i') } },
                { category: { $regex: new RegExp(query, 'i') } }
            ]
        }
        if (location) {
            matchStage.location = { $regex: new RegExp(location, 'i') }
        }

        const jobs = await Job.find(matchStage)
            .select('title category location wage wageType urgent startDate')
            .populate('employer', 'name companyName')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()

        return {
            found: jobs.length > 0,
            count: jobs.length,
            jobs: jobs.map(j => ({
                id: j._id,
                title: j.title?.en || j.title,
                category: j.category,
                location: j.location,
                wage: j.wage,
                wageType: j.wageType,
                urgent: j.urgent,
                employer: j.employer?.name || j.employer?.companyName || 'Unknown',
                startDate: j.startDate
            }))
        }
    } catch (error) {
        console.error('searchJobs error:', error)
        return { found: false, jobs: [], error: error.message }
    }
}

/**
 * Search employer by name
 * @param {string} name - Employer name
 * @returns {Object} { found, employers: [...] }
 */
const searchEmployer = async (name) => {
    try {
        const searchRegex = new RegExp(name.trim(), 'i')

        // Search in Employer collection
        const employers = await Employer.find({
            $or: [
                { name: searchRegex },
                { companyName: searchRegex }
            ]
        })
            .select('name companyName rating totalJobsPosted totalHires location')
            .limit(5)
            .lean()

        // Also check User collection
        const users = await User.find({
            role: 'employer',
            $or: [
                { name: searchRegex },
                { companyName: searchRegex }
            ]
        })
            .select('name companyName rating location')
            .limit(5)
            .lean()

        const allEmployers = [...employers, ...users]

        return {
            found: allEmployers.length > 0,
            count: allEmployers.length,
            employers: allEmployers.map(e => ({
                name: e.name,
                companyName: e.companyName || '',
                rating: e.rating || 0,
                totalJobsPosted: e.totalJobsPosted || 0,
                totalHires: e.totalHires || 0,
                location: e.location || 'Not specified'
            }))
        }
    } catch (error) {
        console.error('searchEmployer error:', error)
        return { found: false, employers: [], error: error.message }
    }
}

/**
 * Get jobs posted by an employer
 * @param {string} name - Employer name
 * @returns {Object} { employer, jobs: [...] }
 */
const getEmployerJobs = async (name) => {
    try {
        const searchRegex = new RegExp(name.trim(), 'i')

        // Find employer
        let employer = await Employer.findOne({
            $or: [{ name: searchRegex }, { companyName: searchRegex }]
        }).lean()

        if (!employer) {
            employer = await User.findOne({
                role: 'employer',
                $or: [{ name: searchRegex }, { companyName: searchRegex }]
            }).lean()
        }

        if (!employer) {
            return { found: false, message: `No employer found with name "${name}"` }
        }

        // Get their jobs
        const jobs = await Job.find({ employer: employer._id })
            .select('title category location wage status createdAt')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()

        return {
            found: true,
            employer: {
                name: employer.name,
                companyName: employer.companyName || ''
            },
            jobCount: jobs.length,
            jobs: jobs.map(j => ({
                id: j._id,
                title: j.title?.en || j.title,
                category: j.category,
                location: j.location,
                wage: j.wage,
                status: j.status,
                postedOn: j.createdAt
            }))
        }
    } catch (error) {
        console.error('getEmployerJobs error:', error)
        return { found: false, error: error.message }
    }
}

/**
 * Get platform-wide statistics
 * @returns {Object} { totalWorkers, totalJobs, totalEmployers, districts }
 */
const getPlatformStats = async () => {
    try {
        // Count workers
        const workerCount = await Worker.countDocuments()
        const userWorkerCount = await User.countDocuments({ role: 'worker' })
        const totalWorkers = workerCount + userWorkerCount

        // Count jobs
        const totalJobs = await Job.countDocuments()
        const openJobs = await Job.countDocuments({ status: 'open' })

        // Count employers
        const employerCount = await Employer.countDocuments()
        const userEmployerCount = await User.countDocuments({ role: 'employer' })
        const totalEmployers = employerCount + userEmployerCount

        // Get unique districts/locations
        const workerLocations = await Worker.distinct('location')
        const userLocations = await User.distinct('location')
        const allLocations = [...new Set([...workerLocations, ...userLocations])]
            .filter(loc => loc && typeof loc === 'string' && loc.trim().length > 0)

        return {
            totalWorkers,
            totalJobs,
            openJobs,
            totalEmployers,
            districts: allLocations.length,
            locationList: allLocations.slice(0, 10) // Sample of locations
        }
    } catch (error) {
        console.error('getPlatformStats error:', error)
        return { error: error.message }
    }
}

/**
 * Get available open jobs
 * @param {string} location - Location filter (optional)
 * @returns {Object} { count, jobs: [...] }
 */
const getTodayJobs = async (location = null) => {
    try {
        const matchStage = {
            status: 'open'
        }

        if (location) {
            matchStage.location = { $regex: new RegExp(location, 'i') }
        }

        const jobs = await Job.find(matchStage)
            .select('title category location wage urgent startDate')
            .sort({ createdAt: -1 })
            .limit(20) // Increased limit to give better count estimate or usable list
            .lean()

        // Get total count for accuracy
        const totalCount = await Job.countDocuments(matchStage);

        return {
            count: totalCount, // Return total count (e.g. 100)
            displayed: jobs.length,
            location: location || 'all locations',
            jobs: jobs.map(j => ({
                id: j._id,
                title: j.title?.en || j.title,
                category: j.category,
                location: j.location,
                wage: j.wage,
                urgent: j.urgent,
                postedAt: j.createdAt
            }))
        }
    } catch (error) {
        console.error('getTodayJobs error:', error)
        return { count: 0, jobs: [], error: error.message }
    }
}

module.exports = {
    getWorkerCount,
    searchWorker,
    getWorkerProfile,
    getJobCount,
    searchJobs,
    searchEmployer,
    getEmployerJobs,
    getPlatformStats,
    getTodayJobs
}
