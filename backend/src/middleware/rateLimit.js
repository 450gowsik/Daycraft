/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on auth endpoints
 */

// In-memory store (use Redis in production)
const rateLimitStore = new Map()

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, data] of rateLimitStore.entries()) {
        if (data.resetAt < now) {
            rateLimitStore.delete(key)
        }
    }
}, 5 * 60 * 1000)

/**
 * Create rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {string} options.keyGenerator - Function to generate key
 * @param {string} options.message - Error message
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute default
        max = 5,
        keyGenerator = (req) => req.ip,
        message = 'Too many requests, please try again later'
    } = options

    return (req, res, next) => {
        const key = keyGenerator(req)
        const now = Date.now()

        let data = rateLimitStore.get(key)

        if (!data || data.resetAt < now) {
            data = {
                count: 1,
                resetAt: now + windowMs
            }
            rateLimitStore.set(key, data)
            return next()
        }

        data.count++

        if (data.count > max) {
            const retryAfter = Math.ceil((data.resetAt - now) / 1000)
            return res.status(429).json({
                success: false,
                message,
                retryAfter
            })
        }

        rateLimitStore.set(key, data)
        next()
    }
}

/**
 * Rate limiter for OTP requests
 * 3 requests per 10 minutes per phone/email
 */
const otpRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3,
    keyGenerator: (req) => {
        const identifier = req.body.phone || req.body.email || req.ip
        return `otp:${identifier}`
    },
    message: 'Too many OTP requests. Please wait 10 minutes before trying again.'
})

/**
 * Rate limiter for login attempts
 * 5 attempts per 15 minutes per IP
 */
const loginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyGenerator: (req) => `login:${req.ip}`,
    message: 'Too many login attempts. Please try again in 15 minutes.'
})

/**
 * Rate limiter for password reset
 * 3 requests per hour per email
 */
const passwordResetRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    keyGenerator: (req) => `reset:${req.body.email || req.ip}`,
    message: 'Too many password reset requests. Please try again in 1 hour.'
})

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    keyGenerator: (req) => `api:${req.ip}`,
    message: 'Too many requests. Please slow down.'
})

module.exports = {
    createRateLimiter,
    otpRateLimiter,
    loginRateLimiter,
    passwordResetRateLimiter,
    apiRateLimiter
}
