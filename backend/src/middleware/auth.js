const { verifyToken } = require('../utils/jwt')
const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')
const cacheService = require('../services/cacheService')

const USER_CACHE_TTL = 300 // 5 minutes

/**
 * Protect routes - verify JWT token
 * 
 * Now uses single User collection for auth lookup.
 * Caches user data in Redis for faster subsequent requests.
 * Attaches user with profile data to request.
 */
exports.protect = async (req, res, next) => {
    let token

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        })
    }

    try {
        // Verify token
        const decoded = verifyToken(token)

        // Try Redis cache first for user lookup
        const cacheKey = `user:${decoded.id}`
        let user = await cacheService.get(cacheKey)

        if (user) {
            // Restore Mongoose document methods by creating a lightweight proxy
            user._id = user._id
            user.id = user._id
        } else {
            // Cache miss — fetch from MongoDB
            user = await User.findById(decoded.id)

            if (user) {
                // Cache the user data (plain object)
                await cacheService.set(cacheKey, user.toObject(), USER_CACHE_TTL)
            }
        }

        if (!user) {
            console.log('Auth Debug - Token user ID not found:', decoded.id)
            return res.status(401).json({
                success: false,
                message: 'User not found - please log out and log in again'
            })
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been suspended'
            })
        }

        // Attach user to request with id property for consistency
        req.user = user
        req.user.id = user._id

        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        })
    }
}

/**
 * Authorize specific roles
 * 
 * Checks against the single role field.
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Your current role (${req.user.role}) is not authorized to access this route`
            })
        }
        next()
    }
}

/**
 * Attach profile to request based on role
 * 
 * Use after protect middleware when you need profile data.
 */
exports.attachProfile = async (req, res, next) => {
    try {
        const user = req.user

        if (user.role === 'worker') {
            req.profile = await Worker.findOne({ userId: user._id })
        } else if (user.role === 'employer') {
            req.profile = await Employer.findOne({ userId: user._id })
        }

        next()
    } catch (error) {
        console.error('Attach profile error:', error)
        next() // Continue even if profile fetch fails
    }
}
