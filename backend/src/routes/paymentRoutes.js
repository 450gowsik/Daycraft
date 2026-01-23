const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Webhook is public (Razorpay calls it)
// Note: In real production, we'd use body-parser raw for signature verification
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-order', paymentController.createOrder);
router.post('/release/:paymentId', paymentController.releaseFunds);
router.get('/history', paymentController.getHistory);

module.exports = router;
