/**
 * OTP Controller - World-Class Implementation
 * Phone-based authentication with security best practices
 * 
 * Unified with User model for multi-role support.
 * 
 * Features:
 * - OTP stored as bcrypt hash
 * - Rate limiting (3 attempts, 30s resend cooldown)
 * - 5 minute expiry
 * - Device tracking
 */

const Otp = require('../models/Otp')
const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')
const env = require('../config/env')
const refreshTokenService = require('../services/refreshTokenService')
const { sendOTP } = require('../services/smsService')
const { sendWelcomeEmail, sendLoginNotification } = require('../services/emailService')
const crypto = require('crypto')
const {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    getTokenExpiry
} = require('../utils/jwt')

const REFRESH_COOKIE_NAME = 'refreshToken'
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const setRefreshTokenCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SECURE ? 'strict' : 'lax',
        maxAge: REFRESH_COOKIE_MAX_AGE,
        path: '/api/auth'
    })
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Find user by phone (single collection lookup)
 */
const findUserByPhone = async (phone) => {
    const normalizedPhone = normalizePhone(phone)
    return await User.findOne({ phone: normalizedPhone })
}

/**
 * Get user's profile based on role
 */
const getUserProfile = async (user) => {
    if (user.role === 'worker') {
        return await Worker.findOne({ userId: user._id })
    } else if (user.role === 'employer') {
        return await Employer.findOne({ userId: user._id })
    }
    return null
}

/**
 * Normalize phone number
 */
const normalizePhone = (phone) => {
    // Remove all non-numeric characters EXCEPT '+'
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If it starts with 91 and has 12 digits total (like 919876543210), prepend '+'
    if (cleaned.startsWith('91') && cleaned.length === 12 && !cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }

    // If it has 10 digits and no '+' (like 9876543210), prepend '+91'
    if (cleaned.length === 10 && !cleaned.startsWith('+')) {
        cleaned = '+91' + cleaned;
    }

    // Ensure it starts with '+'
    if (!cleaned.startsWith('+')) {
        // Default to + if missing but might be valid E.164 already
        cleaned = '+' + cleaned;
    }

    return cleaned;
}

/**
 * Generate 6-digit OTP - BYPASS MODE
 */
const generateOTPCode = () => {
    if (env.isDevelopment()) return '123456'
    return crypto.randomInt(100000, 999999).toString()
}

/**
 * Create auth tokens and save refresh token
 */
const createAuthTokens = async (user, req, res) => {
    const accessToken = generateAccessToken({
        id: user._id,
        role: user.role
    })
    const refreshToken = generateRefreshToken()

    await refreshTokenService.storeToken(
        user._id.toString(),
        hashRefreshToken(refreshToken),
        {
            userAgent: req.headers['user-agent'] || 'unknown',
            ip: req.ip || req.connection.remoteAddress,
            deviceName: req.body.deviceName || 'Mobile'
        }
    )

    setRefreshTokenCookie(res, refreshToken)

    return { accessToken, refreshToken }
}

/**
 * Build response user object with profile data
 */
const buildUserResponse = async (user) => {
    const userObj = user.toObject ? user.toObject() : { ...user }
    delete userObj.password

    // Get active profile
    const profile = await getUserProfile(user)

    return {
        ...userObj,
        profile: profile ? profile.toObject() : null
    }
}

/**
 * Clean user object for response
 */
const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user }
    delete obj.password
    return obj
}

// ===========================================
// OTP ENDPOINTS
// ===========================================

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/auth/phone/send-otp
 * @access  Public (rate limited)
 */
