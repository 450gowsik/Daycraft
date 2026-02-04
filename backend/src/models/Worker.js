const mongoose = require('mongoose')

/**
 * Worker Profile Model
 * 
 * Stores worker-specific profile data. Authentication is handled
 * by the User model - this links via userId reference.
 * 
 * One User can have one Worker profile (if they have 'worker' role)
 */

const workerSchema = new mongoose.Schema({
    // ==========================================
    // Link to User (Authentication)
    // ==========================================
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    // ==========================================
    // Worker-Specific Profile
    // ==========================================
    skills: [{
        en: String,
        ta: String
    }],
    experience: {
        type: String,
        default: ''
    },
    availability: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available'
    },
    dailyRate: {
        type: Number,
        default: 0
    },
    bio: {
        type: String,
        default: ''
    },

    // ==========================================
    // Performance Metrics
    // ==========================================
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    completedJobs: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },

    // ==========================================
    // Work Location (can differ from home location)
    // ==========================================
    workLocation: {
        type: String,
        default: ''
    },
    workRadius: {
        type: Number, // km radius willing to travel
        default: 10
    },
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

    // ==========================================
    // Work Verification
    // ==========================================
    profileCompleted: {
        type: Boolean,
        default: false
    },
    skillsVerified: {
        type: Boolean,
        default: false
    },
    backgroundChecked: {
        type: Boolean,
        default: false
    },

    // ==========================================
    // Work Preferences
    // ==========================================
    preferredJobTypes: [{
        type: String
    }],
    minDailyRate: {
        type: Number,
        default: 0
    },
    availableDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
}, {
    timestamps: true
})

// Geo-spatial index for nearby worker searches
workerSchema.index({ geoLocation: '2dsphere' })

// Virtual to populate user details
workerSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
})

// Enable virtuals in JSON
workerSchema.set('toJSON', { virtuals: true })
workerSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Worker', workerSchema)
