import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Phone, MapPin, Check } from 'lucide-react';

const HireBroker = () => {
    const [brokers, setBrokers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hiredBrokerId, setHiredBrokerId] = useState(null);
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    useEffect(() => {
        if (userRole === 'user') {
            fetchBrokers();
            fetchUserProfile(); // To check if already hired
        }
    }, [userRole]);

    const fetchBrokers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users/brokers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrokers(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load brokers');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHiredBrokerId(res.data.hiredBroker);
        } catch (err) {
            // ignore
        }
    };

    const handleHire = async (brokerId) => {
        try {
            await axios.put('http://localhost:5000/api/users/hire-broker', { brokerId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHiredBrokerId(brokerId);
            toast.success('Broker hired successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to hire broker');
        }
    };

    if (userRole !== 'user') {
        return <div className="p-10 text-center">Only Users can hire brokers.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Hire a Broker</h1>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {brokers.map((broker) => (
                            <div key={broker._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-md transition">
                                <img
                                    src={broker.avatar}
                                    alt={broker.name}
                                    className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-brand-100"
                                />
                                <h3 className="text-xl font-bold text-gray-900">{broker.name}</h3>
                                <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                    <MapPin size={14} /> {broker.location || 'Location not specified'}
                                </div>

                                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                                    Professional broker ready to help you find your dream home.
                                </p>

                                <button
                                    onClick={() => handleHire(broker._id)}
                                    disabled={hiredBrokerId === broker._id}
                                    className={`w-full py-2.5 rounded-xl font-medium transition ${hiredBrokerId === broker._id
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-brand-600 text-white hover:bg-brand-700'
                                        }`}
                                >
                                    {hiredBrokerId === broker._id ? (
                                        <span className="flex items-center justify-center gap-2"><Check size={18} /> Hired</span>
                                    ) : 'Hire Now'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {brokers.length === 0 && (
                        <div className="text-center text-gray-500 mt-10">No brokers available at the moment.</div>
                    )}
                </>
            )}
        </div>
    );
};

export default HireBroker;
