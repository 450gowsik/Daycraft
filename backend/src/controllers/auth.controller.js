/**
 * World-Class Auth Controller
 * 
 * Unified authentication system with multi-role support.
 * All auth happens through the User model - profiles are created
 * in Worker/Employer collections as needed.
 * 
 * Email Flow:
 * 1. POST /auth/email/start - Validate email, return if exists
 * 2. POST /auth/email/register - Register with password
 * 3. POST /auth/login - Login with email/password
 * 
 * Common:
 * - GET /auth/me - Get current user with profile
 * - PUT /auth/profile - Update profile
 * - POST /auth/google - Google OAuth
 * - POST /auth/switch-role - Switch active role
 * - POST /auth/add-role - Add new role to account
 */

const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')
const RefreshToken = require('../models/RefreshToken')
const axios = require('axios')
const { sendWelcomeEmail } = require('../services/emailService')
const {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    getTokenExpiry
} = require('../utils/jwt')

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Find user by email (single collection lookup)
 */
const findUserByEmail = async (email) => {
    const emailLower = email.toLowerCase()
    return await User.findOne({ email: emailLower })
}

/**
 * Find user by phone (single collection lookup)
 */
const findUserByPhone = async (phone) => {
    return await User.findOne({ phone })
}

/**
 * Create or get worker profile for a user
 */
const getOrCreateWorkerProfile = async (userId) => {
    let worker = await Worker.findOne({ userId })
    if (!worker) {
        worker = await Worker.create({ userId })
    }
    return worker
}

/**
 * Create or get employer profile for a user
 */
const getOrCreateEmployerProfile = async (userId) => {
    let employer = await Employer.findOne({ userId })
    if (!employer) {
        employer = await Employer.create({ userId })
    }
    return employer
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
 * Create tokens and save refresh token to DB
 */
const createAuthTokens = async (user, req) => {
    // Generate tokens with single role
    const accessToken = generateAccessToken({
        id: user._id,
        role: user.role
    })
    const refreshToken = generateRefreshToken()

    // Save refresh token to DB (hashed)
    await RefreshToken.create({
        userId: user._id,
        userModel: 'User',
        tokenHash: hashRefreshToken(refreshToken),
        deviceInfo: {
            userAgent: req.headers['user-agent'] || 'unknown',
            ip: req.ip || req.connection.remoteAddress,
            deviceName: req.body.deviceName || 'Web Browser'
        },
        expiresAt: getTokenExpiry('refresh')
    })

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
 * Clean user object for response (simple version)
 */
const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user }
    delete obj.password
    return obj
}

// ===========================================
// EMAIL AUTH ENDPOINTS
// ===========================================

/**
 * @desc    Step 1: Check if email exists
 * @route   POST /api/auth/email/start
 * @access  Public
 */
exports.emailStart = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            })
        }

        const emailLower = email.toLowerCase().trim()
        const existingUser = await findUserByEmail(emailLower)

        res.json({
            success: true,
            exists: !!existingUser,
            message: existingUser
                ? 'Account found. Please enter your password.'
                : 'Email available. Please complete registration.'
        })
    } catch (error) {
        console.error('Email start error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        })
    }
}

/**
 * @desc    Step 2: Register new user with password
 * @route   POST /api/auth/email/register
 * @access  Public
 */
exports.emailRegister = async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            role,
            location,
            geoLocation,
            phone
        } = req.body

        // Validation
        if (!email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            })
        }

        if (!['worker', 'employer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be worker or employer.'
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            })
        }

        const emailLower = email.toLowerCase().trim()

        // Check if user already exists
        const existingUser = await findUserByEmail(emailLower)
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            })
        }

        // Hash password
        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user with role
        const user = await User.create({
            name: name.trim(),
            email: emailLower,
            phone: phone || undefined,
            password: hashedPassword,
            role: role,
            location: location || '',
            geoLocation: geoLocation || undefined,
            authProvider: 'email',
            emailVerified: false,
            isActive: true
        })

        // Create role-specific profile
        if (role === 'worker') {
            await Worker.create({ userId: user._id })
        } else if (role === 'employer') {
            await Employer.create({ userId: user._id })
        }

        // Create auth tokens
        const { accessToken, refreshToken } = await createAuthTokens(user, req)

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name)
        } catch (emailErr) {
            console.warn('Welcome email failed:', emailErr.message)
        }

        // Build response with profile
        const userResponse = await buildUserResponse(user)

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            accessToken,
            refreshToken,
            user: userResponse
        })
    } catch (error) {
        console.error('Email register error:', error)

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            })
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        })
    }
}

