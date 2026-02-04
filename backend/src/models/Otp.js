const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

/**
 * Enhanced OTP Model
 * Industry-standard OTP storage with hashing and rate limiting
 */
const otpSchema = new mongoose.Schema({
    // Identifier (phone or email)
    identifier: {
        type: String,
        required: true,
        index: true
    },
    identifierType: {
        type: String,
        enum: ['phone', 'email'],
        required: true
    },
    // OTP stored as bcrypt hash (NEVER plain text)
    otpHash: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['signup', 'login', 'reset', 'verify'],
        default: 'signup'
    },
    // Expiry - 5 minutes
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL auto-delete
    },
    // Security tracking
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Max 3 wrong attempts
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    // Rate limiting
    lastSentAt: {
        type: Date,
        default: Date.now
    },
    sendCount: {
        type: Number,
        default: 1
    },
    // Device info
    ip: String,
    userAgent: String
}, {
    timestamps: true
})

// Compound index for lookups
otpSchema.index({ identifier: 1, purpose: 1, isVerified: 1 })

/**
 * Hash OTP before saving
 * @param {string} otp - Plain 6-digit OTP
 * @returns {Promise<string>} Hashed OTP
 */
otpSchema.statics.hashOTP = async function (otp) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(otp, salt)
}

/**
 * Verify OTP against hash
 * @param {string} plainOTP - User entered OTP
 * @returns {Promise<boolean>} Is valid
 */
otpSchema.methods.verifyOTP = async function (plainOTP) {
    return bcrypt.compare(plainOTP, this.otpHash)
}

/**
 * Increment failed attempts
 * @returns {Promise<boolean>} Is blocked (>= 3 attempts)
 */
otpSchema.methods.incrementAttempts = async function () {
    this.attempts += 1
    if (this.attempts >= 3) {
        this.isBlocked = true
    }
    await this.save()
    return this.isBlocked
}

/**
 * Check if can resend (30 second cooldown)
 * @returns {boolean} Can resend
 */
otpSchema.methods.canResend = function () {
    const cooldownMs = 30 * 1000 // 30 seconds
    const timeSinceLastSent = Date.now() - this.lastSentAt.getTime()
    return timeSinceLastSent >= cooldownMs
}

/**
 * Get remaining cooldown seconds
 * @returns {number} Seconds remaining
 */
otpSchema.methods.getCooldownRemaining = function () {
    const cooldownMs = 30 * 1000
    const timeSinceLastSent = Date.now() - this.lastSentAt.getTime()
    const remaining = Math.ceil((cooldownMs - timeSinceLastSent) / 1000)
    return Math.max(0, remaining)
}

/**
 * Update for resend
 */
otpSchema.methods.updateForResend = async function (newOtpHash) {
    this.otpHash = newOtpHash
    this.lastSentAt = new Date()
    this.sendCount += 1
    this.attempts = 0
    this.isBlocked = false
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    await this.save()
}

/**
 * Mark as verified
 */
otpSchema.methods.markVerified = async function () {
    this.isVerified = true
    await this.save()
}

/**
 * Check if OTP is still valid
 */
otpSchema.methods.isValid = function () {
    return !this.isVerified &&
        !this.isBlocked &&
        this.expiresAt > new Date()
}

module.exports = mongoose.model('Otp', otpSchema)
