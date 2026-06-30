/**
 * Cache Service - Redis-backed caching layer
 * 
 * Features:
 *   - Namespaced keys to prevent collisions
 *   - JSON serialization/deserialization
 *   - Cache-aside pattern (getOrSet)
 *   - Pattern-based invalidation
 */
const { getRedisClient, isRedisConnected } = require('../config/redis')

const KEY_PREFIX = 'daycraft:cache:'

/**
 * Get a cached value
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Parsed value or null
 */
const get = async (key) => {
    try {
        if (!isRedisConnected()) return null
        const redis = getRedisClient()
        const data = await redis.get(`${KEY_PREFIX}${key}`)
        return data ? JSON.parse(data) : null
    } catch (err) {
        console.error('Cache GET error:', err.message)
        return null
    }
}

/**
 * Set a cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON-serialized)
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @returns {Promise<boolean>} Success
 */
const set = async (key, value, ttl = 300) => {
    try {
        if (!isRedisConnected()) return false
        const redis = getRedisClient()
        await redis.set(`${KEY_PREFIX}${key}`, JSON.stringify(value), 'EX', ttl)
        return true
    } catch (err) {
        console.error('Cache SET error:', err.message)
        return false
    }
}

/**
 * Delete a cached value
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success
 */
const del = async (key) => {
    try {
        if (!isRedisConnected()) return false
        const redis = getRedisClient()
        await redis.del(`${KEY_PREFIX}${key}`)
        return true
    } catch (err) {
        console.error('Cache DEL error:', err.message)
        return false
    }
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Glob pattern (e.g., 'jobs:*')
 * @returns {Promise<number>} Number of keys deleted
 */
const flush = async (pattern) => {
    try {
        if (!isRedisConnected()) return 0
        const redis = getRedisClient()
        const keys = await redis.keys(`${KEY_PREFIX}${pattern}`)
        if (keys.length === 0) return 0
        await redis.del(...keys)
        return keys.length
    } catch (err) {
        console.error('Cache FLUSH error:', err.message)
        return 0
    }
}

/**
 * Cache-aside pattern: Get from cache, or fetch and cache
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data on cache miss
 * @param {number} ttl - TTL in seconds
 * @returns {Promise<any>} Cached or freshly fetched data
 */
const getOrSet = async (key, fetchFn, ttl = 300) => {
    // Try cache first
    const cached = await get(key)
    if (cached !== null) {
        return cached
    }

    // Cache miss — fetch fresh data
    const data = await fetchFn()
    if (data !== null && data !== undefined) {
        await set(key, data, ttl)
    }
    return data
}

module.exports = {
    get,
    set,
    del,
    flush,
    getOrSet
}
