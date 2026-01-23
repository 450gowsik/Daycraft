const mongoose = require('mongoose');
const User = require('./src/models/User');
const Job = require('./src/models/Job');
const Payment = require('./src/models/Payment');
const paymentService = require('./src/services/paymentService');
const { connectDB } = require('./src/config/db');

async function runPaymentTest() {
    const suffix = Date.now();
    console.log(`--- Payment Escrow Verification (ID: ${suffix}) ---`);
    await connectDB();

    try {
        // 1. Setup Test Data
        console.log('Setting up test accounts...');
        const employer = await User.create({
            name: 'Test Employer ' + suffix,
            email: `emp_${suffix}@test.com`,
            role: 'employer',
            password: 'password123'
        });

        const worker = await User.create({
            name: 'Test Worker ' + suffix,
            email: `wrk_${suffix}@test.com`,
            role: 'worker',
            password: 'password123'
        });

        const job = await Job.create({
            title: { en: 'Test Escrow Job' },
            description: { en: 'Test Description' },
            employer: employer._id,
            hiredWorkers: [worker._id],
            status: 'in-progress',
            wage: 500,
            location: 'Test Location',
            category: 'other'
        });

        console.log(`Employer: ${employer.name}, Worker: ${worker.name}, Job: ${job.title}`);

        // 2. Simulate Order Creation
        console.log('\nStep 1: Creating Razorpay Order...');
        const { order, paymentId } = await paymentService.createOrder(500, job._id, employer._id, worker._id);
        console.log(`Order Created: ${order.id}, Internal Payment ID: ${paymentId}`);

        let payment = await Payment.findById(paymentId);
        console.log(`Initial Status: ${payment.status}`);

        // 3. Simulate Webhook (Paid)
        console.log('\nStep 2: Simulating Webhook Payment Success...');
        await paymentService.handlePaymentSuccess(order.id, 'pay_mock_' + suffix, 'sig_mock_' + suffix);
        payment = await Payment.findById(paymentId);
        console.log(`Status after Webhook: ${payment.status} (Locked At: ${payment.escrowLockedAt})`);

        // 4. Release Funds
        console.log('\nStep 3: Releasing Funds to Worker...');
        await paymentService.releaseFunds(paymentId, employer._id);
        payment = await Payment.findById(paymentId);
        const updatedWorker = await User.findById(worker._id);

        console.log(`Final Payment Status: ${payment.status}`);
        console.log(`Final Worker Wallet Balance: ₹${updatedWorker.walletBalance}`);

        if (payment.status === 'released' && updatedWorker.walletBalance === 500) {
            console.log('\n✅ VERIFICATION SUCCESSFUL: Funds moved correctly from Employer to Worker Wallet via Escrow.');
        } else {
            console.log('\n❌ VERIFICATION FAILED: Final states do not match expected outcomes.');
        }

    } catch (err) {
        console.error('\n❌ TEST ERROR:', err.message);
    } finally {
        console.log('\nCleaning up...');
        await User.deleteMany({ email: /test\.com$/ });
        await Job.deleteMany({ title: 'Test Escrow Job' });
        await Payment.deleteMany({ amount: 500 });
        mongoose.connection.close();
    }
}

runPaymentTest();
