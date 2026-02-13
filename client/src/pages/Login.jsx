import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Briefcase, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

import OAuth from '../components/OAuth';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('userId', res.data._id);
            localStorage.setItem('userInfo', JSON.stringify(res.data)); // Added for consistency with OAuth

            toast.success(`Welcome back, ${res.data.name}!`);

            if (res.data.role === 'admin') {
                navigate('/admin/users');
            } else if (res.data.role === 'owner' || res.data.role === 'broker') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Login failed';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600">Please sign in to your account</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition"
                                placeholder="Email address"
                                value={email}
                                onChange={onChange}
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition"
                                    placeholder="Password"
                                    value={password}
                                    onChange={onChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-brand-500 transition-colors"
                                >
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                            <div className="flex items-center justify-end">
                                <Link to="/forgotpassword" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition shadow-lg shadow-brand-500/30 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in'}
                            </button>
                        </div>

                        <div className="relative flex items-center justify-center my-4">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition appearance-none bg-white"
                                >
                                    <option value="user">I am a User</option>
                                    <option value="owner">I am an Owner</option>
                                    <option value="broker">I am a Broker</option>
                                </select>
                            </div>
                            <OAuth role={role} />
                        </div>

                        <div className="text-center text-sm">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500">
                                    Sign up now
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
