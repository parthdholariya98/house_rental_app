import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, MapPin, Phone, Edit2, Camera, CheckCircle, Briefcase, Loader2, Star, ShieldCheck, UploadCloud } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || '{}'));
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [formData, setFormData] = useState({
        name: userInfo.name || '',
        email: userInfo.email || '',
        avatar: userInfo.avatar || '',
        phone: userInfo.phone || '',
        location: userInfo.location || '',
    });
    const role = localStorage.getItem('role');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            console.log('--- FRONTEND SAVE START ---');
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('location', formData.location);

            if (avatarFile) {
                console.log('Appending new avatar file:', avatarFile.name);
                data.append('avatar', avatarFile);
            }

            const res = await axios.put('http://localhost:5000/api/auth/profile', data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Update Success Response:', res.data);

            const updatedInfo = { ...JSON.parse(localStorage.getItem('userInfo') || '{}'), ...res.data };
            localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
            }
            setUserInfo(updatedInfo);
            setFormData({
                name: updatedInfo.name || '',
                email: updatedInfo.email || '',
                avatar: updatedInfo.avatar || '',
                phone: updatedInfo.phone || '',
                location: updatedInfo.location || '',
            });
            setIsEditing(false);
            setAvatarFile(null);
            setPreviewUrl(null);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Update Error:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                window.location.href = '/login';
            } else {
                toast.error(error.response?.data?.message || 'Failed to update profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: 'Member Since', value: new Date(userInfo.createdAt || Date.now()).toLocaleDateString(), icon: <Calendar className="text-blue-500" size={20} /> },
        { label: 'Account Type', value: role?.toUpperCase() || 'USER', icon: <ShieldCheck className="text-brand-500" size={20} /> },
        { label: 'Verified', value: userInfo.isVerified ? 'Yes' : 'No', icon: <CheckCircle className={userInfo.isVerified ? "text-green-500" : "text-gray-400"} size={20} /> },
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-4xl mx-auto">
                {/* Header Profile Card */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/60 overflow-hidden border border-gray-100 mb-8">
                    <div className="h-40 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-400 relative">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
                        <div className="absolute -bottom-14 left-10">
                            <div className="relative group">
                                <label className={isEditing ? "cursor-pointer block" : ""}>
                                    {isEditing && (
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    )}
                                    {previewUrl || userInfo.avatar ? (
                                        <img
                                            src={previewUrl || userInfo.avatar}
                                            alt="profile"
                                            className="h-28 w-28 rounded-3xl object-cover ring-8 ring-white shadow-2xl transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="h-28 w-28 rounded-3xl bg-brand-100 flex items-center justify-center text-brand-700 text-4xl font-black ring-8 ring-white shadow-2xl">
                                            {userInfo.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {isEditing && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center cursor-pointer backdrop-blur-sm group-hover:opacity-100 opacity-0 transition-opacity"
                                            >
                                                <Camera className="text-white" size={28} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 pb-10 px-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                    {isEditing ? (
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="bg-brand-50/50 border-b-2 border-brand-500 focus:outline-none px-2 py-1 rounded-t-lg transition-all"
                                        />
                                    ) : (
                                        userInfo.name
                                    )}
                                </h1>
                                {userInfo.isVerified && (
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shadow-green-200"
                                    >
                                        <CheckCircle size={14} /> VERIFIED
                                    </motion.span>
                                )}
                            </div>
                            <p className="text-gray-500 mt-2 flex items-center gap-2.5 font-medium">
                                <div className="p-1.5 bg-gray-100 rounded-lg"><Mail size={14} className="text-gray-400" /></div>
                                {userInfo.email}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <AnimatePresence mode="wait">
                                {isEditing ? (
                                    <motion.div
                                        key="editing-buttons"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex gap-3"
                                    >
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setAvatarFile(null);
                                                setPreviewUrl(null);
                                                setFormData({
                                                    name: userInfo.name || '',
                                                    email: userInfo.email || '',
                                                    avatar: userInfo.avatar || '',
                                                    phone: userInfo.phone || '',
                                                    location: userInfo.location || '',
                                                });
                                            }}
                                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/40 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                            Save Changes
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="edit-button"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/40 active:scale-95 group"
                                    >
                                        <Edit2 size={20} className="group-hover:rotate-12 transition-transform" />
                                        Edit Profile
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Stats */}
                    <div className="md:col-span-1 space-y-6">
                        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Account Overview</h3>
                            <div className="space-y-6">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="flex items-center gap-5 group">
                                        <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-brand-50 transition-colors">
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                            <p className="text-sm font-bold text-gray-800">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="md:col-span-2 space-y-8">
                        <motion.div variants={itemVariants} className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 p-20 opacity-[0.03] text-brand-900 pointer-events-none">
                                <User size={240} strokeWidth={1} />
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-8 w-1.5 bg-brand-600 rounded-full"></div>
                                <h3 className="text-2xl font-black text-gray-900 font-primary">Personal Details</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                            <User size={18} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white focus:outline-none transition-all font-semibold text-gray-900"
                                            />
                                        ) : (
                                            <div className="w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent font-semibold text-gray-900">{userInfo.name}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white focus:outline-none transition-all font-semibold text-gray-900"
                                            />
                                        ) : (
                                            <div className="w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent font-semibold text-gray-900">{userInfo.email}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                            <Phone size={18} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                                className="w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white focus:outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-300"
                                            />
                                        ) : (
                                            <div className={`w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent font-semibold ${userInfo.phone ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                                {userInfo.phone || 'Not provided'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                            <MapPin size={18} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="Enter location"
                                                className="w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent focus:border-brand-500 focus:bg-white focus:outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-300"
                                            />
                                        ) : (
                                            <div className={`w-full bg-gray-50/50 pl-11 pr-4 py-3.5 rounded-2xl border-2 border-transparent font-semibold ${userInfo.location ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                                {userInfo.location || 'Not provided'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profile Photo</label>
                                    <div className="relative group">
                                        {isEditing ? (
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                                <label
                                                    htmlFor="avatar-upload"
                                                    className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl cursor-pointer hover:bg-brand-100 transition-colors font-bold text-sm border border-brand-200"
                                                >
                                                    <UploadCloud size={18} />
                                                    {avatarFile ? avatarFile.name : 'Choose new photo'}
                                                </label>
                                                {avatarFile && (
                                                    <button
                                                        onClick={() => {
                                                            setAvatarFile(null);
                                                            setPreviewUrl(null);
                                                        }}
                                                        className="text-red-500 text-xs font-bold hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-full bg-gray-50/50 px-4 py-3.5 rounded-2xl border-2 border-transparent font-semibold text-gray-400 truncate text-sm">
                                                Photo is managed via the edit section above
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {role === 'owner' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-12 pt-10 border-t border-gray-100"
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="h-8 w-1.5 bg-brand-600 rounded-full"></div>
                                        <h3 className="text-2xl font-black text-gray-900 font-primary">Business Insights</h3>
                                    </div>
                                    <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-12 opacity-[0.05] text-brand-900 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                            <Briefcase size={80} />
                                        </div>
                                        <div className="flex items-start gap-6 relative z-10">
                                            <div className="bg-white p-4 rounded-2xl shadow-sm text-brand-600 ring-1 ring-brand-100">
                                                <Briefcase size={28} />
                                            </div>
                                            <div>
                                                <p className="font-black text-brand-900 text-lg">Inventory Overview</p>
                                                <p className="text-brand-700 mt-2 font-medium leading-relaxed">
                                                    You currently manage <span className="text-brand-900 font-black px-1.5 py-0.5 bg-brand-100 rounded-lg">{userInfo.properties?.length || 0}</span> active property listings.
                                                    Your profile is visible to thousands of potential tenants.
                                                </p>
                                                <motion.button
                                                    whileHover={{ x: 5 }}
                                                    className="mt-6 flex items-center gap-2 text-sm font-black text-brand-600 hover:text-brand-700"
                                                >
                                                    Manage Dashboard <CheckCircle size={16} />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Profile;
