const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../config/env');
const Payment = require('../models/Payment');
const User = require('../models/User');

const razorpay = (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
    ? new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
    })
    : {
        orders: {
            create: async (options) => ({
                id: 'order_mock_' + Date.now(),
                amount: options.amount,
                currency: options.currency,
                status: 'created'
            })
        }
    };

/**
 * Payment Service for Escrow Logic
 */
const paymentService = {
    /**
     * Create a Razorpay Order
     */
    createOrder: async (amount, jobId, employerId, workerId) => {
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `job_${jobId}_${Date.now()}`,
            notes: {
                jobId: jobId.toString(),
                employerId: employerId.toString(),
                workerId: workerId.toString()
            }
        };

        try {
            const order = await razorpay.orders.create(options);

            // Create a pending payment record
            const payment = await Payment.create({
                job: jobId,
                employer: employerId,
                worker: workerId,
                amount: amount,
                razorpayOrderId: order.id,
                status: 'pending'
            });

            return { success: true, order, paymentId: payment._id };
        } catch (error) {
            console.error('Razorpay Order Error:', error);
            throw new Error('Failed to create payment order');
        }
    },

    /**
     * Verify Webhook Signature
     */
    verifyWebhook: (body, signature) => {
        const expectedSignature = crypto
            .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(body))
            .digest('hex');

        return expectedSignature === signature;
    },

    /**
     * Handle Successful Payment Webhook
     */
    handlePaymentSuccess: async (razorpayOrderId, razorpayPaymentId, signature) => {
        const payment = await Payment.findOne({ razorpayOrderId });

        if (!payment) {
            throw new Error('Payment record not found for order: ' + razorpayOrderId);
        }

        if (payment.status !== 'pending') {
            return payment; // Already processed (idempotency)
        }

        payment.status = 'escrowed';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = signature;
        payment.escrowLockedAt = new Date();
        await payment.save();

        return payment;
    },

    /**
     * Release Funds to Worker
     */
    releaseFunds: async (paymentId, employerId) => {
        const payment = await Payment.findById(paymentId);

        if (!payment) throw new Error('Payment not found');
        if (payment.employer.toString() !== employerId.toString()) {
            throw new Error('Unauthorized: Only the employer can release funds');
        }
        if (payment.status !== 'escrowed') {
            throw new Error('Payment is not in escrowed state');
        }

        // Update Payment Status
        payment.status = 'released';
        payment.releasedAt = new Date();
        await payment.save();

        // Update Worker's Wallet Balance (Internal Ledger)
        await User.findByIdAndUpdate(payment.worker, {
            $inc: { walletBalance: payment.amount }
        });

        return payment;
    }
};

module.exports = paymentService;
