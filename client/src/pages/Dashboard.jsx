import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
    Plus, Trash2, MapPin, UploadCloud, Loader2,
    LayoutDashboard, Home, MessageSquare, ShieldCheck,
    Calendar, TrendingUp, Users, Check, X, CheckCircle, XCircle, Clock, Phone, Banknote, CreditCard, Lock
} from 'lucide-react';


import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppBot from '../components/WhatsAppBot';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [myProperties, setMyProperties] = useState([]);
    const [unverifiedProperties, setUnverifiedProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [groupedThreads, setGroupedThreads] = useState({});
    const [activeThreadId, setActiveThreadId] = useState(null);

    // Payment States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);





    const [formData, setFormData] = useState({
        title: '', description: '', location: '', price: '', type: '', deposit: '', bhk: '', amenities: ''
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalListings: 0,
        pendingApprovals: 0,
        activeBookings: 0,
        unreadMessages: 0,
        totalClients: 0
    });


    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            // Fetch Listings
            const propRes = await axios.get('http://localhost:5000/api/properties/my-properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyProperties(propRes.data);

            // Fetch Bookings
            const bookRes = await axios.get('http://localhost:5000/api/bookings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(bookRes.data);

            // Fetch Messages
            const msgRes = await axios.get('http://localhost:5000/api/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(msgRes.data);

            // Group Messages into Threads
            const threads = {};
            msgRes.data.forEach(msg => {
                const otherUser = msg.sender?._id === userId ? msg.receiver : msg.sender;
                if (!otherUser) return;

                const threadKey = `${msg.property?._id || 'general'}-${otherUser._id}`;
                if (!threads[threadKey]) {
                    threads[threadKey] = {
                        otherUser,
                        property: msg.property,
                        otherModel: msg.sender?._id === userId ? msg.receiverModel : msg.senderModel,
                        messages: []
                    };
                }
                threads[threadKey].messages.push(msg);
            });
            setGroupedThreads(threads);


            // If Admin, fetch unverified properties (Moderation Queue)
            let qLen = 0;
            if (role === 'admin') {
                const unverRes = await axios.get('http://localhost:5000/api/properties/unverified', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUnverifiedProperties(unverRes.data);
                qLen = unverRes.data.length;
            }


            // If Broker, fetch clients
            let cLen = 0;
            if (role === 'broker') {
                const clientRes = await axios.get('http://localhost:5000/api/broker/clients', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClients(clientRes.data);
                cLen = clientRes.data.length;
            }


            // Calculate Stats
            setStats({
                totalListings: propRes.data.length,
                pendingApprovals: role === 'admin' ? qLen : propRes.data.filter(p => p.status === 'pending').length,
                activeBookings: bookRes.data.filter(b => b.status === 'pending').length,
                unreadMessages: msgRes.data.filter(m => !m.isRead && m.receiver?._id === userId).length,
                totalClients: role === 'broker' ? cLen : 0
            });



        } catch (err) {
            console.error('Error fetching dashboard data', err);
        }
    };

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 5
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        files.forEach(file => data.append('images', file));


        try {
            await axios.post('http://localhost:5000/api/properties', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Property Listed! Awaiting verification.');
            setFormData({ title: '', description: '', location: 'Vadodara', price: '', type: '', deposit: '', bhk: '', amenities: '' });
            setFiles([]);
            fetchData();
            setActiveTab('listings');
        } catch (err) {
            const errorMsg = err.response?.data?.errors
                ? err.response.data.errors.join(', ')
                : (err.response?.data?.message || 'Error creating property');
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this listing?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Property removed");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/bookings/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Booking ${status}`);
            fetchData();
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
            fetchData();
        } catch (err) {
            toast.error('Error updating deposit');
        }
    };

    const handlePayDeposit = async () => {
        if (!selectedBookingForPayment || !paymentMethod) return;

        setIsProcessingPayment(true);
        try {
            // Simulated payment delay for "Process" feel
            await new Promise(resolve => setTimeout(resolve, 2000));

            await axios.post(`http://localhost:5000/api/bookings/${selectedBookingForPayment._id}/pay`,
                { paymentMethod },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPaymentSuccess(true);
            toast.success('Transaction Successful!');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment processing failed');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handlePaymentComplete = () => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        setSelectedBookingForPayment(null);
        setPaymentMethod('');
    };





    const handleVerify = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/properties/${id}/verify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Property Verified & Published!");
            fetchData();
        } catch (err) {
            toast.error("Verification failed");
        }
    };

    const handleSendMessage = async () => {
        if (!replyContent.trim()) return toast.warn("Please enter a message");

        try {
            const target = activeThreadId ? groupedThreads[activeThreadId] : null;
            const otherUser = target ? target.otherUser : (selectedMessage.sender?._id === userId ? selectedMessage.receiver : selectedMessage.sender);
            const otherModel = target ? target.otherModel : (selectedMessage.sender?._id === userId ? selectedMessage.receiverModel : selectedMessage.senderModel);
            const propId = target ? target.property?._id : selectedMessage.property?._id;

            await axios.post('http://localhost:5000/api/messages', {
                receiverId: otherUser?._id,
                receiverModel: otherModel,
                propertyId: propId,
                content: replyContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Reply sent!');
            setShowReplyModal(false);
            setReplyContent('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error sending message');
        }
    };



    const renderOverview = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Listings" value={stats.totalListings} icon={<Home className="text-blue-600" />} color="bg-blue-50" />
                <StatCard title="Pending Requests" value={stats.activeBookings} icon={<Calendar className="text-orange-600" />} color="bg-orange-50" />
                <StatCard title="Messages" value={stats.unreadMessages} icon={<MessageSquare className="text-green-600" />} color="bg-green-50" />
                {role === 'broker' ? (
                    <StatCard title="Total Clients" value={stats.totalClients} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
                ) : (
                    <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={<ShieldCheck className="text-purple-600" />} color="bg-purple-50" />
                )}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-brand-600" size={20} />
                        Recent Performance
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                        Performance analytics visualization coming soon...
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Users className="text-brand-600" size={20} />
                        Recent Inquiries
                    </h3>
                    <div className="space-y-4">
                        {bookings.slice(0, 3).map(booking => (
                            <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-sm">{booking.tenant?.name || 'Anonymous'}</p>
                                    <p className="text-xs text-gray-500">{booking.property?.title}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                    {booking.status}
                                </span>
                            </div>
                        ))}
                        {bookings.length === 0 && <p className="text-center text-gray-400 py-10">No recent inquiries.</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderListings = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Your Managed Properties</h2>
                <button onClick={() => setActiveTab('add')} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand-500/20">
                    <Plus size={18} /> Add Property
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myProperties.map(p => (
                    <div key={p._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                        <img src={p.images[0] || 'https://via.placeholder.com/150'} className="w-24 h-24 object-cover rounded-xl" />
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h3 className="font-bold text-gray-900">{p.title}</h3>
                                <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                    {p.status === 'approved' ? <Check size={10} /> : <Clock size={10} />}
                                    {p.status}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {p.location}</p>
                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-brand-600 font-bold">₹{p.price}</span>
                                <button onClick={() => handleDelete(p._id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100"><CheckCircle size={10} /> Approved</span>;
            case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-100"><XCircle size={10} /> Rejected</span>;
            case 'paid': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100"><CheckCircle size={10} /> Paid</span>;
            case 'paid_confirm_pending': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-50 text-brand-700 border border-brand-100 animate-pulse"><Clock size={10} /> Verifying Payment</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-50 text-yellow-700 border border-yellow-100"><Clock size={10} /> Pending</span>;

        }
    };

    const renderBookings = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Manage Booking Requests</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {bookings.map((booking) => (
                        <li key={booking._id} className="p-6">
                            <div className="flex flex-col lg:flex-row justify-between gap-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-brand-600 border border-gray-100">
                                        <Home size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{booking.property?.title}</h4>
                                        <p className="text-sm text-gray-500 mb-2">{booking.property?.location}</p>
                                        <div className="flex flex-wrap gap-4 text-xs">
                                            <span className="flex items-center gap-1 text-gray-400"><Calendar size={12} /> {new Date(booking.visitDate).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1 text-gray-600 font-semibold"><Users size={12} /> {booking.tenant?.name || 'Potential Tenant'}</span>
                                            {booking.property?.posterModel === 'Broker' && (
                                                <span className="flex items-center gap-1 text-brand-600 font-bold px-2 py-0.5 bg-brand-50 rounded-md">
                                                    <Banknote size={12} /> Deposit: ₹{booking.property?.deposit || 0}
                                                </span>
                                            )}
                                        </div>

                                    </div>
                                </div>

                                <div className="flex items-center gap-4 lg:self-center">
                                    <div className="text-right mr-4">
                                        <div className="mb-2">{getStatusBadge(booking.status)}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Status</div>
                                    </div>

                                    {(role === 'owner' || role === 'broker' || role === 'admin') && booking.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleStatusChange(booking._id, 'approved')} className="bg-green-50 text-green-600 p-2 rounded-xl hover:bg-green-100 transition"><Check size={20} /></button>
                                            <button onClick={() => handleStatusChange(booking._id, 'rejected')} className="bg-red-50 text-red-600 p-2 rounded-xl hover:bg-red-100 transition"><X size={20} /></button>
                                        </div>
                                    )}

                                    {role === 'owner' && booking.status === 'approved' && (
                                        <div className="ml-2 p-2 bg-green-50 text-green-600 rounded-xl font-bold text-[10px] uppercase">
                                            Ready
                                        </div>
                                    )}


                                    {(role === 'broker' || role === 'owner') && booking.status === 'paid_confirm_pending' && (
                                        <div className="flex flex-col items-end gap-2 text-right">
                                            <button
                                                onClick={() => {
                                                    handleDepositChange(booking._id, 'paid', booking.depositAmount);
                                                }}
                                                className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 transition shadow-lg shadow-brand-100"
                                            >
                                                Confirm Final Slot
                                            </button>
                                            <p className="text-[9px] text-gray-400 italic">User paid via dashboard. Verify transaction.</p>
                                        </div>
                                    )}

                                    {role === 'broker' && booking.status === 'approved' && booking.depositStatus !== 'paid' && (
                                        <div className="flex flex-col items-end gap-2">
                                            <button
                                                onClick={() => {
                                                    const amt = prompt('Confirm Deposit Amount:', booking.depositAmount || 0);
                                                    if (amt) handleDepositChange(booking._id, 'paid', amt);
                                                }}
                                                className="bg-brand-50 text-brand-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-100 transition"
                                            >
                                                Confirm Deposit
                                            </button>
                                        </div>
                                    )}

                                    {role === 'user' && booking.status === 'paid_confirm_pending' && (
                                        <div className="flex flex-col items-center">
                                            <div className="bg-brand-50 px-4 py-2 rounded-xl border border-brand-100 text-[10px] text-brand-600 font-bold uppercase animate-pulse">
                                                Awaiting Broker Verification
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-1 italic">Email with location will arrive once confirmed</p>
                                        </div>
                                    )}


                                    {role === 'user' && booking.property?.posterModel === 'Broker' && booking.status === 'approved' && booking.depositStatus !== 'paid' && (
                                        <button
                                            onClick={() => {
                                                setSelectedBookingForPayment(booking);
                                                setShowPaymentModal(true);
                                                setPaymentSuccess(false);
                                            }}
                                            className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 flex items-center gap-2"
                                        >
                                            <CreditCard size={14} /> Confirm Visit & Pay Deposit
                                        </button>
                                    )}



                                    {role === 'user' && booking.property?.posterModel === 'Owner' && (
                                        <div className="flex flex-col items-end">
                                            {booking.status === 'approved' ? (
                                                <div className="flex flex-col items-end">
                                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                        Slot Ready!
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 mt-1 italic">Location details sent to email</p>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 italic text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                    Direct Owner Deal
                                                </div>
                                            )}
                                        </div>
                                    )}



                                </div>
                            </div>
                        </li>
                    ))}
                    {bookings.length === 0 && <div className="p-20 text-center text-gray-400 italic">No bookings found.</div>}
                </ul>
            </div>
        </div>
    );

    const renderMessages = () => {
        const threadKeys = Object.keys(groupedThreads);

        return (
            <div className="flex flex-col lg:flex-row h-[600px] bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Thread Sidebar */}
                <div className="w-full lg:w-80 border-r border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold">Conversations</h2>
                        <p className="text-xs text-gray-500 mt-1">{threadKeys.length} active threads</p>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {threadKeys.map(key => {
                            const thread = groupedThreads[key];
                            const lastMsg = thread.messages[0];
                            const isActive = activeThreadId === key;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveThreadId(key)}
                                    className={`w-full p-4 flex gap-4 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-brand-50 border-l-4 border-brand-500' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-600 flex-shrink-0">
                                        {(thread.otherUser.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="font-bold text-sm text-gray-900 truncate">{thread.otherUser.name}</p>
                                            <span className="text-[9px] text-gray-400">{new Date(lastMsg.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-brand-600 font-bold uppercase tracking-tighter mb-1 truncate">{thread.property?.title || 'General Inqury'}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1">{lastMsg.content}</p>
                                    </div>
                                </button>
                            );
                        })}
                        {threadKeys.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">No messages found.</div>}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col relative bg-gray-50/30">
                    {activeThreadId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-5 bg-white border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                                        {(groupedThreads[activeThreadId].otherUser.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{groupedThreads[activeThreadId].otherUser.name}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{groupedThreads[activeThreadId].otherModel}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedMessage(null); // Clear context to use activeThreadId
                                        setShowReplyModal(true);
                                    }}
                                    className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 transition"
                                >
                                    Send Reply
                                </button>
                            </div>

                            {/* Chat Messages History */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col-reverse">
                                {groupedThreads[activeThreadId].messages.map(msg => {
                                    const isMe = msg.sender?._id === userId;
                                    return (
                                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-100 shadow-sm'}`}>
                                                <p className="leading-relaxed">{msg.content}</p>
                                                <p className={`text-[9px] mt-2 font-medium ${isMe ? 'text-brand-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
                            <MessageSquare size={64} className="mb-4 text-brand-600" />
                            <h3 className="text-xl font-bold text-gray-900">Your Conversations</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-2">Select a thread from the left to view your full chat history and reply.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    const renderClients = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">My Hired Clients</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => (
                    <div key={client._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <img src={client.avatar} className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-brand-100" />
                        <h3 className="font-bold text-gray-900">{client.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">{client.email}</p>
                        <div className="w-full pt-4 border-t border-gray-50 flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Contact Info</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <Phone size={14} className="text-brand-500" /> {client.phone || 'N/A'}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <MapPin size={14} className="text-brand-500" /> {client.location || 'N/A'}
                            </div>
                        </div>
                    </div>
                ))}
                {clients.length === 0 && <div className="col-span-full p-20 text-center text-gray-400 italic">No clients have hired you yet.</div>}
            </div>
        </div>
    );

    const renderModeration = () => (


        <div className="space-y-6">
            <h2 className="text-xl font-bold">Property Verification Queue</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Property</th>
                            <th className="px-6 py-4">Posted By</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {unverifiedProperties.map(p => (
                            <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-sm">{p.title}</p>
                                    <p className="text-xs text-gray-500">₹{p.price}/mo</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm">{p.owner?.name}</p>
                                    <p className="text-[10px] text-gray-400 capitalize">{p.owner?.role}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{p.location}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleVerify(p._id)} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition shadow-md shadow-green-500/20">
                                        <Check size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {unverifiedProperties.length === 0 && <div className="p-20 text-center text-gray-400">Queue is empty. Great job!</div>}
            </div>
        </div>
    );

    const renderAddListing = () => (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Plus className="bg-brand-100 text-brand-600 p-1 rounded-full" size={28} />
                Create New Listing
            </h2>
            <form onSubmit={handleCreate} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Property Title</label>
                    <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition" placeholder="e.g. Modern Villa with Pool" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rent (₹/mo)</label>
                        <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} required>
                            <option value="">Select...</option>
                            <option value="Apartment">Apartment</option>
                            <option value="House">House</option>
                            <option value="Villa">Villa</option>
                            <option value="Tenament">Tenament</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <input className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" placeholder="e.g. Vadodara" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none resize-none" rows="3" placeholder="Describe the property highlights..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {role !== 'owner' ? (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Deposit (₹)</label>
                            <input className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 transition" type="number" placeholder="Security amount" value={formData.deposit} onChange={e => setFormData({ ...formData, deposit: e.target.value })} required />
                        </div>
                    ) : (
                        <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 flex items-center gap-3">
                            <div className="bg-brand-100 p-2 rounded-xl text-brand-600"><TrendingUp size={18} /></div>
                            <div>
                                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Direct Listing</p>
                                <p className="text-[11px] text-brand-700 italic">No platform deposit required for direct owner deals.</p>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">BHK</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white" value={formData.bhk} onChange={e => setFormData({ ...formData, bhk: e.target.value })} required>
                            <option value="">Select...</option>
                            <option value="1">1 BHK</option>
                            <option value="2">2 BHK</option>
                            <option value="3">3 BHK</option>
                            <option value="4">4+ BHK</option>
                        </select>
                    </div>
                </div>


                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Amenities</label>
                    <input className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none" placeholder="Wifi, Gym, Parking (comma separated)" value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Media</label>
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
                        <input {...getInputProps()} />
                        <UploadCloud className="text-gray-400 mb-3" size={40} />
                        <p className="text-sm font-medium text-gray-600">{isDragActive ? "Drop images now" : "Drag & drop images, or click to browse"}</p>
                        <p className="text-xs text-gray-400 mt-2">Recommended: 1200x800px (Max 5 files)</p>
                    </div>
                    {files.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {files.map((file, i) => (
                                <div key={i} className="text-[10px] bg-brand-50 border border-brand-100 px-3 py-1 rounded-full text-brand-700 font-semibold">{file.name}</div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-4 rounded-2xl hover:bg-brand-700 transition font-bold flex justify-center items-center gap-2 shadow-xl shadow-brand-500/30 disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'List Property Now'}
                </button>
            </form>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 flex flex-col items-center lg:items-start py-8 px-4 gap-8">
                <div className="hidden lg:block">
                    <h2 className="text-xl font-black bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent px-4">
                        {role === 'owner' ? 'OWNER PANEL' : (role === 'broker' ? 'BROKER PANEL' : 'ADMIN PANEL')}
                    </h2>
                </div>

                <div className="flex flex-col w-full gap-2">
                    <NavBtn id="overview" label="Overview" icon={<LayoutDashboard size={20} />} activeTab={activeTab} onClick={setActiveTab} />
                    <NavBtn id="listings" label="Listings" icon={<Home size={20} />} activeTab={activeTab} onClick={setActiveTab} />
                    <NavBtn id="add" label="Add Property" icon={<Plus size={20} />} activeTab={activeTab} onClick={setActiveTab} />
                    <NavBtn id="bookings" label="Bookings" icon={<Calendar size={20} />} activeTab={activeTab} onClick={setActiveTab} />
                    <NavBtn id="messages" label="Messages" icon={<div className="relative"><MessageSquare size={20} />{stats.unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}</div>} activeTab={activeTab} onClick={setActiveTab} />
                    {role === 'admin' && (
                        <NavBtn id="moderation" label="Verification" icon={<ShieldCheck size={20} />} activeTab={activeTab} onClick={setActiveTab} />
                    )}
                    {role === 'broker' && (
                        <NavBtn id="clients" label="My Clients" icon={<Users size={20} />} activeTab={activeTab} onClick={setActiveTab} />
                    )}
                </div>



                <div className="mt-auto w-full">
                    <button onClick={() => setActiveTab('add')} className="w-full bg-brand-50 text-brand-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-100 transition lg:px-4">
                        <Plus size={20} />
                        <span className="hidden lg:block text-sm">Quick Post</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <h1 className="text-2xl font-bold text-gray-900 capitalize italic">{activeTab}</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{role === 'dealer' ? 'Owner / Dealer' : role.toUpperCase()}</p>
                            <p className="text-xs text-gray-500">Vadodara Center</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center font-bold text-brand-700 shadow-sm">
                            {(JSON.parse(localStorage.getItem('userInfo') || '{}').name || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'listings' && renderListings()}
                        {activeTab === 'messages' && renderMessages()}
                        {activeTab === 'add' && renderAddListing()}
                        {activeTab === 'moderation' && renderModeration()}
                        {activeTab === 'bookings' && renderBookings()}
                        {activeTab === 'clients' && renderClients()}
                    </motion.div>

                </AnimatePresence>
            </main>

            {/* Reply Modal */}
            <AnimatePresence>
                {showReplyModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="bg-brand-600 p-8 text-white relative">
                                <button onClick={() => setShowReplyModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={20} /></button>
                                <h2 className="text-2xl font-bold">Reply to Message</h2>
                                <p className="text-white/70 text-sm mt-1">Chatting about: {selectedMessage?.property?.title || 'Property'}</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Reply</label>
                                    <textarea
                                        placeholder="Type your message here..."
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-brand-500 transition-all font-medium min-h-[120px] resize-none"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleSendMessage} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-brand-600 transition">
                                    Send Reply
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Simulated Payment Gateway Modal */}
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
                                            <span className="text-lg font-black text-brand-600">₹{selectedBookingForPayment?.property?.deposit || 0}</span>
                                        </div>
                                        <button
                                            onClick={handlePaymentComplete}
                                            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand-100 hover:bg-brand-700 transition flex items-center justify-center gap-2"
                                        >
                                            Continue to Dashboard <TrendingUp size={18} />
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
                                                <p className="text-2xl font-black text-brand-600">₹{selectedBookingForPayment?.property?.deposit || 0}</p>
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
            <WhatsAppBot />
        </div>

    );
};

const NavBtn = ({ id, label, icon, activeTab, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 
        ${activeTab === id ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-gray-500 hover:bg-gray-50'}`}
    >
        {icon}
        <span className="hidden lg:block">{label}</span>
    </button>
);

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        <div>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export default Dashboard;
