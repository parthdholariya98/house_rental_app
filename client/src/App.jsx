import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import AdminDashboard from './pages/AdminDashboard'; // Admin Dashboard
import AdminUsers from './pages/AdminUsers'; // New Page
import AdminProperties from './pages/AdminProperties';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import HireBroker from './pages/HireBroker';
import Payments from './pages/Payments'; // New Page
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    useEffect(() => {
        // Global Axios Interceptor for 401 Unauthorized
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.clear();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    return (
        <Router>
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
                <Navbar />
                <ToastContainer position="bottom-right" theme="colored" />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgotpassword" element={<ForgotPassword />} />
                    <Route path="/resetpassword/:token" element={<ResetPassword />} />
                    <Route path="/unauthorized" element={<div className="text-center mt-20 text-2xl font-bold text-red-500">Access Denied</div>} />

                    {/* Protected Routes */}

                    {/* Shared Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['user', 'owner', 'admin', 'broker']} />}>
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/payments" element={<Payments />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                        <Route path="/hire-broker" element={<HireBroker />} />
                    </Route>

                    {/* Dashboard for Partners (Owner & Broker) & Admin */}
                    <Route element={<ProtectedRoute allowedRoles={['owner', 'broker', 'admin']} />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/properties" element={<AdminProperties />} />
                    </Route>

                </Routes>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
