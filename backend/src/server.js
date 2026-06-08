const env = require('./config/env')
const { connectDB } = require('./config/db')
const app = require('./app')

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB()
        app.listen(env.PORT, () => {
            console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`)
        })
    } catch (error) {
        console.error('Failed to connect to database')
        // Start server anyway for development without DB
        if (env.isDevelopment()) {
            app.listen(env.PORT, () => {
                console.log(`Server running on port ${env.PORT} (without MongoDB)`)
            })
        } else {
            process.exit(1)
        }
    }
}

startServer()
