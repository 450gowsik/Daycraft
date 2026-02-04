const mongoose = require('mongoose')

/**
 * Application Model - Job Applications
 * 
 * ⭐ PRODUCTION-GRADE ARCHITECTURE
 * 
 * Features:
 *   - Status enum controlled
 *   - Soft delete pattern
 *   - Proper compound indexes
 *   - Duplicate prevention
 */

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
        // Indexed via compound: { job: 1, worker: 1 } and { job: 1, status: 1, appliedAt: -1 }
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        // Indexed via compound: { worker: 1, status: 1, appliedAt: -1 }
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        // Indexed via compound: { employer: 1, status: 1, appliedAt: -1 }
    },
    status: {
        type: String,
        enum: ['applied', 'viewed', 'shortlisted', 'hired', 'rejected', 'withdrawn'],
        default: 'applied'
        // Indexed via all compound indexes above
    },
    workerLocation: {
        type: String,
        default: ''
    },
    message: {
        type: String,
        default: '',
        maxlength: 500
    },
    appliedAt: {
        type: Date,
        default: Date.now
        // Indexed via compound indexes above
    },
    statusUpdatedAt: {
        type: Date
    },
    employerNotes: {
        type: String,
        default: ''
    },

    // ==========================================
    // Soft Delete
    // ==========================================
    isDeleted: {
        type: Boolean,
        default: false
        // Indexed via compound: { isDeleted: 1, status: 1 }
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
// Composite unique index to prevent duplicate applications
applicationSchema.index({ job: 1, worker: 1 }, { unique: true })

// Efficient query indexes
applicationSchema.index({ worker: 1, status: 1, appliedAt: -1 })
applicationSchema.index({ employer: 1, status: 1, appliedAt: -1 })
applicationSchema.index({ job: 1, status: 1, appliedAt: -1 })
applicationSchema.index({ isDeleted: 1, status: 1 })

// ==========================================
// SOFT DELETE MIDDLEWARE
// ==========================================
applicationSchema.pre(/^find/, function (next) {
    if (this.getOptions().includeDeleted) {
        return next()
    }
    this.where({ isDeleted: { $ne: true } })
    next()
})

// ==========================================
// INSTANCE METHODS
// ==========================================
applicationSchema.methods.softDelete = async function () {
    this.isDeleted = true
    this.deletedAt = new Date()
    await this.save()
    return this
}

applicationSchema.methods.withdraw = async function () {
    this.status = 'withdrawn'
    this.statusUpdatedAt = new Date()
    await this.save()
    return this
}

// ==========================================
// STATIC METHODS
// ==========================================
applicationSchema.statics.findWithDeleted = function (query) {
    return this.find(query).setOptions({ includeDeleted: true })
}

module.exports = mongoose.model('Application', applicationSchema)
