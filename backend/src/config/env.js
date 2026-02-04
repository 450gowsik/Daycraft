/**
 * Environment Configuration
 * Centralizes environment variable access with defaults
 */
require('dotenv').config()

const env = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 5000,

    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret_change_in_production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',

    // SMS (Fast2SMS)
    FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',
    SMS_ENABLED: process.env.SMS_ENABLED === 'true',

    // Twilio (New SMS Provider)
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

    // Email (Brevo/SendinBlue)
    BREVO_API_KEY: process.env.BREVO_API_KEY || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@daycraft.com',

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

    // Razorpay (Escrow Payments)
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

    // CORS
    CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(','),

    // Helper methods
    isDevelopment: () => env.NODE_ENV === 'development',
    isProduction: () => env.NODE_ENV === 'production',
    isTest: () => env.NODE_ENV === 'test'
}

module.exports = env
