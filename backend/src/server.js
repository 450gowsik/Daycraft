const env = require('./config/env')
const { connectDB } = require('./config/db')
const express = require('express')
const cors = require('cors')

// Import routes
const authRoutes = require('./routes/auth.routes')
const jobRoutes = require('./routes/job.routes')
const workerRoutes = require('./routes/worker.routes')
const categoryRoutes = require('./routes/category.routes')
const chatRoutes = require('./routes/chat.routes')
const adminRoutes = require('./routes/adminRoutes')
const applicationRoutes = require('./routes/application.routes')
const notificationRoutes = require('./routes/notificationRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const chatbotRoutes = require('./routes/chatbot.routes')

const app = express()

// Middleware
app.use(cors({
    origin: env.CORS_ORIGINS,
    credentials: true
}))
app.use(express.json())

// Root route
app.get("/", (req, res) => {
    res.send("DayCraft Backend is Running 🚀");
});

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/workers', workerRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/chatbot', chatbotRoutes)


// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'DayCraft API is running',
        environment: env.NODE_ENV
    })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        success: false,
        message: env.isDevelopment() ? err.message : 'Server Error'
    })
})

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB()
        app.listen(env.PORT, () => {
            console.log(`🚀 Server running on port ${env.PORT} (${env.NODE_ENV})`)
        })
    } catch (error) {
        console.error('Failed to connect to database')
        // Start server anyway for development without DB
        if (env.isDevelopment()) {
            app.listen(env.PORT, () => {
                console.log(`🚀 Server running on port ${env.PORT} (without MongoDB)`)
            })
        } else {
            process.exit(1)
        }
    }
}

startServer()

