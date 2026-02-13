import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, CheckCircle, Shield, User } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch users");
        }
    }

    const verifyOwner = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/verify/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Owner Verified!");
            fetchUsers();
        } catch (err) {
            toast.error("Verification failed");
        }
    }

    const deleteUser = async (id) => {
        if (!confirm("Are you sure? This action is irreversible.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("User deleted");
            fetchUsers();
        } catch (err) {
            toast.error("Delete failed");
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>

            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                                                user.role === 'broker' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-green-100 text-green-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.role === 'owner' || user.role === 'broker' ? (
                                        user.isVerified ? (
                                            <span className="text-green-600 text-sm flex items-center gap-1"><Shield size={14} /> Verified</span>
                                        ) : (
                                            <button onClick={() => verifyOwner(user._id)} className="text-brand-600 hover:text-brand-800 text-sm font-medium underline">Verify Now</button>
                                        )
                                    ) : (
                                        <span className="text-gray-400 text-sm">N/A</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {user.role !== 'admin' && (
                                        <button onClick={() => deleteUser(user._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminUsers;
