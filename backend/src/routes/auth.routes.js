/**
 * Auth Routes - World-Class API Structure
 * 
 * Email Flow:
 * POST /auth/email/start     - Check if email exists
 * POST /auth/email/register  - Register with email/password
 * POST /auth/login           - Login with email/password
 * 
 * Phone Flow:
 * POST /auth/phone/send-otp   - Send OTP
 * POST /auth/phone/verify-otp - Verify OTP and authenticate
 * POST /auth/phone/resend-otp - Resend OTP
 * 
 * OAuth:
 * POST /auth/google          - Google OAuth
 * 
 * Token Management:
 * POST /auth/refresh-token   - Refresh access token
 * POST /auth/logout          - Logout (revoke refresh token)
 * POST /auth/logout-all      - Logout all devices
 * GET  /auth/sessions        - Get active sessions
 * DELETE /auth/sessions/:id  - Revoke specific session
 * 
 * User:
 * GET  /auth/me              - Get current user
 * PUT  /auth/profile         - Update profile
 */

const express = require('express')
const { body } = require('express-validator')
const {
    emailStart,
    emailRegister,
    login,
    getMe,
    updateProfile,
    googleAuth,
    register // Legacy alias
} = require('../controllers/auth.controller')
const {
    sendOtp,
    verifyOtp,
    resendOtp
} = require('../controllers/otp.controller')
const {
    refreshToken,
    logout,
    logoutAll,
    getSessions,
    revokeSession
} = require('../controllers/token.controller')
const { protect } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { otpRateLimiter, loginRateLimiter } = require('../middleware/rateLimit')

const router = express.Router()

// ===========================================
// VALIDATION RULES
// ===========================================

const emailStartValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
]

const emailRegisterValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    body('role')
        .isIn(['worker', 'employer'])
        .withMessage('Role must be worker or employer')
]

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
]

const sendOtpValidation = [
    body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^(\+91|91)?[6-9]\d{9}$/)
        .withMessage('Please provide a valid Indian phone number')
]

const verifyOtpValidation = [
    body('phone')
        .notEmpty()
        .withMessage('Phone number is required'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('OTP must be 6 digits')
]

const refreshTokenValidation = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
]

// ===========================================
// EMAIL AUTH ROUTES
// ===========================================

// Step 1: Check email existence
router.post('/email/start',
    emailStartValidation,
    validate,
    emailStart
)

// Step 2: Register with email/password
router.post('/email/register',
    emailRegisterValidation,
    validate,
    emailRegister
)

// Legacy route - alias for email/register  
router.post('/register',
    emailRegisterValidation,
    validate,
    register
)

// Login with email/password
router.post('/login',
    loginRateLimiter,
    loginValidation,
    validate,
    login
)

// ===========================================
// PHONE AUTH ROUTES (OTP)
// ===========================================

// Send OTP
router.post('/phone/send-otp',
    otpRateLimiter,
    sendOtpValidation,
    validate,
    sendOtp
)

// Verify OTP
router.post('/phone/verify-otp',
    verifyOtpValidation,
    validate,
    verifyOtp
)

// Resend OTP
router.post('/phone/resend-otp',
    otpRateLimiter,
    sendOtpValidation,
    validate,
    resendOtp
)

// Legacy routes - maintain backward compatibility
router.post('/send-otp',
    otpRateLimiter,
    sendOtpValidation,
    validate,
    sendOtp
)

router.post('/verify-otp',
    verifyOtpValidation,
    validate,
    verifyOtp
)

router.post('/resend-otp',
    otpRateLimiter,
    sendOtpValidation,
    validate,
    resendOtp
)

// ===========================================
// GOOGLE OAUTH
// ===========================================

router.post('/google', googleAuth)

// ===========================================
// TOKEN MANAGEMENT
// ===========================================

// Refresh access token
router.post('/refresh-token',
    refreshTokenValidation,
    validate,
    refreshToken
)

// Logout (revoke current token)
router.post('/logout', logout)

// Logout all devices
router.post('/logout-all', protect, logoutAll)

// Get active sessions
router.get('/sessions', protect, getSessions)

// Revoke specific session
router.delete('/sessions/:sessionId', protect, revokeSession)

// Role management routes removed in single-role revert

// ===========================================
// USER ROUTES
// ===========================================

// Get current user
router.get('/me', protect, getMe)

// Update profile
router.put('/profile', protect, updateProfile)

module.exports = router
