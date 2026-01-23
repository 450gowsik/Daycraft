const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['signup', 'login', 'reset'],
        default: 'signup'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete when expired (TTL index)
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

// Limit OTP attempts
otpSchema.methods.incrementAttempts = async function () {
    this.attempts += 1
    await this.save()
    return this.attempts
}

module.exports = mongoose.model('Otp', otpSchema)
