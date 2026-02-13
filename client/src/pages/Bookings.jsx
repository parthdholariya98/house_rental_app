import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, Calendar, MessageSquare, Home, CreditCard, Lock, Loader2, X, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppBot from '../components/WhatsAppBot';


const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');


    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/bookings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load bookings');
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/bookings/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Booking ${status}`);
            fetchBookings();
        } catch (err) {
            toast.error('Error updating status');
        }
    };

    const handleDepositChange = async (id, status, amount) => {
        try {
            await axios.put(`http://localhost:5000/api/bookings/${id}/deposit`,
                { depositStatus: status, depositAmount: amount },
                {
                    headers: { Authorization: `Bearer ${token}` }
                });
            toast.success(`Deposit updated`);
            fetchBookings();
        } catch (err) {
            toast.error('Error updating deposit');
        }
    };

    const handlePayDeposit = async () => {
        if (!selectedBookingForPayment) return;

        setIsProcessingPayment(true);
        try {
            // 1. Create Order in Backend
            const orderRes = await axios.post('http://localhost:5000/api/payments/razorpay/order',
                { amount: selectedBookingForPayment.depositAmount, bookingId: selectedBookingForPayment._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { amount, id: order_id, currency } = orderRes.data;

            // 2. Open Razorpay Checkout
            const options = {
                key: "rzp_test_YOUR_KEY_HERE", // Ideally fetch from backend or env
                amount: amount,
                currency: currency,
                name: "RentalHub",
                description: `Deposit for ${selectedBookingForPayment.property?.title}`,
                order_id: order_id,
                handler: async (response) => {
                    try {
                        const verifyRes = await axios.post('http://localhost:5000/api/payments/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: selectedBookingForPayment._id,
                            amount: selectedBookingForPayment.depositAmount
                        }, { headers: { Authorization: `Bearer ${token}` } });

                        if (verifyRes.data.success) {
                            setPaymentSuccess(true);
                            toast.success('Payment Verified & Completed!');
                            fetchBookings();
                        }
                    } catch (err) {
                        toast.error("Signature Verification Failed! Fake Payment Detected.");
                    }
                },
                prefill: {
                    name: JSON.parse(localStorage.getItem('userInfo'))?.name,
                    email: JSON.parse(localStorage.getItem('userInfo'))?.email,
                },
                theme: { color: "#4f46e5" },
                modal: {
                    ondismiss: () => setIsProcessingPayment(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            toast.error('Payment initiation failed');
            setIsProcessingPayment(false);
        }
    };

    const handlePaymentComplete = () => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        setSelectedBookingForPayment(null);
        setPaymentMethod('');
    };

    const handleCancelBooking = async () => {
        if (!selectedBookingForCancel) return;

        try {
            await axios.put(
                `http://localhost:5000/api/bookings/${selectedBookingForCancel._id}/cancel`,
                { reason: cancellationReason || 'No reason provided' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Booking cancelled successfully');
            setShowCancelModal(false);
            setSelectedBookingForCancel(null);
            setCancellationReason('');
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel booking');
        }
    };


    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100"><CheckCircle size={10} /> Approved</span>;
            case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-100"><XCircle size={10} /> Rejected</span>;
            case 'cancelled': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-50 text-gray-700 border border-gray-100"><XCircle size={10} /> Cancelled</span>;
            case 'paid': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100"><CheckCircle size={10} /> Paid</span>;
            case 'paid_confirm_pending': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-50 text-brand-700 border border-brand-100 animate-pulse"><Clock size={10} /> Verifying Payment</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-50 text-yellow-700 border border-yellow-100"><Clock size={10} /> Pending</span>;

        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    {role === 'owner' ? 'Booking Requests' : (role === 'broker' ? 'Assigned Bookings' : 'My Bookings')}
                </h1>

            </div>

            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {bookings.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            No bookings found.
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <li key={booking._id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-brand-50 p-3 rounded-xl hidden sm:block">
                                            <Home className="text-brand-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{booking.property?.title}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <MapPinSmall /> {booking.property?.location}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    {new Date(booking.visitDate).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MessageSquare size={16} className="text-gray-400" />
                                                    {role === 'owner' ? `Tenant: ${booking.tenant?.name}` : `Message: ${booking.message}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        {getStatusBadge(booking.status)}

                                        <div className="mt-2 text-sm text-right">
                                            {booking.property?.posterModel === 'Broker' && (
                                                <>
                                                    <p className="text-gray-500">Deposit: <span className="font-semibold text-gray-900 font-bold">₹{booking.depositAmount || 0}</span></p>
                                                    <div className="mt-1">{getStatusBadge(booking.depositStatus)}</div>
                                                </>
                                            )}
                                        </div>


                                        {/* Actions for User */}
                                        {/* Actions for User - Broker Logic */}
                                        {role === 'user' && booking.property?.posterModel === 'Broker' && booking.status === 'approved' && booking.depositStatus !== 'paid' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedBookingForPayment(booking);
                                                    setShowPaymentModal(true);
                                                    setPaymentSuccess(false);
                                                }}
                                                className="mt-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center gap-2"
                                            >
                                                <CreditCard size={14} /> Confirm Visit & Pay Deposit
                                            </button>
                                        )}

                                        {/* User - Awaiting Broker Oversight */}
                                        {role === 'user' && booking.status === 'paid_confirm_pending' && (
                                            <div className="flex flex-col items-end mt-2">
                                                <div className="bg-brand-50 px-4 py-2 rounded-xl border border-brand-100 text-[10px] text-brand-600 font-bold uppercase animate-pulse">
                                                    Verifying Transaction
                                                </div>
                                                <p className="text-[9px] text-gray-400 mt-1 italic">Location will be sent once broker confirms</p>
                                            </div>
                                        )}

                                        {/* User - Slot Confirmed (Broker) */}
                                        {role === 'user' && booking.property?.posterModel === 'Broker' && booking.status === 'paid' && (
                                            <div className="flex flex-col items-end mt-2">
                                                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-200">
                                                    Slot Confirmed
                                                </div>
                                                <p className="text-[9px] text-gray-400 mt-1 italic">Check your email for location & details</p>
                                            </div>
                                        )}

                                        {/* User - Owner Direct confirmation */}
                                        {role === 'user' && booking.property?.posterModel === 'Owner' && (
                                            <div className="mt-2 text-right">
                                                {booking.status === 'approved' ? (
                                                    <div className="flex flex-col items-end">
                                                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                            Slot Ready!
                                                        </div>
                                                        <p className="text-[9px] text-gray-400 mt-1 italic">Location details sent to your email</p>
                                                    </div>
                                                ) : booking.status === 'pending' ? (
                                                    <div className="flex flex-col items-end">
                                                        <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 italic text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                            Awaiting Owner Approval
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}

                                        {/* User Cancel Button */}
                                        {role === 'user' && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedBookingForCancel(booking);
                                                    setShowCancelModal(true);
                                                }}
                                                className="mt-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition flex items-center gap-2"
                                            >
                                                <XCircle size={14} /> Cancel Booking
                                            </button>
                                        )}


                                        {/* Actions for Owner */}
                                        {role === 'owner' && booking.status === 'pending' && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => handleStatusChange(booking._id, 'approved')}
                                                    className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(booking._id, 'rejected')}
                                                    className="px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {role === 'owner' && booking.status === 'approved' && (
                                            <div className="mt-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                Slot Confirmed
                                            </div>
                                        )}

                                        {/* Actions for Broker */}
                                        {/* Actions for Broker - Verification Flow */}
                                        {role === 'broker' && booking.status === 'paid_confirm_pending' && (
                                            <div className="flex flex-col items-end gap-2">
                                                <button
                                                    onClick={() => handleDepositChange(booking._id, 'paid', booking.depositAmount)}
                                                    className="mt-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-100"
                                                >
                                                    Confirm Final Slot
                                                </button>
                                                <p className="text-[9px] text-gray-400 italic">User paid via dashboard. Mark as local confirm.</p>
                                            </div>
                                        )}
                                        {role === 'broker' && (booking.status === 'approved' || booking.status === 'paid') && (
                                            <div className="mt-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-200">
                                                {booking.status === 'paid' ? 'Visit Reserved & Paid' : 'Approved - Awaiting Payment'}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Payment Modal for Bookings Page */}
            <AnimatePresence>
                {showPaymentModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="bg-gray-900 p-8 text-white relative">
                                {!isProcessingPayment && (
                                    <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={18} /></button>
                                )}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-brand-500 p-3 rounded-2xl"><CreditCard size={28} /></div>
                                    <div>
                                        <h2 className="text-xl font-bold italic">Secure Checkout</h2>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Transaction ID: TXN-{Math.floor(Math.random() * 999999)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {paymentSuccess ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-6">
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                            <CheckCircle size={40} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">Payment Success!</h3>
                                            <p className="text-sm text-gray-500 mt-2">Your visit slot for <b>{selectedBookingForPayment?.property?.title}</b> is now being confirmed by the broker.</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Amount Paid</span>
                                            <span className="text-lg font-black text-brand-600">₹{selectedBookingForPayment?.property?.depositAmount || 0}</span>
                                        </div>
                                        <button
                                            onClick={handlePaymentComplete}
                                            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand-100 hover:bg-brand-700 transition flex items-center justify-center gap-2"
                                        >
                                            Continue to Bookings <TrendingUp size={18} />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <>
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="text-sm text-gray-500 font-medium">Deposit for:</p>
                                                <p className="text-sm text-gray-900 font-bold">{selectedBookingForPayment?.property?.title}</p>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                                <p className="text-lg font-bold text-gray-900">Total Payable</p>
                                                <p className="text-2xl font-black text-brand-600">₹{selectedBookingForPayment?.depositAmount || 0}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Select Method</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {['UPI / GPay / PhonePe', 'Debit / Credit Card', 'Net Banking'].map(method => (
                                                    <button
                                                        key={method}
                                                        onClick={() => setPaymentMethod(method)}
                                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${paymentMethod === method ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === method ? 'border-brand-500' : 'border-gray-300'}`}>
                                                            {paymentMethod === method && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                                                        </div>
                                                        <span className={`text-sm font-bold ${paymentMethod === method ? 'text-brand-700' : 'text-gray-600'}`}>{method}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-400 text-center px-4 leading-relaxed mt-4">By proceeding, you agree to secure the property with a deposit. This amount is held securely until your visit is complete.</p>
                                        </div>

                                        <button
                                            onClick={handlePayDeposit}
                                            disabled={isProcessingPayment || !paymentMethod}
                                            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand-100 flex items-center justify-center gap-3 hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessingPayment ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    Processing Transaction...
                                                </>
                                            ) : (
                                                <>Confirm & Pay Visit Deposit</>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 opacity-30 mt-4">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="mastercard" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="visa" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/UPI-Logo-vector.svg" className="h-4" alt="upi" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancel Booking Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="bg-red-600 p-8 text-white relative">
                                <button onClick={() => setShowCancelModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={18} /></button>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-white/20 p-3 rounded-2xl"><XCircle size={28} /></div>
                                    <div>
                                        <h2 className="text-xl font-bold">Cancel Booking</h2>
                                        <p className="text-red-100 text-xs font-medium uppercase tracking-wider">Property: {selectedBookingForCancel?.property?.title}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Cancellation (Optional)</label>
                                    <textarea
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        placeholder="Please provide a reason for cancellation..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        rows="4"
                                    />
                                </div>

                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <p className="text-sm text-red-800 font-medium">⚠️ Are you sure you want to cancel this booking?</p>
                                    <p className="text-xs text-red-600 mt-1">
                                        {selectedBookingForCancel?.depositStatus === 'paid'
                                            ? 'Your deposit will be refunded within 5-7 business days.'
                                            : 'This action cannot be undone.'}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                                    >
                                        Keep Booking
                                    </button>
                                    <button
                                        onClick={handleCancelBooking}
                                        className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={18} /> Confirm Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <WhatsAppBot />
        </div>

    );
};

const MapPinSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
)

export default Bookings;
