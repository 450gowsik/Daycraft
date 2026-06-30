const env = require('./config/env')
const { connectDB, disconnectDB } = require('./config/db')
const { connectRedis, disconnectRedis } = require('./config/redis')
const app = require('./app')

// Connect to MongoDB + Redis and start server
const startServer = async () => {
    try {
        // Initialize Redis (non-blocking — app works without it)
        try {
            connectRedis()
            console.log(`[${env.INSTANCE_ID}] Redis initializing...`)
        } catch (redisErr) {
            console.warn(`[${env.INSTANCE_ID}] Redis unavailable:`, redisErr.message)
            console.warn(`[${env.INSTANCE_ID}] Continuing without Redis (fallback mode)`)
        }

        // Connect to MongoDB
        await connectDB()

        app.listen(env.PORT, () => {
            console.log(`[${env.INSTANCE_ID}] Server running on port ${env.PORT} (${env.NODE_ENV})`)
        })
    } catch (error) {
        console.error(`[${env.INSTANCE_ID}] Failed to connect to database`)
        // Start server anyway for development without DB
        if (env.isDevelopment()) {
            app.listen(env.PORT, () => {
                console.log(`[${env.INSTANCE_ID}] Server running on port ${env.PORT} (without MongoDB)`)
            })
        } else {
            process.exit(1)
        }
    }
}

// ==========================================
// Graceful Shutdown
// ==========================================
const gracefulShutdown = async (signal) => {
    console.log(`\n[${env.INSTANCE_ID}] ${signal} received. Shutting down gracefully...`)

    try {
        await disconnectRedis()
        await disconnectDB()
        console.log(`[${env.INSTANCE_ID}] All connections closed.`)
        process.exit(0)
    } catch (err) {
        console.error(`[${env.INSTANCE_ID}] Error during shutdown:`, err)
        process.exit(1)
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

startServer()
