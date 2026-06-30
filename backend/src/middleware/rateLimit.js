/**
 * Rate Limiting Middleware - Redis-backed
 * 
 * Prevents brute force attacks on auth endpoints.
 * Uses Redis INCR + EXPIRE for atomic, distributed rate limiting
 * that works across all API instances behind the load balancer.
 * 
 * Falls back to in-memory store if Redis is unavailable.
 */
const { getRedisClient, isRedisConnected } = require('../config/redis')
const env = require('../config/env')

const RATE_LIMIT_PREFIX = 'daycraft:ratelimit:'

// Fallback in-memory store (used only when Redis is down)
const memoryStore = new Map()
setInterval(() => {
    const now = Date.now()
    for (const [key, data] of memoryStore.entries()) {
        if (data.resetAt < now) {
            memoryStore.delete(key)
        }
    }
}, 5 * 60 * 1000)

/**
 * Redis-based rate limit check
 * @returns {{ allowed: boolean, count: number, retryAfter: number }}
 */
const checkRedisRateLimit = async (key, windowMs, max) => {
    const redis = getRedisClient()
    const redisKey = `${RATE_LIMIT_PREFIX}${key}`
    const windowSec = Math.ceil(windowMs / 1000)

    // Atomic increment + set expiry
    const count = await redis.incr(redisKey)

    if (count === 1) {
        // First request — set expiry
        await redis.expire(redisKey, windowSec)
    }

    if (count > max) {
        const ttl = await redis.ttl(redisKey)
        return { allowed: false, count, retryAfter: ttl > 0 ? ttl : windowSec }
    }

    return { allowed: true, count, retryAfter: 0 }
}

/**
 * In-memory fallback rate limit check
 */
const checkMemoryRateLimit = (key, windowMs, max) => {
    const now = Date.now()
    let data = memoryStore.get(key)

    if (!data || data.resetAt < now) {
        data = { count: 1, resetAt: now + windowMs }
        memoryStore.set(key, data)
        return { allowed: true, count: 1, retryAfter: 0 }
    }

    data.count++
    memoryStore.set(key, data)

    if (data.count > max) {
        const retryAfter = Math.ceil((data.resetAt - now) / 1000)
        return { allowed: false, count: data.count, retryAfter }
    }

    return { allowed: true, count: data.count, retryAfter: 0 }
}

/**
 * Create rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {Function} options.keyGenerator - Function to generate key from request
 * @param {string} options.message - Error message
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute default
        max = 5,
        keyGenerator = (req) => req.ip,
        message = 'Too many requests, please try again later'
    } = options

    const maxRequests = env.isDevelopment() ? 10000 : max

    return async (req, res, next) => {
        const key = keyGenerator(req)
        let result

        try {
            if (isRedisConnected()) {
                result = await checkRedisRateLimit(key, windowMs, maxRequests)
            } else {
                result = checkMemoryRateLimit(key, windowMs, maxRequests)
            }
        } catch (err) {
            console.error('Rate limit error:', err.message)
            // Fail open — allow request if rate limiting fails
            return next()
        }

        // Set rate limit headers
        res.set('X-RateLimit-Limit', maxRequests)
        res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - result.count))

        if (!result.allowed) {
            res.set('Retry-After', result.retryAfter)
            return res.status(429).json({
                success: false,
                message,
                retryAfter: result.retryAfter
            })
        }

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
