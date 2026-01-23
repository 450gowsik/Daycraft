const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'viewed', 'shortlisted', 'hired', 'rejected'],
        default: 'applied'
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
    },
    statusUpdatedAt: {
        type: Date
    },
    employerNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
})

// Composite unique index to prevent duplicate applications
applicationSchema.index({ job: 1, worker: 1 }, { unique: true })

// Indexes for efficient queries
applicationSchema.index({ worker: 1, status: 1, appliedAt: -1 })
applicationSchema.index({ employer: 1, status: 1, appliedAt: -1 })
applicationSchema.index({ job: 1, status: 1, appliedAt: -1 })

module.exports = mongoose.model('Application', applicationSchema)
