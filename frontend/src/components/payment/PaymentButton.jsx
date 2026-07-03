import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';
import { toast } from 'react-hot-toast';

const PaymentButton = ({ jobId, workerId, amount, onPaymentSuccess }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Order on Backend
            const { order, paymentId } = await paymentService.createOrder(jobId, workerId, amount);

            // 2. Simulate secure escrow payment processing
            setTimeout(async () => {
                try {
                    await paymentService.confirmMockPayment(paymentId);
                    toast.success("Demo Mode: Payment Successful! Funds held in escrow.");
                    if (onPaymentSuccess) onPaymentSuccess({ razorpay_payment_id: 'pay_mock_' + Date.now() }, paymentId);
                } catch (err) {
                    toast.error(err);
                } finally {
                    setLoading(false);
                }
            }, 800);

        } catch (error) {
            console.error('Payment Initiation Error:', error);
            toast.error(error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark shadow-md'}`}
        >
            <span>{loading ? 'Initiating...' : `Pay ₹${amount} to Escrow`}</span>
            <span className="block text-[10px] mt-1 opacity-80">Money held securely by DayCraft until completion</span>
        </button>
    );
};

export default PaymentButton;
