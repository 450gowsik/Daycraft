import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import paymentService from '../services/paymentService';
import { toast } from 'react-hot-toast';
import { FiArrowUpRight, FiArrowDownLeft, FiClock, FiCheckCircle } from 'react-icons/fi';
import { BsWallet2 } from 'react-icons/bs';

const Wallet = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await paymentService.getHistory();
            setHistory(data.history);
        } catch (error) {
            toast.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'released': return 'bg-green-100 text-green-700';
            case 'escrowed': return 'bg-blue-100 text-blue-700';
            case 'refunded': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                <BsWallet2 className="mr-3 text-primary" /> My Wallet
            </h1>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-8 text-white shadow-xl mb-12">
                <p className="text-primary-light text-sm font-medium uppercase tracking-wider mb-2">Available Balance</p>
                <h2 className="text-5xl font-extrabold mb-4">₹{user?.walletBalance || 0}</h2>
                <div className="flex items-center text-sm opacity-90">
                    <FiCheckCircle className="mr-2" />
                    <span>Verified & Secured by DayCraft Escrow</span>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Transaction History</h3>
                    <button onClick={fetchHistory} className="text-sm text-primary hover:underline">Refresh</button>
                </div>

                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading transactions...</div>
                    ) : history.length === 0 ? (
                        <div className="p-12 text-center">
                            <FiClock className="mx-auto text-4xl text-gray-200 mb-4" />
                            <p className="text-gray-500 font-medium">No transactions yet.</p>
                            <p className="text-gray-400 text-sm">Payments for your jobs will appear here.</p>
                        </div>
                    ) : (
                        history.map((tx) => (
                            <div key={tx._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-full mr-4 ${tx.worker._id === user?.id ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {tx.worker._id === user?.id ? <FiArrowDownLeft size={20} /> : <FiArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{tx.job.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {tx.worker._id === user?.id ? `From: ${tx.employer.name}` : `To: ${tx.worker.name}`} • {new Date(tx.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-lg ${tx.worker._id === user?.id ? 'text-green-600' : 'text-gray-900'}`}>
                                        {tx.worker._id === user?.id ? '+' : '-'}₹{tx.amount}
                                    </p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${getStatusStyle(tx.status)}`}>
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                    <FiCheckCircle className="mr-2" /> How Escrow Works
                </h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                    When an employer pays for a job, DayCraft holds the funds securely. The money is only transferred to the worker's wallet once the employer confirms the work is complete. This ensures safety for both parties.
                </p>
            </div>
        </div>
    );
};

export default Wallet;
