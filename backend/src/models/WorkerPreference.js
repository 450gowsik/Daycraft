const mongoose = require('mongoose')

/**
 * WorkerPreference - Tracks worker behavior for AI-powered recommendations
 * This model learns from:
 * - Jobs applied to (category, wage range, distance)
 * - Jobs viewed but not applied (lower weight)
 * - Jobs completed successfully (highest weight)
 */
const workerPreferenceSchema = new mongoose.Schema({
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Category preferences (learned from behavior)
    categoryWeights: {
        type: Map,
        of: Number,
        default: new Map()
    },

    // Wage preferences
    preferredWageMin: {
        type: Number,
        default: 0
    },
    preferredWageMax: {
        type: Number,
        default: 0
    },
    avgAppliedWage: {
        type: Number,
        default: 0
    },

    // Distance preferences
    maxTravelDistance: {
        type: Number,
        default: 50 // km
    },
    avgAppliedDistance: {
        type: Number,
        default: 10
    },

    // Behavior counters
    stats: {
        totalApplied: { type: Number, default: 0 },
        totalViewed: { type: Number, default: 0 },
        totalCompleted: { type: Number, default: 0 },
        totalHired: { type: Number, default: 0 }
    },

    // Recent activity for recency-weighted recommendations
    recentCategories: [{
        category: String,
        timestamp: { type: Date, default: Date.now }
    }],

    // Time preferences (learned from when they apply)
    preferredPostAge: {
        type: Number, // hours - prefer jobs posted within this time
        default: 72
    },

    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Index for quick lookups
workerPreferenceSchema.index({ worker: 1 })

/**
 * Update preferences when worker applies to a job
 */
workerPreferenceSchema.methods.recordApplication = async function (job, distance = 0) {
    const category = job.category || 'general'

    // Increase category weight (applying = strong signal)
    const currentWeight = this.categoryWeights.get(category) || 0
    this.categoryWeights.set(category, currentWeight + 3)

    // Update wage preferences
    if (job.wage) {
        const totalWages = this.avgAppliedWage * this.stats.totalApplied
        this.stats.totalApplied += 1
        this.avgAppliedWage = (totalWages + job.wage) / this.stats.totalApplied

        // Update min/max
        if (!this.preferredWageMin || job.wage < this.preferredWageMin) {
            this.preferredWageMin = job.wage
        }
        if (!this.preferredWageMax || job.wage > this.preferredWageMax) {
            this.preferredWageMax = job.wage
        }
    }

    // Update distance preferences
    if (distance > 0) {
        const totalDistance = this.avgAppliedDistance * (this.stats.totalApplied - 1)
        this.avgAppliedDistance = (totalDistance + distance) / this.stats.totalApplied

        if (distance > this.maxTravelDistance) {
            this.maxTravelDistance = Math.min(distance * 1.2, 100) // Expand but cap at 100km
        }
    }

    // Record recent category
    this.recentCategories.unshift({ category, timestamp: new Date() })
    this.recentCategories = this.recentCategories.slice(0, 20) // Keep last 20

    this.lastUpdated = new Date()
    await this.save()
}

/**
 * Update preferences when worker views but doesn't apply (weak negative signal)
 */
workerPreferenceSchema.methods.recordView = async function (job) {
    const category = job.category || 'general'

    // Small increase for views (they showed interest)
    const currentWeight = this.categoryWeights.get(category) || 0
    this.categoryWeights.set(category, currentWeight + 0.5)

    this.stats.totalViewed += 1
    this.lastUpdated = new Date()
    await this.save()
}

/**
 * Update preferences when job is completed (strongest positive signal)
 */
workerPreferenceSchema.methods.recordCompletion = async function (job) {
    const category = job.category || 'general'

    // Large boost for completed jobs
    const currentWeight = this.categoryWeights.get(category) || 0
    this.categoryWeights.set(category, currentWeight + 10)

    this.stats.totalCompleted += 1
    this.lastUpdated = new Date()
    await this.save()
}

/**
 * Get personalization multiplier for a job
 */
workerPreferenceSchema.methods.getPersonalizationScore = function (job) {
    let score = 0
    const category = job.category || 'general'

    // Category preference (0-30 points)
    const categoryWeight = this.categoryWeights.get(category) || 0
    const maxCategoryWeight = Math.max(...Array.from(this.categoryWeights.values()), 1)
    score += (categoryWeight / maxCategoryWeight) * 30

    // Wage match (0-15 points)
    if (job.wage && this.avgAppliedWage > 0) {
        const wageRatio = job.wage / this.avgAppliedWage
        if (wageRatio >= 0.8 && wageRatio <= 1.5) {
            score += 15 // Within preferred range
        } else if (wageRatio > 1.5) {
            score += 10 // Higher than usual (still good)
        } else {
            score += 5 // Lower than usual
        }
    } else {
        score += 7.5 // Default when no data
    }

    // Recency boost (0-10 points) - recent categories get boost
    const recentMatch = this.recentCategories.slice(0, 5).some(r => r.category === category)
    if (recentMatch) {
        score += 10
    }

    return Math.round(score)
}

module.exports = mongoose.model('WorkerPreference', workerPreferenceSchema)
