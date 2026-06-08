import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import paymentService from '../services/paymentService';
import { toast } from 'react-hot-toast';
import { 
    FiArrowUpRight, 
    FiArrowDownLeft, 
    FiClock, 
    FiCheckCircle, 
    FiPlus, 
    FiShield, 
    FiAlertCircle, 
    FiX 
} from 'react-icons/fi';
import { BsWallet2 } from 'react-icons/bs';
import './Wallet.css';

const Wallet = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    // Modals state
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [addFundsAmount, setAddFundsAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [upiId, setUpiId] = useState(user?.phone ? `${user.phone}@ybl` : 'gowsi@paytm');
    const [bankDetails, setBankDetails] = useState({
        accountNo: '•••• •••• 5678',
        ifsc: 'SBIN0001234'
    });

    // Local simulations for premium interactive dashboard experience
    const [simulatedBalanceOffset, setSimulatedBalanceOffset] = useState(0);
    const [simulatedTransactions, setSimulatedTransactions] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await paymentService.getHistory();
            setHistory(data.history || []);
        } catch (error) {
            toast.error(error?.message || error || 'Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    // Computations
    const currentAvailableBalance = Math.max(0, (user?.walletBalance || 0) + simulatedBalanceOffset);

    // Calculate Pending & Escrowed dynamically from DB payments
    let pendingBalance = 0;
    let escrowedBalance = 0;

    history.forEach(tx => {
        const isUserWorker = tx.worker?._id === user?.id || tx.worker === user?.id;
        if (isUserWorker) {
            if (tx.status === 'pending') {
                pendingBalance += tx.amount;
            } else if (tx.status === 'escrowed') {
                escrowedBalance += tx.amount;
            }
        }
    });

    // Combine real payment history and simulated local transactions
    const combinedHistory = [...simulatedTransactions, ...history];

    const filteredHistory = combinedHistory.filter(tx => {
        const isUserWorker = tx.worker?._id === user?.id || tx.worker === user?.id;
        const isUserEmployer = tx.employer?._id === user?.id || tx.employer === user?.id;

        if (activeTab === 'earnings') {
            return isUserWorker && (tx.status === 'released' || tx.status === 'escrowed');
        }
        if (activeTab === 'payouts') {
            return isUserEmployer || (tx.isSimulated && tx.employer?._id === user?.id);
        }
        if (activeTab === 'escrow') {
            return tx.status === 'escrowed';
        }
        return true; // 'all'
    });

    const handleWithdrawSubmit = (e) => {
        e.preventDefault();
        const amt = parseFloat(withdrawAmount);

        if (isNaN(amt) || amt <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }

        if (amt > currentAvailableBalance) {
            toast.error('Insufficient funds in your available balance.');
            return;
        }

        if (selectedMethod === 'upi' && !upiId.trim()) {
            toast.error('Please enter a valid UPI ID.');
            return;
        }

        if (selectedMethod === 'bank' && (!bankDetails.accountNo.trim() || !bankDetails.ifsc.trim())) {
            toast.error('Please enter valid Bank details.');
            return;
        }

        // Deduct simulated balance & record transaction
        setSimulatedBalanceOffset(prev => prev - amt);
        const newTx = {
            _id: 'sim_withdraw_' + Date.now(),
            job: { title: `Withdrawal via ${selectedMethod.toUpperCase()}` },
            worker: { _id: 'destination_account', name: selectedMethod === 'upi' ? upiId : 'Bank Account' },
            employer: { _id: user?.id || 'current_user', name: user?.name || 'Me' },
            amount: amt,
            status: 'released',
            createdAt: new Date().toISOString(),
            isSimulated: true
        };

        setSimulatedTransactions(prev => [newTx, ...prev]);
        toast.success(`Withdrawal of ₹${amt} initiated successfully!`);
        setIsWithdrawOpen(false);
        setWithdrawAmount('');
    };

    const handleAddFundsSubmit = (e) => {
        e.preventDefault();
        const amt = parseFloat(addFundsAmount);

        if (isNaN(amt) || amt <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }

        // Credit simulated balance & record transaction
        setSimulatedBalanceOffset(prev => prev + amt);
        const newTx = {
            _id: 'sim_deposit_' + Date.now(),
            job: { title: 'Wallet Top-up' },
            worker: { _id: user?.id || 'current_user', name: user?.name || 'Me' },
            employer: { _id: 'deposit_source', name: 'Razorpay Payment Gateway' },
            amount: amt,
            status: 'released',
            createdAt: new Date().toISOString(),
            isSimulated: true
        };

        setSimulatedTransactions(prev => [newTx, ...prev]);
        toast.success(`₹${amt} added to your wallet successfully!`);
        setIsAddFundsOpen(false);
        setAddFundsAmount('');
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'released': return 'tx-status-pill--released';
            case 'escrowed': return 'tx-status-pill--escrowed';
            case 'refunded': return 'tx-status-pill--refunded';
            default: return '';
        }
    };

    return (
        <div className="wallet-page">
            <div className="wallet-container">
                
                {/* Header */}
                <div className="wallet-header">
                    <div>
                        <h1 className="wallet-title">
                            <BsWallet2 className="wallet-title-icon" /> {language === 'en' ? 'My Wallet' : 'என் பணய்பை'}
                        </h1>
                        <p className="wallet-subtitle">
                            {language === 'en' ? 'Secure financial portal and escrow ledger' : 'பாதுகாப்பான நிதி தளம் மற்றும் எஸ்க்ரோ செலவு பட்டி'}
                        </p>
                    </div>
                </div>

                {/* Financial Grid */}
                <div className="financial-grid">
                    
                    {/* Primary Available Balance Card */}
                    <div className="balance-card-primary">
                        <div className="balance-card-glow"></div>
                        <div className="balance-card-header">
                            <span>{language === 'en' ? 'Available Balance' : 'கிடைக்க்கும் இருப்ி'}</span>
                            <div className="escrow-shield-badge">
                                <FiShield size={10} /> {language === 'en' ? 'Escrow Secured' : 'எஸ்க்ரோ பாதுகாப்பு'}
                            </div>
                        </div>
                        <div className="balance-card-amount">
                            <p className="balance-label">{language === 'en' ? 'Total Ready Funds' : 'மொத்த கிடைப்பளவு தொகை'}</p>
                            <h2 className="balance-value-large">₹{currentAvailableBalance.toLocaleString()}</h2>
                        </div>
                        <div className="balance-card-footer">
                            <button className="btn-white-premium" onClick={() => setIsWithdrawOpen(true)}>
                                <FiArrowUpRight /> {language === 'en' ? 'Withdraw Funds' : 'பணம் எடு'}
                            </button>
                            <button className="btn-outline-white-premium" onClick={() => setIsAddFundsOpen(true)}>
                                <FiPlus /> {language === 'en' ? 'Add Funds' : 'பணம் சேர்'}
                            </button>
                        </div>
                    </div>

                    {/* Secondary Breakdowns Card */}
                    <div className="balance-breakdown-card">
                        <div className="breakdown-row-grid">
                            <div className="breakdown-box">
                                <span className="breakdown-label">
                                    {language === 'en' ? 'Pending' : 'நிலுவில்'} <FiClock className="breakdown-icon-pending" />
                                </span>
                                <div className="breakdown-val">₹{pendingBalance.toLocaleString()}</div>
                            </div>
                            <div className="breakdown-box">
                                <span className="breakdown-label">
                                    {language === 'en' ? 'In Escrow' : 'எஸ்க்ரோவில்'} <FiShield className="breakdown-icon-escrow" />
                                </span>
                                <div className="breakdown-val">₹{escrowedBalance.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="breakdown-card-footer">
                            <FiCheckCircle className="breakdown-card-footer-icon" />
                            <span>{language === 'en' ? 'Funds held in secure digital escrow vaults.' : 'பணம் பாதுகாப்பான எஸ்க்ரோ கல்வில் பணம் வைக்கப்பட்டுள்ளது.'}</span>
                        </div>
                    </div>

                </div>

                {/* Main Two-Column Layout */}
                <div className="wallet-main-layout">
                    
                    {/* Left Column: Transaction Ledger */}
                    <div className="transaction-panel">
                        <div className="transaction-panel-header">
                            <h3>{language === 'en' ? 'Transaction History' : 'பரிவர்த்தனை வரலாறு'}</h3>
                            <button onClick={fetchHistory} className="refresh-button">
                                <FiClock className="refresh-button-icon" /> {language === 'en' ? 'Refresh' : 'புதுப்பி'}
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="transaction-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                {language === 'en' ? 'All Transactions' : 'அனைத்தும்'}
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('earnings')}
                            >
                                {language === 'en' ? 'Earnings' : 'வருமானம்'}
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('payouts')}
                            >
                                {language === 'en' ? 'Payouts' : 'பேமெண்டுகள்'}
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'escrow' ? 'active' : ''}`}
                                onClick={() => setActiveTab('escrow')}
                            >
                                {language === 'en' ? 'Escrowed' : 'எஸ்க்ரோ'}
                            </button>
                        </div>

                        {/* Transaction List */}
                        <div className="transactions-list">
                            {loading ? (
                                <div className="empty-tx-state">
                                    <div className="empty-tx-icon"><FiClock /></div>
                                    <h4>{language === 'en' ? 'Loading transactions...' : 'பரிவர்த்தனைகளை ஏற்றுகிறது...'}</h4>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="empty-tx-state">
                                    <div className="empty-tx-icon"><FiAlertCircle /></div>
                                    <h4>{language === 'en' ? 'No matching transactions' : 'பொருத்தமான பரிவர்த்தனைகள் இல்லை'}</h4>
                                    <p>{language === 'en' ? 'Your ledger records will be displayed here.' : 'உங்கள் கணக்கு பதிவுகள் இங்கே காட்டப்படும்.'}</p>
                                </div>
                            ) : (
                                filteredHistory.map((tx) => {
                                    // Check if transaction is incoming (Credit)
                                    // Simulated incoming deposit has user as worker
                                    const isIncoming = tx.worker?._id === user?.id || tx.worker === user?.id;
                                    return (
                                        <div key={tx._id} className="transaction-card-row">
                                            <div className="tx-details-wrap">
                                                <div className={`tx-type-icon ${isIncoming ? 'tx-type-icon--incoming' : 'tx-type-icon--outgoing'}`}>
                                                    {isIncoming ? <FiArrowDownLeft size={20} /> : <FiArrowUpRight size={20} />}
                                                </div>
                                                <div className="tx-info">
                                                    <h4>{tx.job?.title || 'Payment Transaction'}</h4>
                                                    <p>
                                                        {isIncoming 
                                                            ? `${language === 'en' ? 'From' : 'இருந்து'}: ${tx.employer?.name || 'DayCraft Client'}` 
                                                            : `${language === 'en' ? 'To' : 'க்கு'}: ${tx.worker?.name || 'Payout Account'}`
                                                        } • {new Date(tx.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="tx-financials">
                                                <div className={`tx-amount ${isIncoming ? 'income' : 'expense'}`}>
                                                    {isIncoming ? '+' : '-'}₹{tx.amount}
                                                </div>
                                                <span className={`tx-status-pill ${getStatusStyle(tx.status)}`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column: Escrow Steps & Payout accounts */}
                    <div>
                        
                        {/* Escrow Timeline */}
                        <div className="escrow-info-panel">
                            <h3><FiShield className="escrow-info-panel-icon" /> {language === 'en' ? 'How Escrow Works' : 'எஸ்க்ரோ எவ்வாறு செயல்படுகிறது'}</h3>
                            <p className="sub">{language === 'en' ? 'DayCraft escrow protocol details' : 'டேக்ராப்ட் எஸ்க்ரோ விவரங்கள்'}</p>
                            <div className="escrow-steps-timeline">
                                <div className="escrow-timeline-step">
                                    <div className="step-num-icon">1</div>
                                    <div className="step-details">
                                        <h4>{language === 'en' ? 'Employer Deposits Funds' : 'முதலாளி பணம் சேர்கிறார்'}</h4>
                                        <p>{language === 'en' ? 'Payment is deposited into digital escrow when the job commences.' : 'வேலை தொடங்கும்போது பணம் எஸ்க்ரோவில் ஸெலுத்தப்படுகிறது.'}</p>
                                    </div>
                                </div>
                                <div className="escrow-timeline-step">
                                    <div className="step-num-icon">2</div>
                                    <div className="step-details">
                                        <h4>{language === 'en' ? 'Worker Delivers Work' : 'தொழிலாளர் வேலை முடிக்கிறார்'}</h4>
                                        <p>{language === 'en' ? 'Worker completes all designated duties securely and files validation requests.' : 'தொழிலாளர் அனைத்து பணிகளை பாதுகாப்பாக முடித்து சரிபார்ப்பு கோரிக்கை சமர்ப்பிக்கிறார்.'}</p>
                                    </div>
                                </div>
                                <div className="escrow-timeline-step">
                                    <div className="step-num-icon">3</div>
                                    <div className="step-details">
                                        <h4>{language === 'en' ? 'Funds Are Released' : 'பணம் விடுவிக்கப்படுகிறது'}</h4>
                                        <p>{language === 'en' ? 'Once client approves, escrow automatically credits the worker\'s available balance.' : 'முதலாளி ஒப்புக்கோள்ளலும் பணம் தொழிலாளரின் கிடைப்பளவு இருப்பிக்கு சேர்க்கப்படும்.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connected Payment Methods */}
                        <div className="sidebar-payment-methods">
                            <h3>{language === 'en' ? 'Payout Options' : 'பேமெண்டு விருப்பங்கள்'}</h3>
                            <div className="payment-method-card">
                                <div className="method-details">
                                    <h5>{language === 'en' ? 'UPI Direct Link' : 'UPI நேரடி இணைப்பு'}</h5>
                                    <p>{upiId}</p>
                                </div>
                                <span className="primary-badge">{language === 'en' ? 'Primary' : 'முதன்மை'}</span>
                            </div>
                            <div className="payment-method-card">
                                <div className="method-details">
                                    <h5>{language === 'en' ? 'Bank Deposit' : 'வங்கி வைப்பு'}</h5>
                                    <p>A/C No: {bankDetails.accountNo}</p>
                                </div>
                                <span className="primary-badge">{language === 'en' ? 'Active' : 'செயலில்'}</span>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            {/* Withdraw Modal Overlay */}
            {isWithdrawOpen && (
                <div className="payout-drawer-overlay" onClick={() => setIsWithdrawOpen(false)}>
                    <div className="payout-drawer" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3>{language === 'en' ? 'Withdraw Funds' : 'பணம் எடு'}</h3>
                            <button onClick={() => setIsWithdrawOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleWithdrawSubmit}>
                            <div className="payout-options-list">
                                <div 
                                    className={`payout-option-row ${selectedMethod === 'upi' ? 'selected' : ''}`}
                                    onClick={() => setSelectedMethod('upi')}
                                >
                                    <input 
                                        type="radio" 
                                        checked={selectedMethod === 'upi'} 
                                        onChange={() => setSelectedMethod('upi')} 
                                    />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '14px' }}>{language === 'en' ? 'UPI Transfer' : 'UPI மூலம்'}</strong>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>{language === 'en' ? 'Instant execution to UPI ID' : 'UPI IDக்கு உடனடி அனுப்பு'}</span>
                                    </div>
                                </div>
                                <div 
                                    className={`payout-option-row ${selectedMethod === 'bank' ? 'selected' : ''}`}
                                    onClick={() => setSelectedMethod('bank')}
                                >
                                    <input 
                                        type="radio" 
                                        checked={selectedMethod === 'bank'} 
                                        onChange={() => setSelectedMethod('bank')} 
                                    />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '14px' }}>{language === 'en' ? 'Bank Transfer (NEFT)' : 'வங்கி மாற்றம் (NEFT)'}</strong>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>{language === 'en' ? 'Processing takes up to 2 hours' : 'செயலாக்கம் 2 மணி நேரம் ஆகலாம்'}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedMethod === 'upi' ? (
                                <div className="payout-input-group">
                                    <label>{language === 'en' ? 'UPI ID Address' : 'UPI ID முகவரி'}</label>
                                    <input 
                                        type="text" 
                                        className="payout-input-field" 
                                        style={{ paddingLeft: '16px', fontSize: '15px' }}
                                        value={upiId} 
                                        onChange={(e) => setUpiId(e.target.value)} 
                                        placeholder="e.g. gowsi@upi"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="payout-input-group">
                                        <label>{language === 'en' ? 'Account Number' : 'கணக்கு எண்'}</label>
                                        <input 
                                            type="text" 
                                            className="payout-input-field" 
                                            style={{ paddingLeft: '16px', fontSize: '15px' }}
                                            value={bankDetails.accountNo} 
                                            onChange={(e) => setBankDetails({ ...bankDetails, accountNo: e.target.value })} 
                                        />
                                    </div>
                                    <div className="payout-input-group" style={{ marginTop: '12px' }}>
                                        <label>{language === 'en' ? 'IFSC Code' : 'IFSC கோட்'}</label>
                                        <input 
                                            type="text" 
                                            className="payout-input-field" 
                                            style={{ paddingLeft: '16px', fontSize: '15px' }}
                                            value={bankDetails.ifsc} 
                                            onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })} 
                                        />
                                    </div>
                                </>
                            )}

                            <div className="payout-input-group">
                                <label>{language === 'en' ? 'Amount to Withdraw (₹)' : 'எடுக்க வேண்டிய தொகை (₹)'}</label>
                                <div className="payout-input-wrap">
                                    <span className="payout-input-symbol">₹</span>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max={currentAvailableBalance}
                                        className="payout-input-field" 
                                        value={withdrawAmount} 
                                        onChange={(e) => setWithdrawAmount(e.target.value)} 
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                    {language === 'en' ? 'Available' : 'கிடைப்பளவு'}: ₹{currentAvailableBalance.toLocaleString()}
                                </span>
                            </div>

                            <div className="payout-drawer-actions" style={{ marginTop: '24px' }}>
                                <button type="button" className="btn-outline-white-premium" style={{ color: '#0f172a', borderColor: '#cbd5e1' }} onClick={() => setIsWithdrawOpen(false)}>
                                    {language === 'en' ? 'Cancel' : 'ரத்து'}
                                </button>
                                <button type="submit" className="btn-white-premium" style={{ background: '#0f172a', color: '#fff' }}>
                                    {language === 'en' ? 'Withdraw Funds' : 'பணம் எடு'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Funds Modal Overlay */}
            {isAddFundsOpen && (
                <div className="payout-drawer-overlay" onClick={() => setIsAddFundsOpen(false)}>
                    <div className="payout-drawer" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3>{language === 'en' ? 'Add Funds' : 'பணம் சேர்'}</h3>
                            <button onClick={() => setIsAddFundsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleAddFundsSubmit}>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                                {language === 'en' ? 'Add funds instantly using credit/debit card, netbanking or UPI via Razorpay secure checkout.' : 'கிரெடிட்/டெபிட் கார்ட், நெட்பாங்கிங் அல்லது UPI மூலம் ரேசர்பே பாதுகாப்பான செக்ச்சில் உடனடியாக பணம் சேர்க்கவும்.'}
                            </p>
                            
                            <div className="payout-input-group">
                                <label>{language === 'en' ? 'Deposit Amount (₹)' : 'ஜமா தொகை (₹)'}</label>
                                <div className="payout-input-wrap">
                                    <span className="payout-input-symbol">₹</span>
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="payout-input-field" 
                                        value={addFundsAmount} 
                                        onChange={(e) => setAddFundsAmount(e.target.value)} 
                                        placeholder="500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="payout-drawer-actions" style={{ marginTop: '24px' }}>
                                <button type="button" className="btn-outline-white-premium" style={{ color: '#0f172a', borderColor: '#cbd5e1' }} onClick={() => setIsAddFundsOpen(false)}>
                                    {language === 'en' ? 'Cancel' : 'ரத்து'}
                                </button>
                                <button type="submit" className="btn-white-premium" style={{ background: '#0f172a', color: '#fff' }}>
                                    {language === 'en' ? 'Secure Deposit' : 'பாதுகாப்பான ஜமா'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Wallet;
