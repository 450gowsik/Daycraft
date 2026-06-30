const env = require('./config/env')
const { connectDB } = require('./config/db')
const { isRedisConnected } = require('./config/redis')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')

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
const corsOrigin = env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS

// Trust proxy for load balancer (Nginx)
// Required for correct req.ip behind reverse proxy
app.set('trust proxy', true)

const ensureDatabaseConnection = async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (error) {
        if (env.isDevelopment()) {
            return next()
        }
        next(error)
    }
}

// Middleware
app.use(helmet())
app.use(cors({
    origin: corsOrigin,
    credentials: true
}))
app.use(cookieParser())
app.use(express.json())

// Root routes
app.get(['/', '/api'], (req, res) => {
    res.status(200).send('DayCraft Backend Running')
})

// Health check routes (includes Redis + MongoDB status + instance ID)
app.get(['/health', '/api/health'], (req, res) => {
    const { isDbConnected } = require('./config/db')
    res.status(200).json({
        status: 'ok',
        message: 'DayCraft API is running',
        instance: env.INSTANCE_ID,
        environment: env.NODE_ENV,
        services: {
            mongodb: isDbConnected() ? 'connected' : 'disconnected',
            redis: isRedisConnected() ? 'connected' : 'disconnected'
        }
    })
})

// Ensure MongoDB is connected before API routes that rely on it
app.use('/api', ensureDatabaseConnection)

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

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        success: false,
        message: env.isDevelopment() ? err.message : 'Server Error'
    })
})

module.exports = app
