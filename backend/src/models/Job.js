const mongoose = require('mongoose')

/**
 * Job Model - Job Postings
 * 
 * ⭐ PRODUCTION-GRADE ARCHITECTURE
 * 
 * Features:
 *   - Bilingual support (en/ta)
 *   - GeoJSON for proximity search
 *   - Soft delete pattern
 *   - Status enum controlled
 *   - Proper indexing
 */

const jobSchema = new mongoose.Schema({
    title: {
        en: { type: String, required: true },
        ta: { type: String, default: '' }
    },
    description: {
        en: { type: String, required: true },
        ta: { type: String, default: '' }
    },
    category: {
        type: String,
        required: true
        // Indexed via compound: { category: 1, status: 1 }
    },
    role: {
        type: String, // standardized role ID (e.g. 'electrician')
        required: false
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        // Indexed via compound: { employer: 1, status: 1 }
    },
    location: {
        type: String,
        required: true
    },
    // GeoJSON for proximity search
    geoLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    wage: {
        type: Number,
        required: true
    },
    wageType: {
        type: String,
        enum: ['daily', 'hourly', 'fixed', 'weekly', 'monthly'],
        default: 'daily'
    },
    duration: {
        type: String,
        default: '1 day'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    requiredWorkers: {
        type: Number,
        default: 1
    },
    skills: [{
        en: String,
        ta: String
    }],
    status: {
        type: String,
        enum: ['open', 'in-progress', 'completed', 'cancelled'],
        default: 'open'
        // Indexed via compound: { status: 1, createdAt: -1 }
    },
    urgent: {
        type: Boolean,
        default: false
        // Low cardinality - no index needed
    },
    applicants: [{
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    hiredWorkers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },

    // ==========================================
    // Soft Delete
    // ==========================================
    isDeleted: {
        type: Boolean,
        default: false
        // Indexed via compound: { isDeleted: 1, status: 1, createdAt: -1 }
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
})

// ==========================================
// INDEXES
// ==========================================
jobSchema.index({ 'title.en': 'text', 'description.en': 'text', location: 'text' })
jobSchema.index({ status: 1, createdAt: -1 })
jobSchema.index({ employer: 1, status: 1 })
jobSchema.index({ category: 1, status: 1 })
jobSchema.index({ geoLocation: '2dsphere' })
jobSchema.index({ isDeleted: 1, status: 1, createdAt: -1 })

// ==========================================
// SOFT DELETE MIDDLEWARE
// ==========================================
jobSchema.pre(/^find/, function (next) {
    if (this.getOptions().includeDeleted) {
        return next()
    }
    this.where({ isDeleted: { $ne: true } })
    next()
})

// ==========================================
// INSTANCE METHODS
// ==========================================
jobSchema.methods.softDelete = async function () {
    this.isDeleted = true
    this.deletedAt = new Date()
    this.status = 'cancelled'
    await this.save()
    return this
}

jobSchema.methods.restore = async function () {
    this.isDeleted = false
    this.deletedAt = undefined
    await this.save()
    return this
}

// ==========================================
// STATIC METHODS
// ==========================================
jobSchema.statics.findWithDeleted = function (query) {
    return this.find(query).setOptions({ includeDeleted: true })
}

module.exports = mongoose.model('Job', jobSchema)
