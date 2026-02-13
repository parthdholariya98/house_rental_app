import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, MapPin, Tag } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminProperties = () => {
    const [properties, setProperties] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch properties");
        }
    }

    const deleteProperty = async (id) => {
        if (!confirm("Are you sure? This action is irreversible.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Property deleted");
            fetchProperties();
        } catch (err) {
            toast.error("Delete failed");
        }
    }

    const verifyProperty = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/properties/${id}/verify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Property approved!");
            fetchProperties();
        } catch (err) {
            toast.error("Verification failed");
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin: Property Management</h1>

            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {properties.map(property => (
                            <tr key={property._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-16 w-24 flex-shrink-0 relative rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                className="h-full w-full object-cover"
                                                src={property.images && property.images.length > 0 ? property.images[0] : 'https://via.placeholder.com/150'}
                                                alt={property.title}
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{property.title}</div>
                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {property.location}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-semibold">₹{property.price}</div>
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                                        {property.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{property.owner?.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{property.owner?.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${property.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        property.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {property.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {property.status === 'pending' && (
                                        <button onClick={() => verifyProperty(property._id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition shadow-sm">
                                            Approve
                                        </button>
                                    )}
                                    <button onClick={() => deleteProperty(property._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export default AdminProperties;
