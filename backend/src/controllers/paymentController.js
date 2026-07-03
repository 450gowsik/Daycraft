const paymentService = require('../services/paymentService');
const Job = require('../models/Job');
const Payment = require('../models/Payment');

/**
 * Payment Controller
 */
const paymentController = {
    /**
     * @desc    Create Razorpay Order
     * @route   POST /api/payments/create-order
     * @access  Private (Employer)
     */
    createOrder: async (req, res) => {
        try {
            const { jobId, workerId, amount } = req.body;

            // 1. Validation
            const job = await Job.findById(jobId);
            if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

            if (job.employer.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Only the job employer can initiate payment' });
            }

            // 2. Create Order via Service
            const result = await paymentService.createOrder(amount, jobId, req.user.id, workerId);

            res.json(result);
        } catch (error) {
            console.error('Create Order Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * @desc    Confirm Mock Payment
     * @route   POST /api/payments/confirm-mock
     * @access  Private (Employer)
     */
    confirmMockPayment: async (req, res) => {
        try {
            const { paymentId } = req.body;
            const result = await paymentService.confirmMockPayment(paymentId, req.user.id);
            res.json({ success: true, payment: result });
        } catch (error) {
            console.error('Confirm Mock Payment Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * @desc    Verify Payment Webhook
     * @route   POST /api/payments/webhook
     * @access  Public (Razorpay)
     */
    handleWebhook: async (req, res) => {
        try {
            const signature = req.headers['x-razorpay-signature'];

            // 1. Verify Signature
            const isValid = paymentService.verifyWebhook(req.body, signature);
            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Invalid signature' });
            }

            const event = req.body.event;
            const payload = req.body.payload;

            // 2. Handle specific events
            if (event === 'payment.captured' || event === 'order.paid') {
                const orderId = payload.payment ? payload.payment.entity.order_id : payload.order.entity.id;
                const paymentId = payload.payment ? payload.payment.entity.id : null;

                await paymentService.handlePaymentSuccess(orderId, paymentId, signature);
                console.log(`Payment successful for Order: ${orderId}`);
            }

            res.json({ status: 'ok' });
        } catch (error) {
            console.error('Webhook Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * @desc    Release Funds to Worker
     * @route   POST /api/payments/release/:paymentId
     * @access  Private (Employer)
     */
    releaseFunds: async (req, res) => {
        try {
            const { paymentId } = req.params;

            const result = await paymentService.releaseFunds(paymentId, req.user.id);

            res.json({
                success: true,
                message: 'Funds released to worker wallet successfully',
                payment: result
            });
        } catch (error) {
            console.error('Release Funds Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * @desc    Get User Payment History
     * @route   GET /api/payments/history
     * @access  Private
     */
    getHistory: async (req, res) => {
        try {
            const history = await Payment.find({
                $or: [{ employer: req.user.id }, { worker: req.user.id }]
            })
                .populate('job', 'title')
                .populate('employer', 'name')
                .populate('worker', 'name')
                .sort({ createdAt: -1 });

            res.json({ success: true, history });
        } catch (error) {
            console.error('Get History Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = paymentController;
