/**
 * Database Configuration
 * Handles MongoDB connection with proper error handling
 */
const mongoose = require('mongoose')

let connectionPromise = null

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    if (connectionPromise) {
        return connectionPromise
    }

    try {
        connectionPromise = mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft'
        )

        const conn = await connectionPromise
        console.log(`MongoDB connected: ${conn.connection.host}`)
        return conn
    } catch (error) {
        connectionPromise = null
        console.error(`MongoDB connection error: ${error.message}`)
        throw error
    }
}

const disconnectDB = async () => {
    try {
        await mongoose.connection.close()
        connectionPromise = null
        console.log('MongoDB disconnected')
    } catch (error) {
        console.error(`Error disconnecting: ${error.message}`)
    }
}

module.exports = { connectDB, disconnectDB }
