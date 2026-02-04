const mongoose = require('mongoose')

/**
 * Activity Log Model - Audit Trail
 * 
 * ⭐ PRODUCTION-GRADE ARCHITECTURE
 * 
 * Tracks all critical user actions for:
 *   - Security auditing
 *   - Compliance (GDPR, etc.)
 *   - Analytics
 *   - Debugging
 * 
 * Features:
 *   - TTL auto-cleanup (90 days)
 *   - Structured action types
 *   - IP/Device tracking
 */

const activityLogSchema = new mongoose.Schema({
    // ==========================================
    // Who performed the action
    // ==========================================
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // ==========================================
    // What action was performed
    // ==========================================
    action: {
        type: String,
        enum: [
            // Auth actions
            'login',
            'logout',
            'login_failed',
            'password_change',
            'password_reset',
            'otp_request',
            'otp_verify',

            // CRUD actions
            'create',
            'read',
            'update',
            'delete',
            'soft_delete',
            'restore',

            // Business actions
            'apply',
            'hire',
            'reject',
            'complete_job',
            'cancel_job',

            // Payment actions
            'payment_init',
            'payment_success',
            'payment_failed',
            'escrow_lock',
            'escrow_release',
            'refund',

            // Profile actions
            'profile_update',
            'role_switch',
            'role_add',
            'verification_submit',
            'verification_approve',

            // System actions
            'account_suspend',
            'account_restore',
            'admin_action'
        ],
        required: true,
        index: true
    },

    // ==========================================
    // What entity was affected
    // ==========================================
    entityType: {
        type: String,
        enum: ['user', 'job', 'application', 'payment', 'worker', 'employer', 'message', 'notification'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },

    // ==========================================
    // Additional Context
    // ==========================================
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    description: {
        type: String,
        default: ''
    },

    // ==========================================
    // Request Info (Security)
    // ==========================================
    ipAddress: {
        type: String,
        default: ''
    },
    userAgent: {
        type: String,
        default: ''
    },
    deviceInfo: {
        type: String,
        default: ''
    },

    // ==========================================
    // Result Status
    // ==========================================
    status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'success'
    },
    errorMessage: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
})

// ==========================================
// INDEXES
// ==========================================
// TTL: Auto-delete logs after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

// Query optimization indexes
activityLogSchema.index({ userId: 1, action: 1, createdAt: -1 })
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })
activityLogSchema.index({ action: 1, status: 1, createdAt: -1 })
activityLogSchema.index({ ipAddress: 1 })  // For security analysis

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Log an activity
 * @param {Object} data - Log data
 * @returns {Promise<Document>}
 */
activityLogSchema.statics.log = async function (data) {
    return this.create(data)
}

/**
 * Log a user action (helper)
 */
activityLogSchema.statics.logUserAction = async function (userId, action, entityType, entityId, options = {}) {
    return this.create({
        userId,
        action,
        entityType,
        entityId,
        ...options
    })
}

/**
 * Get recent activity for a user
 */
activityLogSchema.statics.getRecentActivity = function (userId, limit = 20) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
}

/**
 * Get login history for a user
 */
activityLogSchema.statics.getLoginHistory = function (userId, limit = 10) {
    return this.find({
        userId,
        action: { $in: ['login', 'login_failed', 'logout'] }
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
}

/**
 * Get suspicious activity (failed logins from multiple IPs)
 */
activityLogSchema.statics.getSuspiciousActivity = async function (userId, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const failedLogins = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                action: 'login_failed',
                createdAt: { $gte: since }
            }
        },
        {
            $group: {
                _id: '$ipAddress',
                count: { $sum: 1 },
                lastAttempt: { $max: '$createdAt' }
            }
        },
        {
            $match: { count: { $gte: 3 } }  // 3+ failed attempts
        }
    ])

    return failedLogins
}

module.exports = mongoose.model('ActivityLog', activityLogSchema)
