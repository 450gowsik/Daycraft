const mongoose = require('mongoose')
const crypto = require('crypto')

/**
 * Refresh Token Model
 * Stores refresh tokens for JWT rotation strategy
 * Follows industry best practices (Google, Meta pattern)
 */
const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        required: true,
        enum: ['User', 'Worker', 'Employer']
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    deviceInfo: {
        userAgent: String,
        ip: String,
        deviceName: String
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - auto delete expired tokens
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Index for efficient lookups
refreshTokenSchema.index({ userId: 1, isRevoked: 1 })

/**
 * Hash a refresh token for secure storage
 * @param {string} token - Plain refresh token
 * @returns {string} Hashed token
 */
refreshTokenSchema.statics.hashToken = function (token) {
    return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Find valid token by hash
 * @param {string} tokenHash - Hashed token
 * @returns {Promise<Document>} Token document
 */
refreshTokenSchema.statics.findValidToken = async function (tokenHash) {
    return this.findOne({
        tokenHash,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
    })
}

/**
 * Revoke all tokens for a user (logout all devices)
 * @param {ObjectId} userId - User ID
 */
refreshTokenSchema.statics.revokeAllForUser = async function (userId) {
    return this.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true }
    )
}

/**
 * Revoke a specific token
 */
refreshTokenSchema.methods.revoke = async function () {
    this.isRevoked = true
    await this.save()
}

/**
 * Update last used timestamp
 */
refreshTokenSchema.methods.updateLastUsed = async function () {
    this.lastUsedAt = new Date()
    await this.save()
}

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)
