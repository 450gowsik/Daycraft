const Worker = require('../models/Worker')
const Job = require('../models/Job')
const { calculateDistance } = require('../utils/distance') // Assuming this util exists/will be verified

class MatchingService {
    /**
     * Main pipeline to find best workers for a job
     * @param {string} jobId 
     * @returns {Promise<Array>} Ranked list of workers
     */
    async findMatchesForJob(jobId) {
        // 1. Fetch Job Details
        const job = await Job.findById(jobId).populate('employer')
        if (!job) throw new Error('Job not found')

        const MAX_RADIUS_KM = 15
        const MIN_VERIFICATION_SCORE = 0.5

        // Extract job coordinates
        const [jobLng, jobLat] = job.geoLocation.coordinates

        // 2. Database-Level Filtering (Hard Constraints)
        // We use MongoDB aggregation for efficient initial filtering
        const initialCandidates = await Worker.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [jobLng, jobLat] },
                    distanceField: 'distance',
                    maxDistance: MAX_RADIUS_KM * 1000, // meters
                    spherical: true
                }
            },
            {
                $match: {
                    isActive: true,
                    // Basic availability check (can be expanded)
                    availability: 'available',
                    // Role filtering can happen here if job has a specific role requirement
                    // role: job.role 
                }
            }
        ])

        // 3. In-Memory Processing Pipeline
        const rankedCandidates = initialCandidates
            .map(worker => {
                // A. Trust & Verification Gate
                const verificationScore = this.calculateVerificationScore(worker)
                if (verificationScore < MIN_VERIFICATION_SCORE) return null

                // B. Hard Constraint Check (Skills)
                // If job has required skills, worker MUST have at least one matching skill 
                // (or all, depending on strictness. Here we check overlap > 0)
                const skillMatchScore = this.calculateSkillMatch(worker, job)
                if (job.skills && job.skills.length > 0 && skillMatchScore === 0) return null

                // C. Comprehensive Scoring
                const matchScore = this.calculateMatchScore(worker, job, verificationScore, skillMatchScore)

                // D. Fairness Adjustment
                const finalScore = this.applyFairnessAdjustment(matchScore, worker)

                return {
                    worker: worker,
                    scores: {
                        total: parseFloat(finalScore.toFixed(2)),
                        match: parseFloat(matchScore.toFixed(2)),
                        verification: parseFloat(verificationScore.toFixed(2))
                    },
                    distance: parseFloat((worker.distance / 1000).toFixed(2)) // km
                }
            })
            .filter(candidate => candidate !== null) // Remove excluded workers
            .sort((a, b) => b.scores.total - a.scores.total) // Rank highest to lowest

        return rankedCandidates
    }

    /**
     * Step 1: Verification Score (0-1)
     * Filters out fake accounts
     */
    calculateVerificationScore(worker) {
        let score = 0
        if (worker.phoneVerified) score += 0.25
        if (worker.idVerified) score += 0.25
        if (worker.photoVerified) score += 0.25
        if (worker.profileCompleted) score += 0.25
        return score
    }

    /**
     * Step 3: Core Match Score (0-100)
     */
    calculateMatchScore(worker, job, vScore, skillScore) {
        // Weights
        const W_SKILL = 0.30
        const W_DIST = 0.20
        const W_RATING = 0.15
        const W_EXP = 0.15
        const W_RELIABILITY = 0.10
        const W_AVAIL = 0.10 // Simplified as boolean mostly, but can be partial

        // 1. Skill Score (0-100) - Calculated in Step B
        const sSkill = skillScore * 100

        // 2. Distance Score (0-100)
        // Closer is better. 0km = 100, MaxRadius = 0
        const maxDist = 15000 // 15km in meters
        const dist = worker.distance || 0
        const sDist = Math.max(0, 100 * (1 - (dist / maxDist)))

        // 3. Rating Score (0-100)
        // Normalize 0-5 stars to 0-100
        const sRating = (worker.rating / 5) * 100

        // 4. Experience Score (0-100)
        // Simple heuristic: profile description length or completed jobs as proxy if exp field is text
        // Ideally 'experience' field would be a number (years). 
        // For now, let's use a proxy or default to 50 if string.
        let sExp = 50
        if (worker.completedJobs > 10) sExp = 80
        if (worker.completedJobs > 50) sExp = 100

        // 5. Reliability Score (0-100)
        // High profile completion + verification usually implies reliability
        const sReliability = vScore * 100

        // 6. Availability Score (0-100)
        const sAvail = worker.availability === 'available' ? 100 : 0

        // Weighted Sum
        const total = (
            (sSkill * W_SKILL) +
            (sDist * W_DIST) +
            (sRating * W_RATING) +
            (sExp * W_EXP) +
            (sReliability * W_RELIABILITY) +
            (sAvail * W_AVAIL)
        )

        return total
    }

    /**
     * Helper: Calculate Skill Overlap (0-1)
     */
    calculateSkillMatch(worker, job) {
        if (!job.skills || job.skills.length === 0) return 1 // No requirement = perfect match
        if (!worker.skills || worker.skills.length === 0) return 0

        // Extract raw skill strings (assuming structure might be objects with en/ta)
        const jobSkills = job.skills.map(s => s.en ? s.en.toLowerCase() : s.toLowerCase())
        const workerSkills = worker.skills.map(s => s.en ? s.en.toLowerCase() : s.toLowerCase())

        const matches = jobSkills.filter(req =>
            workerSkills.some(wSkill => wSkill.includes(req) || req.includes(wSkill))
        )

        return matches.length / jobSkills.length
    }

    /**
     * Step 4: Fairness Adjustment
     * Penalize slightly if user has too many recent jobs to allow rotation
     */
    applyFairnessAdjustment(matchScore, worker) {
        const ALPHA_PENALTY = 0.5
        // Ideally we'd query "jobs completed in last 7 days". 
        // Using total completedJobs as a weak proxy for now, but scaled down heavily.
        // A better metric would be "active_jobs_count"

        let penalty = 0
        // Heuristic: if very popular (e.g. > 100 jobs), small penalty to give newbies a chance
        if (worker.completedJobs > 100) penalty = 5

        return Math.max(0, matchScore - penalty)
    }
}

module.exports = new MatchingService()
