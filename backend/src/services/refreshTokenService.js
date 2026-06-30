/**
 * Refresh Token Service - Redis-backed
 * 
 * Replaces the MongoDB RefreshToken model with Redis storage.
 * Benefits:
 *   - Auto-expiry via Redis TTL (no TTL index needed)
 *   - Microsecond lookups vs MongoDB queries
 *   - Shared across all API instances
 *   - No database load for token operations
 * 
 * Key Structure:
 *   daycraft:tokens:refresh:<tokenHash>  → token data (JSON)
 *   daycraft:tokens:user:<userId>:*      → set of token hashes for session listing
 */
const { getRedisClient, isRedisConnected } = require('../config/redis')

const TOKEN_PREFIX = 'daycraft:tokens:refresh:'
const USER_PREFIX = 'daycraft:tokens:user:'
const DEFAULT_TTL = 7 * 24 * 60 * 60 // 7 days in seconds

// Fallback in-memory store for tokens (when Redis is down/unavailable)
const tokenMemoryStore = new Map()
const userTokenMemoryStore = new Map() // maps userId -> Set of token hashes

// Clean up expired in-memory tokens periodically (every 5 minutes)
setInterval(() => {
    const now = new Date()
    for (const [hash, parsed] of tokenMemoryStore.entries()) {
        const expiry = new Date(new Date(parsed.createdAt).getTime() + ((parsed.ttl || DEFAULT_TTL) * 1000))
        if (expiry < now) {
            tokenMemoryStore.delete(hash)
            if (parsed.userId && userTokenMemoryStore.has(parsed.userId)) {
                userTokenMemoryStore.get(parsed.userId).delete(hash)
            }
        }
    }
}, 5 * 60 * 1000)

/**
 * Store a refresh token in Redis
 * @param {string} userId - User's MongoDB ObjectId as string
 * @param {string} tokenHash - SHA-256 hash of the refresh token
 * @param {Object} deviceInfo - { userAgent, ip, deviceName }
 * @param {number} ttl - TTL in seconds (default: 7 days)
 */
const storeToken = async (userId, tokenHash, deviceInfo = {}, ttl = DEFAULT_TTL) => {
    const tokenData = {
        userId,
        tokenHash,
        deviceInfo,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        ttl
    }

    try {
        if (!isRedisConnected()) {
            // Memory fallback
            tokenMemoryStore.set(tokenHash, tokenData)
            if (!userTokenMemoryStore.has(userId)) {
                userTokenMemoryStore.set(userId, new Set())
            }
            userTokenMemoryStore.get(userId).add(tokenHash)
            return tokenData
        }
        
        const redis = getRedisClient()

        // Store token data with TTL
        await redis.set(
            `${TOKEN_PREFIX}${tokenHash}`,
            JSON.stringify(tokenData),
            'EX',
            ttl
        )

        // Add to user's token set (for session listing)
        await redis.sadd(`${USER_PREFIX}${userId}`, tokenHash)
        await redis.expire(`${USER_PREFIX}${userId}`, ttl)

        return tokenData
    } catch (err) {
        console.error('RefreshToken STORE error, falling back to memory:', err.message)
        tokenMemoryStore.set(tokenHash, tokenData)
        if (!userTokenMemoryStore.has(userId)) {
            userTokenMemoryStore.set(userId, new Set())
        }
        userTokenMemoryStore.get(userId).add(tokenHash)
        return tokenData
    }
}

/**
 * Find a valid token by its hash
 * @param {string} tokenHash - SHA-256 hash
 * @returns {Object|null} Token data or null if not found/expired
 */
const findValidToken = async (tokenHash) => {
    try {
        if (!isRedisConnected()) {
            return tokenMemoryStore.get(tokenHash) || null
        }
        const redis = getRedisClient()
        const data = await redis.get(`${TOKEN_PREFIX}${tokenHash}`)
        return data ? JSON.parse(data) : null
    } catch (err) {
        console.error('RefreshToken FIND error:', err.message)
        return tokenMemoryStore.get(tokenHash) || null
    }
}

/**
 * Revoke (delete) a specific token
 * @param {string} tokenHash - SHA-256 hash
 * @param {string} userId - User ID (optional, for cleanup)
 */
const revokeToken = async (tokenHash, userId = null) => {
    try {
        if (!isRedisConnected()) {
            if (!userId) {
                const data = tokenMemoryStore.get(tokenHash)
                if (data) userId = data.userId
            }
            tokenMemoryStore.delete(tokenHash)
            if (userId && userTokenMemoryStore.has(userId)) {
                userTokenMemoryStore.get(userId).delete(tokenHash)
            }
            return true
        }
        const redis = getRedisClient()

        if (!userId) {
            const data = await redis.get(`${TOKEN_PREFIX}${tokenHash}`)
            if (data) {
                userId = JSON.parse(data).userId
            }
        }

        await redis.del(`${TOKEN_PREFIX}${tokenHash}`)

        if (userId) {
            await redis.srem(`${USER_PREFIX}${userId}`, tokenHash)
        }

        return true
    } catch (err) {
        console.error('RefreshToken REVOKE error:', err.message)
        tokenMemoryStore.delete(tokenHash)
        if (userId && userTokenMemoryStore.has(userId)) {
            userTokenMemoryStore.get(userId).delete(tokenHash)
        }
        return true
    }
}

