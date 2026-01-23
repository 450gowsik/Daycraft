const mongoose = require('mongoose')

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
    },
    role: {
        type: String, // standardized role ID (e.g. 'electrician')
        required: false
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    // Geo-location for proximity search
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
        enum: ['daily', 'hourly', 'fixed'],
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
    },
    urgent: {
        type: Boolean,
        default: false
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
    }
}, {
    timestamps: true
})

// Index for search
jobSchema.index({ 'title.en': 'text', 'description.en': 'text', location: 'text' })
jobSchema.index({ status: 1, createdAt: -1 })
jobSchema.index({ employer: 1 })
jobSchema.index({ category: 1 })
jobSchema.index({ geoLocation: '2dsphere' }) // Geo-spatial index for nearby queries

module.exports = mongoose.model('Job', jobSchema)
