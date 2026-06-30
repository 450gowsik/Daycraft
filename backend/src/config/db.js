/**
 * Database Configuration
 * Handles MongoDB connection with proper error handling
 */
const mongoose = require('mongoose')

let connectionPromise = null
let lastConnectTime = 0
const CONNECT_COOLDOWN = 10000 // 10 seconds cooldown

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    if (connectionPromise) {
        return connectionPromise
    }

    if (Date.now() - lastConnectTime < CONNECT_COOLDOWN) {
        throw new Error('MongoDB connection is in cooldown after failure')
    }

    try {
        mongoose.set('bufferCommands', false)
        lastConnectTime = Date.now()
        connectionPromise = mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft',
            {
                serverSelectionTimeoutMS: 1500
            }
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

module.exports = { connectDB, disconnectDB, isDbConnected: () => mongoose.connection.readyState === 1 }

