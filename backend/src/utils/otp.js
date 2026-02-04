/**
 * OTP Utilities
 * Centralized OTP generation and validation
 */
const crypto = require('crypto')

/**
 * Generate a random 6-digit OTP using cryptographically secure random
 * @returns {string} 6-digit OTP string
 */
const generateOTP = () => {
    // crypto.randomInt is cryptographically secure (available in Node.js 14.10+)
    return crypto.randomInt(100000, 999999).toString()
}

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
const validateOTP = (otp) => {
    if (!otp || typeof otp !== 'string') return false
    return /^\d{6}$/.test(otp)
}

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {boolean} True if expired
 */
const isOTPExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt)
}

/**
 * Get OTP expiration time (default 5 minutes from now)
 * @param {number} minutes - Minutes until expiration
 * @returns {Date} Expiration date
 */
const getOTPExpiry = (minutes = 5) => {
    return new Date(Date.now() + minutes * 60 * 1000)
}

module.exports = {
    generateOTP,
    validateOTP,
    isOTPExpired,
    getOTPExpiry
}
