/**
 * OTP Utilities
 * Centralized OTP generation and validation
 */

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP string
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
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
