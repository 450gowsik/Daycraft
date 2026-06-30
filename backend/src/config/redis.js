/**
 * Redis Configuration
 * Handles Redis connection for caching, refresh tokens, and rate limiting
 */
const Redis = require('ioredis')
const env = require('./env')

let redisClient = null

/**
 * Create and connect Redis client
 * @returns {Redis} Connected Redis client
 */
const connectRedis = () => {
    if (redisClient && redisClient.status === 'ready') {
        return redisClient
    }

    redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 10) {
                console.error('Redis: Max reconnection attempts reached')
                return null // Stop retrying
            }
            const delay = Math.min(times * 200, 5000)
            console.log(`Redis: Reconnecting in ${delay}ms (attempt ${times})`)
            return delay
        },
        lazyConnect: false,
        enableReadyCheck: true,
        connectTimeout: 10000
    })

    redisClient.on('connect', () => {
        console.log('Redis: Connected')
    })

    redisClient.on('ready', () => {
        console.log('Redis: Ready to accept commands')
    })

    redisClient.on('error', (err) => {
        console.error('Redis: Connection error:', err.message)
    })

    redisClient.on('close', () => {
        console.log('Redis: Connection closed')
    })

    return redisClient
}

/**
 * Get existing Redis client
 * @returns {Redis|null}
 */
const getRedisClient = () => {
    if (!redisClient) {
        return connectRedis()
    }
    return redisClient
}

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
const isRedisConnected = () => {
    return redisClient && redisClient.status === 'ready'
}

/**
 * Graceful disconnect
 */
const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
        console.log('Redis: Disconnected gracefully')
    }
}

module.exports = {
    connectRedis,
    getRedisClient,
    isRedisConnected,
    disconnectRedis
}
