const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { generateToken } = require('../utils/jwt')

const employerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        sparse: true,
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
    authProvider: {
        type: String,
        enum: ['email', 'google', 'phone'],
        default: 'email'
    },
    role: {
        type: String,
        default: 'employer',
        immutable: true  // Role cannot be changed
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
    // Geo-location
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
    location: {
        type: String,
        default: ''
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
    // Number of jobs posted
    totalJobsPosted: {
        type: Number,
        default: 0
    },
    // Number of workers hired
    totalHires: {
        type: Number,
        default: 0
    },
    // Rating given by workers
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    preferredLanguage: {
        type: String,
        enum: ['en', 'ta'],
        default: 'en'
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
            enum: ['aadhaar', 'pan', 'voterId', 'drivingLicense', 'gst', ''],
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

// Geo-spatial index
employerSchema.index({ geoLocation: '2dsphere' })

// Hash password before saving
employerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

// Compare password method
employerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

// Generate JWT token
employerSchema.methods.generateToken = function () {
    return generateToken({ id: this._id, role: this.role })
}

module.exports = mongoose.model('Employer', employerSchema)