/**
 * Revoke all tokens for a user (logout all devices)
 * @param {string} userId - User ID
 */
const revokeAllForUser = async (userId) => {
    try {
        if (!isRedisConnected()) {
            const hashes = userTokenMemoryStore.get(userId)
            if (hashes) {
                hashes.forEach(h => tokenMemoryStore.delete(h))
                userTokenMemoryStore.delete(userId)
            }
            return true
        }
        const redis = getRedisClient()

        const tokenHashes = await redis.smembers(`${USER_PREFIX}${userId}`)

        if (tokenHashes.length > 0) {
            const tokenKeys = tokenHashes.map(h => `${TOKEN_PREFIX}${h}`)
            await redis.del(...tokenKeys)
        }

        await redis.del(`${USER_PREFIX}${userId}`)

        return true
    } catch (err) {
        console.error('RefreshToken REVOKE ALL error:', err.message)
        const hashes = userTokenMemoryStore.get(userId)
        if (hashes) {
            hashes.forEach(h => tokenMemoryStore.delete(h))
            userTokenMemoryStore.delete(userId)
        }
        return true
    }
}

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} List of session objects
 */
const getSessions = async (userId) => {
    try {
        if (!isRedisConnected()) {
            const hashes = userTokenMemoryStore.get(userId)
            if (!hashes) return []
            const sessions = []
            hashes.forEach(hash => {
                const parsed = tokenMemoryStore.get(hash)
                if (parsed) {
                    sessions.push({
                        id: hash.substring(0, 8),
                        device: parsed.deviceInfo?.deviceName || 'Unknown Device',
                        browser: parsed.deviceInfo?.userAgent?.split(' ')[0] || 'Unknown',
                        ip: parsed.deviceInfo?.ip || 'Unknown',
                        createdAt: parsed.createdAt,
                        lastUsedAt: parsed.lastUsedAt
                    })
                }
            })
            return sessions
        }
        const redis = getRedisClient()

        const tokenHashes = await redis.smembers(`${USER_PREFIX}${userId}`)

        if (tokenHashes.length === 0) return []

        const pipeline = redis.pipeline()
        tokenHashes.forEach(hash => {
            pipeline.get(`${TOKEN_PREFIX}${hash}`)
        })
        const results = await pipeline.exec()

        const sessions = []
        const expiredHashes = []

        results.forEach(([err, data], index) => {
            if (err || !data) {
                expiredHashes.push(tokenHashes[index])
                return
            }
            const parsed = JSON.parse(data)
            sessions.push({
                id: tokenHashes[index].substring(0, 8),
                device: parsed.deviceInfo?.deviceName || 'Unknown Device',
                browser: parsed.deviceInfo?.userAgent?.split(' ')[0] || 'Unknown',
                ip: parsed.deviceInfo?.ip || 'Unknown',
                createdAt: parsed.createdAt,
                lastUsedAt: parsed.lastUsedAt
            })
        })

        if (expiredHashes.length > 0) {
            await redis.srem(`${USER_PREFIX}${userId}`, ...expiredHashes)
        }

        return sessions
    } catch (err) {
        console.error('RefreshToken GET SESSIONS error:', err.message)
        return []
    }
}

/**
 * Update last used timestamp for a token
 * @param {string} tokenHash - SHA-256 hash
 */
const updateLastUsed = async (tokenHash) => {
    try {
        if (!isRedisConnected()) {
            const parsed = tokenMemoryStore.get(tokenHash)
            if (parsed) {
                parsed.lastUsedAt = new Date().toISOString()
            }
            return
        }
        const redis = getRedisClient()
        const data = await redis.get(`${TOKEN_PREFIX}${tokenHash}`)
        if (data) {
            const parsed = JSON.parse(data)
            parsed.lastUsedAt = new Date().toISOString()
            const ttl = await redis.ttl(`${TOKEN_PREFIX}${tokenHash}`)
            if (ttl > 0) {
                await redis.set(`${TOKEN_PREFIX}${tokenHash}`, JSON.stringify(parsed), 'EX', ttl)
            }
        }
    } catch (err) {
        console.error('RefreshToken UPDATE error:', err.message)
    }
}

module.exports = {
    storeToken,
    findValidToken,
    revokeToken,
    revokeAllForUser,
    getSessions,
    updateLastUsed,
    DEFAULT_TTL
}