/**
 * @desc    Login with email/password
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            })
        }

        const emailLower = email.toLowerCase().trim()

        // Find user with password (single collection lookup)
        const user = await User.findOne({ email: emailLower }).select('+password')

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been suspended'
            })
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // Create auth tokens
        const { accessToken, refreshToken } = await createAuthTokens(user, req)

        // Build response with profile
        const userResponse = await buildUserResponse(user)

        res.json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: userResponse
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        })
    }
}

/**
 * @desc    Get current user with profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = req.user

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        // Build response with profile
        const userResponse = await buildUserResponse(user)

        res.json({
            success: true,
            user: userResponse
        })
    } catch (error) {
        console.error('GetMe error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        })
    }
}

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id
        const { role } = req.user

        // User-level fields
        const userFields = ['name', 'phone', 'location', 'geoLocation', 'avatar', 'preferredLanguage', 'profileCompleted']

        // Worker-specific fields
        const workerFields = ['skills', 'experience', 'availability', 'dailyRate', 'bio',
            'workLocation', 'workRadius', 'preferredJobTypes', 'availableDays']

        // Employer-specific fields
        const employerFields = ['companyName', 'companyDescription', 'industry',
            'companySize', 'website', 'businessAddress']

        // Update user fields
        const userUpdates = {}
        for (const field of userFields) {
            if (req.body[field] !== undefined) {
                userUpdates[field] = req.body[field]
            }
        }

        if (Object.keys(userUpdates).length > 0) {
            await User.findByIdAndUpdate(userId, { $set: userUpdates })
        }

        // Update role-specific profile
        if (role === 'worker') {
            const profileUpdates = {}
            for (const field of workerFields) {
                if (req.body[field] !== undefined) {
                    profileUpdates[field] = req.body[field]
                }
            }
            if (Object.keys(profileUpdates).length > 0) {
                await Worker.findOneAndUpdate(
                    { userId },
                    { $set: profileUpdates },
                    { upsert: true }
                )
            }
        } else if (role === 'employer') {
            const profileUpdates = {}
            for (const field of employerFields) {
                if (req.body[field] !== undefined) {
                    profileUpdates[field] = req.body[field]
                }
            }
            if (Object.keys(profileUpdates).length > 0) {
                await Employer.findOneAndUpdate(
                    { userId },
                    { $set: profileUpdates },
                    { upsert: true }
                )
            }
        }

        // Get updated user
        const updatedUser = await User.findById(userId)
        const userResponse = await buildUserResponse(updatedUser)

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userResponse
        })
    } catch (error) {
        console.error('UpdateProfile error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        })
    }
}

// Role switching removed at user request to revert to old DB structure

/**
 * @desc    Google OAuth login/register (Industry Standard)
 * @route   POST /api/auth/google
 * @access  Public
 * 
 * Flow:
 * 1. Frontend gets Google ID token
 * 2. Backend verifies token with Google
 * 3. Extract user info (email, name, googleId)
 * 4. If user exists → login (link Google if needed)
 * 5. If new → create user with selected role
 * 6. Create role-specific profile
 * 7. Issue JWT tokens
 */
exports.googleAuth = async (req, res) => {
    try {
        const { token, role, location, geoLocation } = req.body

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Google ID token is required'
            })
        }

        // ===================================
        // STEP 1: Verify Google Token
        // Supports both ID Token and Access Token
        // ===================================
        const { OAuth2Client } = require('google-auth-library')
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

        let email, name, picture, googleId, emailVerified

        // Try ID Token verification first (industry standard)
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            })
            const payload = ticket.getPayload()
            email = payload.email
            name = payload.name
            picture = payload.picture
            googleId = payload.sub
            emailVerified = payload.email_verified
        } catch (idTokenError) {
            // Fallback: Try as Access Token (useGoogleLogin flow)
            try {
                const googleResponse = await axios.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                email = googleResponse.data.email
                name = googleResponse.data.name
                picture = googleResponse.data.picture
                googleId = googleResponse.data.sub
                emailVerified = googleResponse.data.email_verified
            } catch (accessTokenError) {
                console.error('Google token verification failed:', {
                    idTokenError: idTokenError.message,
                    accessTokenError: accessTokenError.message
                })
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Google token'
                })
            }
        }

        // ===================================
        // STEP 2: Validate Extracted Info
        // ===================================
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Could not get email from Google'
            })
        }

        const emailLower = email.toLowerCase()
        let user = await findUserByEmail(emailLower)
        let isNewUser = false

        // ===================================
        // STEP 3: Existing User Flow
        // ===================================
        if (user) {
            // Case 1: Already Google user
            if (user.googleId === googleId) {
                // Just login
            }
            // Case 2: Email exists but registered with password/phone
            else if (!user.googleId) {
                // Link Google account to existing account
                user.googleId = googleId
                user.avatar = user.avatar || picture
                user.emailVerified = true
                await user.save()
                console.log(`Linked Google account to existing user: ${email}`)
            }
            // Case 3: Email exists with different Google ID (shouldn't happen)
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered with a different Google account'
                })
            }
        }
        // ===================================
        // STEP 4: New User Registration
        // ===================================
        else {
            // Role is required for new registrations
            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a role to continue registration'
                })
            }

            if (!['worker', 'employer'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be worker or employer.'
                })
            }

            // Create new user with Google OAuth
            user = await User.create({
                name,
                email: emailLower,
                googleId,
                avatar: picture,
                role: role,             // Single role initially
                location: location || '',
                geoLocation: geoLocation || undefined,
                authProvider: 'google',
                emailVerified: true,    // Google email is pre-verified
                isActive: true
            })

            // Create role-specific profile
            if (role === 'worker') {
                await Worker.create({ userId: user._id })
            } else if (role === 'employer') {
                await Employer.create({ userId: user._id })
            }

            isNewUser = true

            // Send welcome email (non-blocking)
            try {
                await sendWelcomeEmail(user.email, user.name)
            } catch (emailErr) {
                console.warn('Welcome email failed:', emailErr.message)
            }

            console.log(`New Google user registered: ${email} as ${role}`)
        }

        // ===================================
        // STEP 5: Generate JWT Tokens
        // ===================================
        const { accessToken, refreshToken } = await createAuthTokens(user, req)

        // ===================================
        // STEP 6: Build Response
        // ===================================
        const userResponse = await buildUserResponse(user)

        res.json({
            success: true,
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            accessToken,
            refreshToken,
            user: userResponse,
            isNewUser
        })
    } catch (error) {
        console.error('Google auth error:', error)
        res.status(500).json({
            success: false,
            message: 'Google authentication failed. Please try again.'
        })
    }
}

// Legacy export for backward compatibility
exports.register = exports.emailRegister
