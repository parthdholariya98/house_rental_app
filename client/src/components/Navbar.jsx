import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, User, LogOut, LayoutDashboard, Calendar, Users, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    useEffect(() => {
        setUserInfo(JSON.parse(localStorage.getItem('userInfo') || '{}'));
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('userInfo');
        navigate('/login');
        setIsOpen(false);
    };

    const navLinks = [
        { name: 'Home', path: '/', icon: <Home size={18} /> },
    ];

    if (token) {
        if (role === 'owner' || role === 'broker') {
            navLinks.push({ name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> });
        }
        if (role === 'admin') {
            navLinks.push({ name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> });
            navLinks.push({ name: 'Manage Users', path: '/admin/users', icon: <Users size={18} /> });
            navLinks.push({ name: 'Manage Properties', path: '/admin/properties', icon: <Home size={18} /> });
        }
        if (role === 'user') {
            navLinks.push({ name: 'Hire Broker', path: '/hire-broker', icon: <Briefcase size={18} /> });
        }
        if (role === 'user' || role === 'owner' || role === 'broker') {
            navLinks.push({ name: 'Bookings', path: '/bookings', icon: <Calendar size={18} /> });
        }
    }

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="bg-brand-600 p-1.5 rounded-lg shadow-lg shadow-brand-500/20">
                                <Home className="text-white" size={24} />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                                Rent House
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(link.path) ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-brand-600 hover:bg-gray-50'}`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        ))}

                        {token ? (
                            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                                <Link to="/profile" className="flex items-center gap-3 group">
                                    <div className="text-right hidden lg:block">
                                        <p className="text-sm font-semibold text-gray-900 leading-none group-hover:text-brand-600 transition-colors">
                                            {userInfo.name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize pt-0.5">
                                            {role}
                                        </p>
                                    </div>
                                    <div className="relative">
                                        {userInfo.avatar && !userInfo.avatar.error ? (
                                            <img
                                                src={userInfo.avatar.startsWith('http') ? userInfo.avatar : 'https://res.cloudinary.com/dfvffsv0c/image/upload/v1735125586/house_rental_platform/default-avatar_vqc6xj.png'}
                                                alt="avatar"
                                                className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-500 transition-all border border-gray-100"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.querySelector('.fallback-avatar').style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`fallback-avatar h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold group-hover:bg-brand-200 transition-colors border border-brand-200 ${userInfo.avatar && !userInfo.avatar.error ? 'hidden' : 'flex'}`}>
                                            {(userInfo.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-gray-600 hover:text-brand-600 font-medium text-sm px-3 py-2">Login</Link>
                                <Link to="/register" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all duration-200 shadow-xl shadow-brand-500/25 hover:-translate-y-0.5 active:translate-y-0">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium
                        ${isActive(link.path) ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            ))}
                            {!token && (
                                <>
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50">Login</Link>
                                    <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-brand-600 hover:bg-brand-50">Register</Link>
                                </>
                            )}
                            {token && (
                                <>
                                    <Link to="/profile" onClick={() => setIsOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${isActive('/profile') ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <User size={18} /> Profile
                                    </Link>
                                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">
                                        <LogOut size={18} /> Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
