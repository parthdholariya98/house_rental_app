import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * 
 * @param {Array} allowedRoles - Array of roles allowed to access this route.
 * @returns {JSX.Element} - Outlet if authorized, Navigate otherwise.
 */
const ProtectedRoute = ({ allowedRoles }) => {
    // In a real app, you'd get this from your Auth Context/Redux Store
    // Example: const { user, isAuthenticated } = useAuth();

    // MOCK DATA for demonstration - Replace with actual auth logic
    const isAuthenticated = Boolean(localStorage.getItem('token'));
    const userRole = localStorage.getItem('role'); // e.g., 'user', 'owner', 'admin'

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Role-based Access Control (RBAC)
        // If user's role is not in the allowedRoles array, redirect to unauthorized page or home
        return <Navigate to="/unauthorized" replace />;
    }

    // If authorized, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
