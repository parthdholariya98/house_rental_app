import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, Info, Calendar, Home, CheckCircle, Plus, Trash2 } from 'lucide-react';

const WhatsAppBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I am the RentalHub Assistant. How can I help you today?", sender: 'bot', time: new Date() }
    ]);
    const role = localStorage.getItem('role') || 'Guest';
    const token = localStorage.getItem('token');
    const whatsappNumber = "918799323571";

    if (!token) return null;

    const getOptionsByRole = () => {
        if (role === 'user') {
            return [
                { id: 'NEW_BOOKING', label: '🏠 Add New Booking', text: 'I want to make a new visit request.' },
                { id: 'CHECK_BOOKINGS', label: '� Check My Bookings', text: 'What is the status of my bookings?' },
                { id: 'DELETE_BOOKING', label: '�️ Delete My Booking', text: 'I want to cancel/delete a booking.' }
            ];
        }
        if (role === 'owner' || role === 'broker') {
            return [
                { id: 'ADD_PROPERTY', label: '➕ Add Property', text: 'I want to list a new property.' },
                { id: 'MANAGE_PROPERTIES', label: '🏢 Property Managed', text: 'I want to manage my existing listings.' },
                { id: 'SUPPORT', label: '�️ Support', text: 'I need technical help.' }
            ];
        }
        return [
            { id: 'GUEST_HELP', label: '👋 Help', text: 'I am new here, how does this work?' }
        ];
    };

    const handleOptionClick = (option) => {
        const userMsg = { id: Date.now(), text: option.text, sender: 'user', time: new Date() };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            let replyText = "";
            let command = "";

            switch (option.id) {
                // User Actions
                case 'NEW_BOOKING':
                    replyText = "Great! You can add a new booking by visiting any property on the Home page and clicking 'Book Visit'. Need help finding a place?";
                    command = `🏠 *NEW BOOKING REQUEST*\n\nUser: ${role}\nAction: Help me find a property to book.`;
                    break;
                case 'CHECK_BOOKINGS':
                    replyText = "You can check all your booking statuses in the 'My Bookings' section. Want a live summary now?";
                    command = `📅 *BOOKING STATUS CHECK*\n\nUser: ${role}\nAction: Fetch my active booking updates.`;
                    break;
                case 'DELETE_BOOKING':
                    replyText = "To delete a booking, please head to the Bookings page. I can also notify the owner for you.";
                    command = `�️ *DELETE BOOKING*\n\nUser: ${role}\nAction: I want to cancel a specific booking.`;
                    break;

                // Owner Actions
                case 'ADD_PROPERTY':
                    replyText = "Ready to grow? You can add a property from your Dashboard's 'Add Property' tab. I can help with the verification!";
                    command = `➕ *ADD PROPERTY*\n\nRole: ${role}\nAction: I am ready to list a new property.`;
                    break;
                case 'MANAGE_PROPERTIES':
                    replyText = "Your managed properties are under the 'Listings' tab in your Dashboard. Need to update anything?";
                    command = `🏢 *MANAGE PROPERTIES*\n\nRole: ${role}\nAction: I want to update my property details.`;
                    break;
                case 'SUPPORT':
                    replyText = "Our support team is online! We can help with your listings or account.";
                    command = `�️ *OWNER SUPPORT*\n\nRole: ${role}\nStatus: Priority assistance for partner.`;
                    break;

                default:
                    replyText = "Hello! Please login to access customized features!";
                    command = "Hello RentalHub!";
            }

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: replyText,
                sender: 'bot',
                time: new Date()
            }]);
        }, 600);
    };

    const botOptions = getOptionsByRole();

    return (
        <div className="fixed bottom-6 right-6 z-[999]">
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-gray-900 text-white' : 'bg-[#25D366] text-white'}`}
            >
                {isOpen ? <X size={24} /> : (
                    <div className="relative">
                        <MessageSquare size={28} />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        className="absolute bottom-20 right-0 w-[350px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-gray-900 p-5 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">RentalHub Bot</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Role: {role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 scrollbar-hide">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-brand-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                        {msg.action && (
                                            <a
                                                href={msg.action.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 block bg-[#25D366] text-white text-center py-2 rounded-xl font-bold hover:bg-[#128C7E] transition-all flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare size={14} /> {msg.action.label}
                                            </a>
                                        )}
                                        <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Options */}
                        <div className="p-4 bg-white border-t border-gray-50 grid grid-cols-2 gap-2">
                            {botOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionClick(opt)}
                                    className="text-left p-2 rounded-xl border border-gray-100 hover:border-brand-500 hover:bg-brand-50 transition-all text-[10px] font-bold text-gray-600 truncate"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WhatsAppBot;
