/**
 * JWT Utilities - World-Class Implementation
 * 
 * Features:
 * - Short-lived access tokens (15 minutes)
 * - Long-lived refresh tokens (7 days)
 * - Token rotation on refresh
 * - Secure token generation
 */
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const env = require('../config/env')

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '15m'   // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'   // 7 days

/**
 * Generate Access Token (short-lived)
 * @param {Object} payload - { id, role }
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(
        {
            ...payload,
            type: 'access',
            iat: Math.floor(Date.now() / 1000)
        },
        env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    )
}

/**
 * Generate Refresh Token (long-lived, random)
 * @returns {string} Secure random refresh token
 */
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex')
}

/**
 * Legacy: Generate token with custom expiry
 * @deprecated Use generateAccessToken instead
 */
const generateToken = (payload, expiresIn = env.JWT_EXPIRE) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn })
}

/**
 * Verify Access Token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded payload
 * @throws {Error} If invalid or expired
 */
const verifyToken = (token) => {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (decoded.type && decoded.type !== 'access') {
        throw new Error('Invalid token type')
    }
    return decoded
}

/**
 * Decode token without verification (debugging only)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
    return jwt.decode(token)
}

/**
 * Get token expiry date
 * @param {string} type - 'access' or 'refresh'
 * @returns {Date} Expiry date
 */
const getTokenExpiry = (type = 'access') => {
    if (type === 'refresh') {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
    return new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
}

/**
 * Check if token is about to expire (within 2 minutes)
 * @param {Object} decoded - Decoded token
 * @returns {boolean} Should refresh
 */
const shouldRefresh = (decoded) => {
    if (!decoded.exp) return false
    const expiresIn = decoded.exp * 1000 - Date.now()
    return expiresIn < 2 * 60 * 1000 // Less than 2 minutes
}

/**
 * Hash refresh token for database storage
 * @param {string} token - Plain refresh token
 * @returns {string} SHA-256 hash
 */
const hashRefreshToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateToken, // Legacy support
    verifyToken,
    decodeToken,
    getTokenExpiry,
    shouldRefresh,
    hashRefreshToken,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY
}
