const { calculateDistance, geoJSONToLatLng } = require('../utils/distance');

/**
 * Calculates a match score between a worker and a job based on skills, location, and quality.
 * Returns a score from 0 to 100.
 * 
 * @param {Object} worker - User object with role 'worker'
 * @param {Object} job - Job object
 * @returns {Object} { total, breakdown: { skill, distance, quality } }
 */
const calculateMatchScore = (worker, job) => {
    // 1. Skill Score (Max 50 points)
    let skillScore = 0;

    // Convert to lowercase for comparison
    const workerSkills = (worker.skills || []).map(s => (s.en || '').toLowerCase());
    const jobSkills = (job.skills || []).map(s => (s.en || '').toLowerCase());

    if (jobSkills.length > 0) {
        const matchedSkills = jobSkills.filter(skill => workerSkills.includes(skill));
        const matchRatio = matchedSkills.length / jobSkills.length;
        skillScore = matchRatio * 50;

        // If no skills match, we check if the job category appears in worker's skills/bio
        if (matchedSkills.length === 0) {
            const categoryMatch = workerSkills.some(s => s.includes(job.category.toLowerCase()));
            if (categoryMatch) skillScore = 25; // Partial credit for category match
        }
    } else {
        // Fallback to category if job has no specific skills
        const categoryMatch = workerSkills.some(s => s.includes(job.category.toLowerCase()));
        skillScore = categoryMatch ? 40 : 10;
    }

    // Role Boost: If job role matches worker experience/title
    if (job.role && worker.experience && worker.experience.toLowerCase().includes(job.role.toLowerCase())) {
        skillScore = Math.min(50, skillScore + 10);
    }

    // Required Filter: If skillScore is very low, this isn't a good match
    // (Optimization: can return early if needed)

    // 2. Distance Score (Max 30 points)
    // Formula: 30 - distanceKm, clamped at 0
    let distanceScore = 0;
    if (worker.geoLocation?.coordinates && job.geoLocation?.coordinates) {
        const workerCoords = geoJSONToLatLng(worker.geoLocation.coordinates);
        const jobCoords = geoJSONToLatLng(job.geoLocation.coordinates);

        if (workerCoords && jobCoords) {
            const distanceKm = calculateDistance(
                workerCoords.lat, workerCoords.lng,
                jobCoords.lat, jobCoords.lng
            );
            distanceScore = Math.max(0, 30 - distanceKm);
        }
    }

    // 3. Quality Score (Max 20 points)
    let qualityScore = 0;
    if (worker.completedJobs === 0) {
        qualityScore = 10; // Medium score for new workers to give them a chance
    } else {
        // rating is 0-5, convert to 0-20
        qualityScore = (worker.rating || 0) * 4;
    }

    const total = Math.min(100, Math.round(skillScore + distanceScore + qualityScore));

    return {
        total,
        breakdown: {
            skill: Math.round(skillScore),
            distance: Math.round(distanceScore),
            quality: Math.round(qualityScore)
        }
    };
};

/**
 * Filter and sort workers based on their match score for a specific job
 */
const getTopMatchingWorkers = (workers, job, limit = 10) => {
    return workers
        .map(worker => ({
            worker,
            match: calculateMatchScore(worker, job)
        }))
        .filter(item => item.match.total > 20) // Minimum threshold
        .sort((a, b) => b.match.total - a.match.total)
        .slice(0, limit);
};

/**
 * Filter and sort jobs based on their match score for a specific worker
 */
const getRecommendedJobs = (jobs, worker, limit = 10) => {
    return jobs
        .map(job => ({
            job,
            match: calculateMatchScore(worker, job)
        }))
        .filter(item => item.match.total > 20) // Minimum threshold
        .sort((a, b) => b.match.total - a.match.total)
        .slice(0, limit);
};

/**
 * Get AI-powered personalized recommendations
 * Combines base matching score with learned preferences
 * 
 * @param {Array} jobs - Available jobs
 * @param {Object} worker - Worker user object
 * @param {Object} preferences - WorkerPreference document (can be null for new users)
 * @param {number} limit - Max jobs to return
 * @returns {Array} Sorted jobs with combined scores
 */
const getPersonalizedRecommendations = (jobs, worker, preferences = null, limit = 6) => {
    return jobs
        .map(job => {
            // Base matching score (0-100)
            const baseMatch = calculateMatchScore(worker, job);

            // Personalization boost (0-55 points) - only if we have preferences
            let personalizationScore = 0;
            if (preferences && preferences.getPersonalizationScore) {
                personalizationScore = preferences.getPersonalizationScore(job);
            }

            // Combined score: 60% base matching + 40% personalization
            // This ensures recommendations stay relevant while learning from behavior
            const combinedScore = Math.round(
                (baseMatch.total * 0.6) + (personalizationScore * 0.4 * (100 / 55))
            );

            // Determine match quality label
            let matchLabel = 'Good Match';
            if (combinedScore >= 85) matchLabel = 'Excellent Match';
            else if (combinedScore >= 70) matchLabel = 'Great Match';
            else if (combinedScore < 50) matchLabel = 'Fair Match';

            return {
                ...job,
                matchScore: combinedScore,
                baseScore: baseMatch.total,
                personalizationScore,
                matchBreakdown: {
                    ...baseMatch.breakdown,
                    personalization: personalizationScore
                },
                matchLabel,
                isPersonalized: personalizationScore > 10
            };
        })
        .filter(job => job.matchScore >= 40) // Minimum threshold for recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
};

module.exports = {
    calculateMatchScore,
    getTopMatchingWorkers,
    getRecommendedJobs,
    getPersonalizedRecommendations
};
