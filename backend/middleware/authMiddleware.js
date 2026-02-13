const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Owner = require('../models/Owner');
const Admin = require('../models/Admin');
const Broker = require('../models/Broker');

// Middleware to verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check which collection the user belongs to based on the role in token
            if (decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'owner') {
                req.user = await Owner.findById(decoded.id).select('-password');
            } else if (decoded.role === 'broker') {
                req.user = await Broker.findById(decoded.id).select('-password');
            } else {
                req.user = await User.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to verify User Role (RBAC)
const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this resource`
            });
        }
        next();
    };
};

module.exports = { protect, verifyRole };
