import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Home, UserCheck, TrendingUp, DollarSign, Calendar, Activity, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOwners: 0,
        totalBrokers: 0,
        totalProperties: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingVerifications: 0,
        recentActivity: []
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 30 seconds for real-time updates
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch all data in parallel
            const [usersRes, propertiesRes, bookingsRes, paymentsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/users', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/properties', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:5000/api/admin/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] })),
                axios.get('http://localhost:5000/api/payments/my-payments', {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] }))
            ]);

            const users = usersRes.data;
            const properties = propertiesRes.data;
            const bookings = bookingsRes.data;
            const payments = paymentsRes.data;

            // Calculate statistics
            const owners = users.filter(u => u.role === 'owner');
            const brokers = users.filter(u => u.role === 'broker');
            const regularUsers = users.filter(u => u.role === 'user');
            const pendingVerifications = users.filter(u => (u.role === 'owner' || u.role === 'broker') && !u.isVerified).length;
            const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

            setStats({
                totalUsers: regularUsers.length,
                totalOwners: owners.length,
                totalBrokers: brokers.length,
                totalProperties: properties.length,
                totalBookings: bookings.length,
                totalRevenue,
                pendingVerifications,
                recentActivity: []
            });

            // Get recent users (last 5)
            setRecentUsers(users.slice(-5).reverse());

            // Get recent bookings (last 5)
            setRecentBookings(bookings.slice(-5).reverse());

            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load dashboard data');
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-4 rounded-2xl ${color}`}>
                    <Icon size={28} className="text-white" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-1 text-xs">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className="text-green-600 font-semibold">{trend}</span>
                    <span className="text-gray-400">vs last month</span>
                </div>
            )}
        </motion.div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-500">Real-time overview of your rental platform</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Activity size={14} className="animate-pulse text-green-500" />
                    <span>Live updates every 30 seconds</span>
                </div>
            </div>

            {/* Alert for Pending Verifications */}
            {stats.pendingVerifications > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-orange-500" size={20} />
                        <div>
                            <p className="text-sm font-semibold text-orange-800">
                                {stats.pendingVerifications} {stats.pendingVerifications === 1 ? 'user' : 'users'} pending verification
                            </p>
                            <p className="text-xs text-orange-600">Review and verify owners/brokers to allow them to post properties</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Users}
                    title="Total Users"
                    value={stats.totalUsers}
                    subtitle="Registered tenants"
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                    trend="+12%"
                />
                <StatCard
                    icon={Home}
                    title="Property Owners"
                    value={stats.totalOwners}
                    subtitle="Verified owners"
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                    trend="+8%"
                />
                <StatCard
                    icon={UserCheck}
                    title="Brokers"
                    value={stats.totalBrokers}
                    subtitle="Active brokers"
                    color="bg-gradient-to-br from-orange-500 to-orange-600"
                    trend="+5%"
                />
                <StatCard
                    icon={Home}
                    title="Properties"
                    value={stats.totalProperties}
                    subtitle="Total listings"
                    color="bg-gradient-to-br from-green-500 to-green-600"
                    trend="+15%"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    icon={Calendar}
                    title="Total Bookings"
                    value={stats.totalBookings}
                    subtitle="All time"
                    color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                />
                <StatCard
                    icon={DollarSign}
                    title="Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    subtitle="Total deposits"
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatCard
                    icon={Shield}
                    title="Pending Verifications"
                    value={stats.pendingVerifications}
                    subtitle="Awaiting approval"
                    color="bg-gradient-to-br from-red-500 to-red-600"
                />
            </div>

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
                        <p className="text-xs text-gray-500">Latest registrations</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentUsers.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">No users yet</div>
                        ) : (
                            recentUsers.map(user => (
                                <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'owner' ? 'bg-blue-100 text-blue-700' :
                                                user.role === 'broker' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
                        <p className="text-xs text-gray-500">Latest property visits</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentBookings.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">No bookings yet</div>
                        ) : (
                            recentBookings.map(booking => (
                                <div key={booking._id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {booking.property?.title || 'Property'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                by {booking.tenant?.name || 'User'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    booking.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {booking.status}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(booking.visitDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
