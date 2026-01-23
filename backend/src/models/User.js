const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { generateToken } = require('../utils/jwt')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        sparse: true, // Allow null for phone-only users
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        sparse: true,
        unique: true
    },
    password: {
        type: String,
        minlength: 6,
        select: false
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    // Track which auth method was used for signup
    authProvider: {
        type: String,
        enum: ['email', 'google', 'phone'],
        default: 'email'
    },

    role: {
        type: String,
        enum: ['worker', 'employer', 'admin'],
        default: 'worker'
    },
    avatar: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Verification status
    phoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    // Financials
    walletBalance: {
        type: Number,
        default: 0
    },
    // Geo-location for nearby job matching
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
    // Worker-specific fields
    skills: [{
        en: String,
        ta: String
    }],
    experience: {
        type: String,
        default: ''
    },
    location: {
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
    preferredLanguage: {
        type: String,
        enum: ['en', 'ta'],
        default: 'en'
    },
    // Employer-specific fields
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
    // Progressive verification status
    profileCompleted: {
        type: Boolean,
        default: false
    },
    locationVerified: {
        type: Boolean,
        default: false
    },
    photoVerified: {
        type: Boolean,
        default: false
    },
    idVerified: {
        type: Boolean,
        default: false
    },
    governmentId: {
        idType: {
            type: String,
            enum: ['aadhaar', 'pan', 'voterId', 'drivingLicense', ''],
            default: ''
        },
        lastFourDigits: String,
        verified: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
})

// Geo-spatial index for nearby queries
userSchema.index({ geoLocation: '2dsphere' })

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

// Generate JWT token
userSchema.methods.generateToken = function () {
    return generateToken({ id: this._id, role: this.role })
}

module.exports = mongoose.model('User', userSchema)
