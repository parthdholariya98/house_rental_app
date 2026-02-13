import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Home as HomeIcon, Filter, User, Calendar, BedDouble, Banknote, MessageCircle as MessageIcon, X, Send, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import WhatsAppBot from '../components/WhatsAppBot';

const Home = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Modal & Interaction States
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [bookingDate, setBookingDate] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Filter States
    const [filters, setFilters] = useState({
        city: '',
        type: '',
        bhk: '',
        minPrice: '',
        maxPrice: '',
        postedBy: ''
    });

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    useEffect(() => {
        fetchProperties();
    }, [filters]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.city) params.append('city', filters.city);
            if (filters.type) params.append('type', filters.type);
            if (filters.bhk) params.append('bhk', filters.bhk);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.postedBy) params.append('postedBy', filters.postedBy);

            const res = await axios.get(`http://localhost:5000/api/properties?${params.toString()}`);
            setProperties(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleBookVisitSubmit = async () => {
        if (!bookingDate) {
            toast.warn("Please select a date.");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/bookings',
                { propertyId: selectedProperty._id, visitDate: bookingDate, message: 'Interested in this property.' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Booking request sent successfully!');
            setBookingSuccess(true);

        } catch (err) {
            toast.error(err.response?.data?.message || 'Error booking visit');
        }
    };

    const handleSendMessageSubmit = async () => {
        if (!messageContent.trim()) {
            toast.warn("Please enter a message.");
            return;
        }

        const receiverModel = selectedProperty.posterModel;
        const currentUserModel = role === 'user' ? 'User' : (role === 'owner' ? 'Owner' : (role === 'broker' ? 'Broker' : 'Admin'));

        if (currentUserModel !== 'User' && receiverModel !== 'User') {
            toast.warn("Direct chat between Partners is disabled. You can only chat with Potential Tenants.");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/messages', {
                propertyId: selectedProperty._id,
                receiverId: selectedProperty.owner?._id || selectedProperty.owner,
                receiverModel: receiverModel || 'Owner',
                content: messageContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Message sent successfully!');
            setShowMessageModal(false);
            setMessageContent('');
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to send message';
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">

            {/* Filter Sidebar */}
            <div className={`hidden md:block w-72 bg-white border-r border-gray-200 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto`}>
                <div className="flex items-center gap-2 mb-6">
                    <Filter className="text-brand-600" />
                    <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location / City</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input
                                name="city"
                                placeholder="e.g. Vadodara"
                                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                value={filters.city}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                        <select name="type" className="w-full p-2 border rounded-lg outline-none bg-white" value={filters.type} onChange={handleFilterChange}>
                            <option value="">All Types</option>
                            <option value="Apartment">Apartment</option>
                            <option value="House">House</option>
                            <option value="Villa">Villa</option>
                            <option value="Tenament">Tenament</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">BHK</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    className={`flex-1 py-1 rounded-md border text-sm ${filters.bhk == num ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    onClick={() => setFilters({ ...filters, bhk: filters.bhk == num ? '' : num })}
                                >
                                    {num}+
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range (₹)</label>
                        <div className="flex items-center gap-2">
                            <input name="minPrice" type="number" placeholder="Min" className="w-full p-2 border rounded-lg text-sm" value={filters.minPrice} onChange={handleFilterChange} />
                            <span className="text-gray-400">-</span>
                            <input name="maxPrice" type="number" placeholder="Max" className="w-full p-2 border rounded-lg text-sm" value={filters.maxPrice} onChange={handleFilterChange} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Posted By</label>
                        <div className="space-y-2">
                            {['', 'Owner', 'Broker'].map(post => (
                                <label key={post} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="postedBy" value={post} checked={filters.postedBy === post} onChange={handleFilterChange} className="text-brand-600" />
                                    <span className="text-sm">{post || 'All'}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Listing Area */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Properties in {filters.city || 'Vadodara'}</h1>
                            <p className="text-gray-500">Showing {properties.length} results</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {properties.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 italic text-gray-400">No properties found matching your criteria.</div>
                            ) : (
                                properties.map((property) => (
                                    <div key={property._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
                                        <div className="relative h-56 bg-gray-200 overflow-hidden">
                                            <img src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                            {/* Badge */}
                                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-gray-100 shadow-xl flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${property.posterModel === 'Broker' ? 'bg-blue-500' : 'bg-brand-500'}`} />
                                                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{property.posterModel === 'Broker' ? 'Broker' : 'Direct'}</span>
                                            </div>
                                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur px-3 py-1 rounded-lg text-xs font-medium text-white">
                                                {property.type}
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{property.title}</h3>
                                            <div className="flex items-center text-gray-500 text-sm mb-4"><MapPin size={14} className="mr-1" />{property.location}</div>

                                            <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-50 p-3 rounded-2xl">
                                                <div className="flex items-center gap-2"><BedDouble size={16} className="text-brand-500" /><span className="text-sm font-semibold">{property.bhk} BHK</span></div>
                                                <div className="flex items-center gap-2"><Banknote size={16} className="text-brand-500" /><span className="text-sm font-bold">₹{property.price}/mo</span></div>
                                                {property.posterModel === 'Broker' && (
                                                    <div className="flex items-center gap-2 col-span-2 border-t border-gray-100 pt-2 mt-1">
                                                        <Info size={14} className="text-blue-500" />
                                                        <span className="text-xs font-medium text-gray-600">Secure Deposit: <span className="text-brand-600 font-bold">₹{property.deposit || 0}</span></span>
                                                    </div>
                                                )}
                                            </div>


                                            <div className="mt-auto flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (!token) return navigate('/login');
                                                        if (role !== 'user') return toast.warn("Only users can book visits");
                                                        setSelectedProperty(property);
                                                        setShowBookingModal(true);
                                                    }}
                                                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    Book Visit <Calendar size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (!token) return navigate('/login');
                                                        setSelectedProperty(property);
                                                        setShowMessageModal(true);
                                                    }}
                                                    className="bg-brand-50 text-brand-600 p-3 rounded-xl hover:bg-brand-100 transition-colors"
                                                    title="Internal Message"
                                                >
                                                    <MessageIcon size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            <AnimatePresence>
                {/* Booking Modal */}
                {showBookingModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="bg-gray-900 p-8 text-white relative">
                                <button onClick={() => { setShowBookingModal(false); setBookingSuccess(false); setBookingDate(''); }} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={20} /></button>
                                <Calendar size={40} className="text-brand-400 mb-4" />
                                <h2 className="text-2xl font-bold">Schedule a Visit</h2>
                                <p className="text-gray-400 text-sm mt-1">Pick a date that works for you.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                {bookingSuccess ? (
                                    <div className="text-center space-y-6 py-4">
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                            <CheckCircle size={40} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">Request Sent!</h3>
                                            <p className="text-sm text-gray-500 mt-2">Your visit request for <b>{selectedProperty?.title}</b> is on its way. Use the auto-replay below for instant confirmation.</p>
                                        </div>

                                        <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 text-left">
                                            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2">Email Auto message</p>
                                            <p className="text-xs text-gray-600 leading-relaxed">Send an automated message to the lister to skip the queue and get an instant slot verification.</p>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowBookingModal(false);
                                                    setBookingSuccess(false);
                                                    setBookingDate('');
                                                }}
                                                className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand-100 hover:bg-brand-700 transition"
                                            >
                                                Done & Back to Listings
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-brand-500 transition-all font-medium"
                                                value={bookingDate}
                                                onChange={(e) => setBookingDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="bg-brand-50 p-4 rounded-2xl flex gap-3 items-start">
                                            <Info size={18} className="text-brand-600 mt-0.5" />
                                            <p className="text-[11px] text-brand-700 leading-relaxed font-medium">Visiting hours are typically between 10 AM and 6 PM. The owner/broker will confirm the exact time via message.</p>
                                        </div>
                                        <button onClick={handleBookVisitSubmit} className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition lg:hover:-translate-y-1">Confirm Schedule</button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Message Modal */}
                {showMessageModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="bg-brand-600 p-8 text-white relative">
                                <button onClick={() => setShowMessageModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={20} /></button>
                                <MessageIcon size={40} className="text-white mb-4" />
                                <h2 className="text-2xl font-bold">Send Message</h2>
                                <p className="text-white/70 text-sm mt-1">Chatting with {selectedProperty?.owner?.name || 'the Lister'}</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Message</label>
                                    <textarea
                                        placeholder="Type your inquiry here..."
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-brand-500 transition-all font-medium min-h-[120px] resize-none"
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleSendMessageSubmit} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-brand-600 transition lg:hover:-translate-y-1">
                                    Send Inquiry <Send size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <WhatsAppBot />
        </div>
    );
};

export default Home;
