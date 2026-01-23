const express = require('express')
const { body } = require('express-validator')
const { register, login, getMe, updateProfile, googleAuth } = require('../controllers/auth.controller')
const { sendOtp, verifyOtp, resendOtp } = require('../controllers/otp.controller')
const { protect } = require('../middleware/auth')
const validate = require('../middleware/validate')

const router = express.Router()

// Validation rules
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['worker', 'employer']).withMessage('Role must be worker or employer')
]

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
]

const otpValidation = [
    body('phone').notEmpty().withMessage('Phone number is required')
]

const verifyOtpValidation = [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
]

// Email/Password auth routes
router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
// Google auth
router.post('/google', googleAuth)

// OTP auth routes (Phone-based)
router.post('/send-otp', otpValidation, validate, sendOtp)
router.post('/verify-otp', verifyOtpValidation, validate, verifyOtp)
router.post('/resend-otp', otpValidation, validate, resendOtp)

// Protected routes
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)

module.exports = router

