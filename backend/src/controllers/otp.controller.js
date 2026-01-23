/**
 * OTP Controller for Phone Authentication
 * 
 * Routes:
 * POST /api/auth/send-otp - Send OTP to phone number
 * POST /api/auth/verify-otp - Verify OTP and login/register user
 */

const Otp = require('../models/Otp')
const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')
const { sendOTP } = require('../services/smsService')
const { generateOTP, validateOTP, getOTPExpiry } = require('../utils/otp')
const { sendWelcomeEmail } = require('../services/emailService')

// Helper function to get the appropriate model based on role
const getModelByRole = (role) => {
    if (role === 'worker') return Worker
    if (role === 'employer') return Employer
    return User
}

// Helper function to find user by phone across all collections
const findUserByPhone = async (phone) => {
    let user = await Worker.findOne({ phone })
    if (user) return { user, model: Worker }

    user = await Employer.findOne({ phone })
    if (user) return { user, model: Employer }

    user = await User.findOne({ phone })
    if (user) return { user, model: User }

    return { user: null, model: null }
}

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
    try {
        const { phone } = req.body

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            })
        }

        // Clean phone number (remove spaces, dashes)
        const cleanPhone = phone.replace(/[\s-]/g, '')

        // Check if there's an existing unexpired OTP
        const existingOtp = await Otp.findOne({
            phone: cleanPhone,
            expiresAt: { $gt: new Date() },
            verified: false
        })

        if (existingOtp) {
            // Rate limit - don't send new OTP if one was sent recently
            const timeSinceCreated = Date.now() - existingOtp.createdAt.getTime()
            if (timeSinceCreated < 60000) { // 1 minute cooldown
                return res.status(429).json({
                    success: false,
                    message: 'Please wait before requesting another OTP',
                    retryAfter: Math.ceil((60000 - timeSinceCreated) / 1000)
                })
            }
            // Delete old OTP
            await existingOtp.deleteOne()
        }

        // Generate new OTP
        const otp = generateOTP()

        // Store OTP with 5-minute expiry
        await Otp.create({
            phone: cleanPhone,
            otp,
            expiresAt: getOTPExpiry(5)
        })

        // Send OTP via SMS
        const result = await sendOTP(cleanPhone, otp)

        // Check if user exists in any collection
        const { user: existingUser } = await findUserByPhone(cleanPhone)

        res.json({
            success: true,
            message: 'OTP sent successfully',
            isExistingUser: !!existingUser,
            // Include OTP in development mode for testing
            ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
        })

    } catch (error) {
        console.error('Send OTP error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.'
        })
    }
}

// @desc    Verify OTP and login/register user
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp, name, role, email, location } = req.body

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            })
        }

        // Validate OTP format
        if (!validateOTP(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP format'
            })
        }

        const cleanPhone = phone.replace(/[\s-]/g, '')

        // Find the OTP record
        const otpRecord = await Otp.findOne({
            phone: cleanPhone,
            expiresAt: { $gt: new Date() },
            verified: false
        })

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found. Please request a new one.'
            })
        }

        // Check attempts
        if (otpRecord.attempts >= 5) {
            await otpRecord.deleteOne()
            return res.status(400).json({
                success: false,
                message: 'Too many attempts. Please request a new OTP.'
            })
        }

        // Verify OTP (Allow 123456 as default test OTP in development)
        const isTestOtp = process.env.NODE_ENV === 'development' && otp === '123456'
        if (otpRecord.otp !== otp && !isTestOtp) {
            await otpRecord.incrementAttempts()
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
                attemptsRemaining: 5 - otpRecord.attempts - 1
            })
        }

        // Mark OTP as verified
        otpRecord.verified = true
        await otpRecord.save()

        // Check if user exists in any collection
        const { user: existingUser, model: existingModel } = await findUserByPhone(cleanPhone)
        let user = existingUser
        let isNewUser = false

        if (!user) {
            // New user registration
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required for new registration',
                    isNewUser: true
                })
            }

            // Get the appropriate model based on role
            const userRole = role || 'worker'
            const Model = getModelByRole(userRole)
            console.log(`Creating new ${userRole} via OTP in ${Model.modelName} collection`)

            // Create new user in the appropriate collection
            user = await Model.create({
                name,
                phone: cleanPhone,
                email: email || undefined,
                role: userRole,
                location: location || '',
                geoLocation: req.body.geoLocation || undefined,
                // Unified auth flow: phone users have phone auto-verified
                authProvider: 'phone',
                phoneVerified: true,  // Phone is verified via OTP
                emailVerified: false,
                profileCompleted: false  // Must complete profile after signup
            })
            isNewUser = true

            // Send welcome email if email provided
            if (email) {
                await sendWelcomeEmail(email, name, userRole)
            }
        } else {
            // Existing user - update phone verified status
            if (!user.phoneVerified) {
                user.phoneVerified = true
                await user.save()
            }
        }

        // Generate JWT token
        const token = user.generateToken()

        // Delete the used OTP
        await otpRecord.deleteOne()

        res.json({
            success: true,
            message: isNewUser ? 'Registration successful' : 'Login successful',
            isNewUser,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                location: user.location,
                geoLocation: user.geoLocation,
                // Include verification status for frontend decisions
                authProvider: user.authProvider,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                profileCompleted: user.profileCompleted
            }
        })

    } catch (error) {
        console.error('Verify OTP error:', error)
        res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        })
    }
}

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
exports.resendOtp = async (req, res) => {
    // Simply reuse sendOtp logic
    return exports.sendOtp(req, res)
}
