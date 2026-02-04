const mongoose = require('mongoose')

/**
 * Employer Profile Model
 * 
 * Stores employer-specific profile data. Authentication is handled
 * by the User model - this links via userId reference.
 * 
 * One User can have one Employer profile (if they have 'employer' role)
 */

const employerSchema = new mongoose.Schema({
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
    // Company/Business Info
    // ==========================================
    companyName: {
        type: String,
        default: ''
    },
    companyDescription: {
        type: String,
        default: ''
    },
    industry: {
        type: String,
        default: ''
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+', ''],
        default: ''
    },
    website: {
        type: String,
        default: ''
    },

    // ==========================================
    // Business Location
    // ==========================================
    businessAddress: {
        type: String,
        default: ''
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
    // Hiring Metrics
    // ==========================================
    totalJobsPosted: {
        type: Number,
        default: 0
    },
    activeJobs: {
        type: Number,
        default: 0
    },
    totalHires: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },

    // ==========================================
    // Reputation
    // ==========================================
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },

    // ==========================================
    // Verification
    // ==========================================
    profileCompleted: {
        type: Boolean,
        default: false
    },
    businessVerified: {
        type: Boolean,
        default: false
    },
    gstNumber: {
        type: String,
        default: ''
    },
    gstVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

// Geo-spatial index
employerSchema.index({ geoLocation: '2dsphere' })

// Virtual to populate user details
employerSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
})

// Enable virtuals in JSON
employerSchema.set('toJSON', { virtuals: true })
employerSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Employer', employerSchema)
