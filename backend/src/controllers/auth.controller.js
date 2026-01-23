const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')
const axios = require('axios')
const { sendWelcomeEmail } = require('../services/emailService')

// Helper function to get the appropriate model based on role
const getModelByRole = (role) => {
    if (role === 'worker') return Worker
    if (role === 'employer') return Employer
    return User // Fallback for admin or unknown roles
}

// Helper function to find user across all collections
const findUserByEmail = async (email) => {
    let user = await Worker.findOne({ email })
    if (user) return { user, model: Worker }

    user = await Employer.findOne({ email })
    if (user) return { user, model: Employer }

    user = await User.findOne({ email }) // Check legacy User collection
    if (user) return { user, model: User }

    return { user: null, model: null }
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

// @desc    Register user (email/password)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, role, location, geoLocation } = req.body

        // Check if user already exists in any collection
        const { user: existingUser } = await findUserByEmail(email)
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            })
        }

        // Get the appropriate model based on role
        const Model = getModelByRole(role)
        console.log(`Registering ${role} in ${Model.modelName} collection`)

        // Create user in the appropriate collection
        const user = await Model.create({
            name,
            email,
            phone,
            password,
            role,
            location,
            geoLocation,
            // Unified auth flow: track provider and set verification flags
            authProvider: 'email',
            emailVerified: false,
            phoneVerified: false,
            profileCompleted: false
        })

        // Send welcome email
        await sendWelcomeEmail(email, name, role)

        // Generate token
        const token = user.generateToken()

        res.status(201).json({
            success: true,
            message: `Registration successful as ${role}`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                authProvider: user.authProvider,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                profileCompleted: user.profileCompleted
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        })
    }
}


// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Find user across all collections and include password
        let user = await Worker.findOne({ email }).select('+password')
        if (!user) {
            user = await Employer.findOne({ email }).select('+password')
        }
        if (!user) {
            user = await User.findOne({ email }).select('+password')
        }

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

        // Check password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // Generate token
        const token = user.generateToken()

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                location: user.location,
                skills: user.skills,
                experience: user.experience,
                dailyRate: user.dailyRate,
                companyName: user.companyName,
                // Include verification status for frontend decisions
                authProvider: user.authProvider,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                profileCompleted: user.profileCompleted
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        })
    }
}

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        // Search across all collections based on the user's role from the token
        let user = null
        const { id, role } = req.user

        if (role === 'worker') {
            user = await Worker.findById(id)
        } else if (role === 'employer') {
            user = await Employer.findById(id)
        } else {
            user = await User.findById(id) // Admin or legacy users
        }

        // Fallback: search all collections if not found by role
        if (!user) {
            user = await Worker.findById(id) || await Employer.findById(id) || await User.findById(id)
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        res.json({
            success: true,
            user
        })
    } catch (error) {
        console.error('GetMe error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        })
    }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const allowedUpdates = [
            'name', 'phone', 'avatar', 'location', 'bio',
            'skills', 'experience', 'availability', 'dailyRate',
            'companyName', 'companyDescription', 'industry',
            'profileCompleted', 'locationVerified', 'photoVerified', 'geoLocation'
        ]

        const updates = {}
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key]
            }
        }

        // Get the appropriate model based on role
        const { id, role } = req.user
        const Model = getModelByRole(role)

        let user = await Model.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        )

        // Fallback: try other collections if not found
        if (!user) {
            user = await Worker.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        }
        if (!user) {
            user = await Employer.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        }
        if (!user) {
            user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        })
    } catch (error) {
        console.error('Update profile error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        })
    }
}
// @desc    Google Auth login/register
// @route   POST /api/auth/google
exports.googleAuth = async (req, res) => {
    try {
        const { token, role, location, geoLocation } = req.body // token is access_token
        console.log('Google Auth Request - Role:', role)

        // Verify access token by fetching user info
        const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const { name, email, picture, sub: googleId } = googleResponse.data
        console.log('Google User Info:', email, name)

        // Check if user exists in any collection
        const { user: existingUser, model: existingModel } = await findUserByEmail(email)
        let user = existingUser
        let isNewUser = false

        if (user) {
            // If user exists but no googleId (was email/pass), link it
            if (!user.googleId) {
                user.googleId = googleId
                if (!user.avatar) user.avatar = picture
                await user.save()
            }
        } else {
            isNewUser = true
            // Get the appropriate model based on role
            const userRole = role || 'worker'
            const Model = getModelByRole(userRole)
            console.log(`Creating new ${userRole} via Google in ${Model.modelName} collection`)

            // Create new user in the appropriate collection
            user = await Model.create({
                name,
                email,
                googleId,
                avatar: picture,
                role: userRole,
                location,
                geoLocation,
                // Unified auth flow: Google users have email auto-verified
                authProvider: 'google',
                phoneVerified: false,
                emailVerified: true,  // Google verifies email
                profileCompleted: false,  // Must complete profile after signup
                isActive: true,
                password: await require('bcryptjs').hash(Math.random().toString(36).slice(-8), 10)
            })

            // Send welcome email to new Google users
            await sendWelcomeEmail(email, name, userRole)
        }

        const jwtToken = user.generateToken()

        res.json({
            success: true,
            message: 'Google login successful',
            token: jwtToken,
            isNewUser,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                // Include verification status for frontend decisions
                authProvider: user.authProvider,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified,
                profileCompleted: user.profileCompleted
            }
        })
    } catch (error) {
        console.error('Google Auth error:', error.message)
        const detailedError = error.response?.data?.error_description || error.message || 'Unknown Error'
        res.status(500).json({
            success: false,
            message: `Google Login Failed: ${detailedError}`
        })
    }
}
