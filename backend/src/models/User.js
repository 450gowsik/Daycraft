const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { generateToken } = require('../utils/jwt')

/**
 * User Model - Authentication & Identity Only
 * 
 * ⭐ PRODUCTION-GRADE ARCHITECTURE
 * 
 * This is the SINGLE source of truth for authentication.
 * Business data is stored in separate profile collections:
 *   - workers (for worker-specific data)
 *   - employers (for employer-specific data)
 * 
 * Features:
 *   - Multi-role support (one user can be both worker AND employer)
 *   - Soft delete pattern
 *   - Proper indexing for scale
 */

const userSchema = new mongoose.Schema({
    // ==========================================
    // Identity (Minimal)
    // ==========================================
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    avatar: {
        type: String,
        default: ''
    },

    // ==========================================
    // Authentication Credentials
    // ==========================================
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    passwordHash: {
        type: String,
        select: false  // Never returned by default
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'phone'],
        default: 'local'
    },

    // ==========================================
    // Multi-Role Support
    // ==========================================
    roles: [{
        type: String,
        enum: ['worker', 'employer', 'admin']
    }],
    activeRole: {
        type: String,
        enum: ['worker', 'employer', 'admin'],
        default: 'worker'
    },
    // Legacy single role field (for backward compatibility)
    role: {
        type: String,
        enum: ['worker', 'employer', 'admin'],
        default: 'worker'
    },
    profileCompleted: {
        type: Boolean,
        default: false
    },

    // ==========================================
    // Verification Status
    // ==========================================
    phoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },

    // ==========================================
    // Account Status & Soft Delete
    // ==========================================
    isActive: {
        type: Boolean,
        default: true
        // Indexed via compound: { isDeleted: 1, isActive: 1 }
    },
    isDeleted: {
        type: Boolean,
        default: false
        // Indexed via compound: { isDeleted: 1, isActive: 1 }
    },
    deletedAt: {
        type: Date
    },

    // ==========================================
    // Location (Basic - for quick access)
    // Detailed location in Worker/Employer profiles
    // ==========================================
    location: {
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
    // Wallet (Can be moved to separate Payment service later)
    // ==========================================
    walletBalance: {
        type: Number,
        default: 0
    },

    // ==========================================
    // Verification Badges
    // ==========================================
    idVerified: {
        type: Boolean,
        default: false
    },
    photoVerified: {
        type: Boolean,
        default: false
    },
    preferredLanguage: {
        type: String,
        enum: ['en', 'ta'],
        default: 'en'
    }
}, {
    timestamps: true
})

// ==========================================
// INDEXES
// ==========================================
// Note: email and phone already indexed via unique:true in schema
userSchema.index({ roles: 1 })
userSchema.index({ activeRole: 1 })
userSchema.index({ geoLocation: '2dsphere' })
userSchema.index({ isDeleted: 1, isActive: 1 })

// ==========================================
// SOFT DELETE MIDDLEWARE
// ==========================================
// Auto-exclude deleted documents from all find queries
userSchema.pre(/^find/, function (next) {
    // Skip if explicitly including deleted
    if (this.getOptions().includeDeleted) {
        return next()
    }
    this.where({ isDeleted: { $ne: true } })
    next()
})

// ==========================================
// PRE-SAVE HOOKS
// ==========================================
// Ensure role/roles consistency
userSchema.pre('save', function (next) {
    // Sync legacy role field with roles array
    if (this.roles && this.roles.length > 0) {
        this.role = this.activeRole || this.roles[0]
    } else if (this.role) {
        this.roles = [this.role]
        this.activeRole = this.role
    } else {
        this.role = 'worker'
        this.roles = ['worker']
        this.activeRole = 'worker'
    }
    next()
})

// Hash password before saving (use passwordHash field)
userSchema.pre('save', async function (next) {
    // Check both password and passwordHash for compatibility
    if (this.isModified('passwordHash') && this.passwordHash && !this.passwordHash.startsWith('$2')) {
        const salt = await bcrypt.genSalt(12)
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
    }
    // Legacy password field support
    if (this.password && this.isModified('password')) {
        const salt = await bcrypt.genSalt(12)
        this.passwordHash = await bcrypt.hash(this.password, salt)
        this.password = undefined  // Don't store plain password
    }
    next()
})

// ==========================================
// INSTANCE METHODS
// ==========================================

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    const user = await this.constructor.findById(this._id).select('+passwordHash')
    if (!user.passwordHash) return false
    return bcrypt.compare(candidatePassword, user.passwordHash)
}

// Generate JWT token
userSchema.methods.generateToken = function () {
    return generateToken({
        id: this._id,
        role: this.activeRole || this.role,
        roles: this.roles
    })
}

// Switch active role
userSchema.methods.switchRole = async function (newRole) {
    if (!this.roles.includes(newRole)) {
        throw new Error(`User does not have role: ${newRole}`)
    }
    this.activeRole = newRole
    this.role = newRole  // Keep legacy field in sync
    await this.save()
    return this
}

// Add a new role
userSchema.methods.addRole = async function (newRole) {
    if (!this.roles.includes(newRole)) {
        this.roles.push(newRole)
        await this.save()
    }
    return this
}

// Soft delete
userSchema.methods.softDelete = async function () {
    this.isDeleted = true
    this.deletedAt = new Date()
    this.isActive = false
    await this.save()
    return this
}

// Restore soft-deleted user
userSchema.methods.restore = async function () {
    this.isDeleted = false
    this.deletedAt = undefined
    this.isActive = true
    await this.save()
    return this
}

// ==========================================
// STATIC METHODS
// ==========================================

// Find including deleted users (admin only)
userSchema.statics.findWithDeleted = function (query) {
    return this.find(query).setOptions({ includeDeleted: true })
}

// Find by email or phone
userSchema.statics.findByCredential = function (credential) {
    const isEmail = credential.includes('@')
    const query = isEmail ? { email: credential } : { phone: credential }
    return this.findOne(query)
}

module.exports = mongoose.model('User', userSchema)
