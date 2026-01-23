const { verifyToken } = require('../utils/jwt')
const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')

// Protect routes - verify JWT token
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

        // Search all collections for the user
        let user = await User.findById(decoded.id)

        if (!user) {
            user = await Worker.findById(decoded.id)
        }

        if (!user) {
            user = await Employer.findById(decoded.id)
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
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

// Authorize specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            })
        }
        next()
    }
}

