/**
 * Database Configuration
 * Handles MongoDB connection with proper error handling
 */
const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft',
            {
                // These options are no longer needed in Mongoose 6+, but kept for clarity
                // useNewUrlParser: true,
                // useUnifiedTopology: true,
            }
        )

        console.log(`✅ MongoDB connected: ${conn.connection.host}`)
        return conn
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`)
        throw error
    }
}

const disconnectDB = async () => {
    try {
        await mongoose.connection.close()
        console.log('MongoDB disconnected')
    } catch (error) {
        console.error(`Error disconnecting: ${error.message}`)
    }
}

module.exports = { connectDB, disconnectDB }
