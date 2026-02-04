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

            // 2. Configure Razorpay Options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', // Needs to be in .env
                amount: order.amount,
                currency: order.currency,
                name: "DayCraft",
                description: "Escrow Payment for Job",
                order_id: order.id,
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                theme: {
                    color: "#14a800"
                },
                handler: function (response) {
                    // This is called after success
                    toast.success("Payment Received! Funds are now securely held in escrow.");
                    if (onPaymentSuccess) onPaymentSuccess(response, paymentId);
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error("Payment Failed: " + response.error.description);
                setLoading(false);
            });
            rzp.open();

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
