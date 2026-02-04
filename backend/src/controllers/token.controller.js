/**
 * Token Controller - Refresh Token Management
 * 
 * Updated for unified User model with multi-role support.
 * Handles token rotation and logout.
 */

const RefreshToken = require('../models/RefreshToken')
const User = require('../models/User')
const Worker = require('../models/Worker')
const Employer = require('../models/Employer')
const {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    getTokenExpiry
} = require('../utils/jwt')

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
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with valid refresh token)
 */
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            })
        }

        // Hash the provided token and find in DB
        const tokenHash = hashRefreshToken(refreshToken)
        const tokenDoc = await RefreshToken.findValidToken(tokenHash)

        if (!tokenDoc) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            })
        }

        // Find the user (single collection lookup)
        const user = await User.findById(tokenDoc.userId)

        if (!user || !user.isActive) {
            await tokenDoc.revoke()
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            })
        }

        // Revoke old refresh token (rotation)
        await tokenDoc.revoke()

        // Generate new tokens with single role
        const newAccessToken = generateAccessToken({
            id: user._id,
            role: user.role
        })
        const newRefreshToken = generateRefreshToken()

        // Save new refresh token
        await RefreshToken.create({
            userId: user._id,
            userModel: 'User',
            tokenHash: hashRefreshToken(newRefreshToken),
            deviceInfo: tokenDoc.deviceInfo,
            expiresAt: getTokenExpiry('refresh')
        })

        res.json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    } catch (error) {
        console.error('Refresh token error:', error)
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        })
    }
}

/**
 * @desc    Logout - revoke current refresh token
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (refreshToken) {
            const tokenHash = hashRefreshToken(refreshToken)
            await RefreshToken.updateOne(
                { tokenHash },
                { isRevoked: true }
            )
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        })
    } catch (error) {
        console.error('Logout error:', error)
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        })
    }
}

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
exports.logoutAll = async (req, res) => {
    try {
        const userId = req.user._id

        await RefreshToken.revokeAllForUser(userId)

        res.json({
            success: true,
            message: 'Logged out from all devices'
        })
    } catch (error) {
        console.error('Logout all error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to logout from all devices'
        })
    }
}

/**
 * @desc    Get active sessions
 * @route   GET /api/auth/sessions
 * @access  Private
 */
exports.getSessions = async (req, res) => {
    try {
        const userId = req.user._id

        const sessions = await RefreshToken.find({
            userId,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).select('deviceInfo createdAt lastUsedAt')

        res.json({
            success: true,
            sessions: sessions.map(s => ({
                id: s._id,
                device: s.deviceInfo?.deviceName || 'Unknown Device',
                browser: s.deviceInfo?.userAgent?.split(' ')[0] || 'Unknown',
                ip: s.deviceInfo?.ip || 'Unknown',
                createdAt: s.createdAt,
                lastUsedAt: s.lastUsedAt
            }))
        })
    } catch (error) {
        console.error('Get sessions error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to get sessions'
        })
    }
}

/**
 * @desc    Revoke specific session
 * @route   DELETE /api/auth/sessions/:sessionId
 * @access  Private
 */
exports.revokeSession = async (req, res) => {
    try {
        const { sessionId } = req.params
        const userId = req.user._id

        const result = await RefreshToken.updateOne(
            { _id: sessionId, userId },
            { isRevoked: true }
        )

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            })
        }

        res.json({
            success: true,
            message: 'Session revoked'
        })
    } catch (error) {
        console.error('Revoke session error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to revoke session'
        })
    }
}
