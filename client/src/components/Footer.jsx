import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
    // Get user info and role
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    return (
        <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 px-6 mt-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                {/* Brand Section */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="bg-brand-600 p-2 rounded-lg text-white">RH</span>
                        RentalHub
                    </h2>
                    <p className="text-sm leading-relaxed text-gray-400">
                        Making house hunting easy, transparent, and efficient. Find your next dream home with RentalHub, the most trusted property management platform.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h3 className="text-white font-bold mb-6">Quick Links</h3>
                    <ul className="space-y-3 text-sm">
                        <li><a href="/" className="hover:text-brand-500 transition-colors">Home</a></li>
                        {!token ? (
                            <>
                                <li><a href="/login" className="hover:text-brand-500 transition-colors">Login</a></li>
                                <li><a href="/register" className="hover:text-brand-500 transition-colors">Register</a></li>
                            </>
                        ) : (
                            <>
                                {(role === 'owner' || role === 'broker' || role === 'admin') && (
                                    <li><a href={role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="hover:text-brand-500 transition-colors">Dashboard</a></li>
                                )}
                                {role === 'admin' && (
                                    <>
                                        <li><a href="/admin/users" className="hover:text-brand-500 transition-colors">Manage Users</a></li>
                                        <li><a href="/admin/properties" className="hover:text-brand-500 transition-colors">Manage Properties</a></li>
                                    </>
                                )}
                                {role === 'user' && (
                                    <li><a href="/hire-broker" className="hover:text-brand-500 transition-colors">Hire a Broker</a></li>
                                )}
                                {role !== 'admin' && (
                                    <li><a href="/bookings" className="hover:text-brand-500 transition-colors">My Bookings</a></li>
                                )}
                                <li><a href="/profile" className="hover:text-brand-500 transition-colors">Profile</a></li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h3 className="text-white font-bold mb-6">Contact Us</h3>
                    <ul className="space-y-4 text-sm">
                        <li className="flex items-center gap-3">
                            <div className="p-2 bg-gray-800 rounded-lg text-brand-500">
                                <Phone size={16} />
                            </div>
                            <span>+91 87993 23571</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="p-2 bg-gray-800 rounded-lg text-brand-500">
                                <Mail size={16} />
                            </div>
                            <span>support@rentalhub.com</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="p-2 bg-gray-800 rounded-lg text-brand-500">
                                <MapPin size={16} />
                            </div>
                            <span>Ganpat University, Gujarat, India</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-8 mt-8 text-center text-xs text-gray-500">
                <p>&copy; {new Date().getFullYear()} RentalHub. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
