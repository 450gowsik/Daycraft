/**
 * JWT Utilities
 * Centralized JWT token generation and verification
 */
const jwt = require('jsonwebtoken')
const env = require('../config/env')

/**
 * Generate JWT token for a user
 * @param {Object} payload - Data to encode in token (typically { id, role })
 * @param {string} expiresIn - Token expiration time (default from env)
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = env.JWT_EXPIRE) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn })
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET)
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
    return jwt.decode(token)
}

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
}
