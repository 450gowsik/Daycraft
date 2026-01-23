const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'escrowed', 'released', 'refunded'],
        default: 'pending'
    },
    razorpayOrderId: {
        type: String,
        unique: true,
        sparse: true
    },
    razorpayPaymentId: {
        type: String,
        sparse: true
    },
    razorpaySignature: {
        type: String,
        sparse: true
    },
    escrowLockedAt: Date,
    releasedAt: Date,
    refundedAt: Date,
    notes: String
}, {
    timestamps: true
});

// Index for quick lookups
paymentSchema.index({ job: 1, status: 1 });
paymentSchema.index({ employer: 1 });
paymentSchema.index({ worker: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