exports.sendOtp = async (req, res) => {
    try {
        const { phone, name, role, location, geoLocation } = req.body

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            })
        }

        const normalizedPhone = normalizePhone(phone)

        // Check for existing OTP
        let existingOtp = await Otp.findOne({
            identifier: normalizedPhone,
            identifierType: 'phone',
            isVerified: false
        }).sort({ createdAt: -1 })

        // Check resend cooldown
        if (existingOtp && !existingOtp.canResend()) {
            const remainingSeconds = existingOtp.getCooldownRemaining()
            return res.status(429).json({
                success: false,
                message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
                cooldownRemaining: remainingSeconds
            })
        }

        // Check if user exists (single collection lookup)
        const existingUser = await findUserByPhone(normalizedPhone)
        const isNewUser = !existingUser

        // For new users, validate required fields
        if (isNewUser) {
            if (!name || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and role are required for new registration',
                    requiresRegistration: true
                })
            }
            if (!['worker', 'employer'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role'
                })
            }
        }

        // Generate and hash OTP
        const otpCode = generateOTPCode()
        const otpHash = await Otp.hashOTP(otpCode)

        if (existingOtp) {
            // Update existing OTP
            await existingOtp.updateForResend(otpHash)
        } else {
            // Create new OTP record
            await Otp.create({
                identifier: normalizedPhone,
                identifierType: 'phone',
                otpHash,
                purpose: isNewUser ? 'signup' : 'login',
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                ip: req.ip,
                userAgent: req.headers['user-agent']
            })
        }

        // BYPASS: Skip actual SMS sending
        console.log(`[OTP BYPASS] Fixed OTP 123456 generated for ${normalizedPhone}`);

        // Mock successful SMS result
        const smsResult = { success: true, sid: 'bypass_sid', status: 'sent', mock: true };

        res.json({
            success: true,
            message: 'OTP sent successfully (Bypass: Use 123456)',
            phone: normalizedPhone,
            isNewUser,
            expiresIn: 300,
            sid: smsResult.sid,
            status: smsResult.status,
            devOtp: '123456'
        });

    } catch (error) {
        console.error('Send OTP error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.'
        })
    }
}

/**
 * @desc    Verify OTP and authenticate/register
 * @route   POST /api/auth/phone/verify-otp
 * @access  Public
 */
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp, name, role, location, geoLocation } = req.body

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            })
        }

        if (otp.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'OTP must be 6 digits'
            })
        }

        const normalizedPhone = normalizePhone(phone)

        // Find OTP record
        const otpRecord = await Otp.findOne({
            identifier: normalizedPhone,
            identifierType: 'phone',
            isVerified: false,
            isBlocked: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 })

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found. Please request a new one.'
            })
        }

        // Verify OTP hash
        const isValid = await otpRecord.verifyOTP(otp)

        if (!isValid) {
            const isBlocked = await otpRecord.incrementAttempts()

            if (isBlocked) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many incorrect attempts. Please request a new OTP.',
                    remainingAttempts: 0
                })
            }

            return res.status(400).json({
                success: false,
                message: 'Incorrect OTP. Please try again.',
                remainingAttempts: 3 - otpRecord.attempts
            })
        }

        // Mark OTP as verified
        await otpRecord.markVerified()

        // Find or create user (single collection)
        let user = await findUserByPhone(normalizedPhone)
        let isNewUser = false

        if (!user) {
            // New user registration
            if (!name || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and role are required for registration'
                })
            }

            // Create user with role
            user = await User.create({
                name: name.trim(),
                phone: normalizedPhone,
                role: role,
                location: location || '',
                geoLocation: geoLocation || undefined,
                authProvider: 'phone',
                phoneVerified: true,
                isActive: true,
                profileCompleted: true
            })

            // Create role-specific profile
            if (role === 'worker') {
                await Worker.create({ userId: user._id })
            } else if (role === 'employer') {
                await Employer.create({ userId: user._id })
            }

            isNewUser = true
        } else {
            // Update phone verification status
            if (!user.phoneVerified) {
                user.phoneVerified = true
                await user.save()
            }
        }

        // Send email notifications
        if (user.email) {
            try {
                if (isNewUser) {
                    // Account Approval / Welcome Email
                    await sendWelcomeEmail(user.email, user.name || 'User', user.role)
                } else {
                    // Login Notification
                    await sendLoginNotification(user.email, user.name || 'User')
                }
            } catch (err) {
                console.warn('Email notification failed:', err.message)
            }
        }

        // Create auth tokens
        const { accessToken } = await createAuthTokens(user, req, res)

        // Build response with profile
        const userResponse = await buildUserResponse(user)

        res.json({
            success: true,
            message: isNewUser ? 'Registration successful' : 'Login successful',
            accessToken,
            user: userResponse,
            isNewUser
        })
    } catch (error) {
        console.error('Verify OTP error:', error)
        res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        })
    }
}

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/phone/resend-otp
 * @access  Public (rate limited)
 */
exports.resendOtp = async (req, res) => {
    // Just call sendOtp - it handles resend logic
    return exports.sendOtp(req, res)
}
