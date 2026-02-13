const User = require('../models/User');
const Owner = require('../models/Owner');
const Broker = require('../models/Broker');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

// @desc    Get all users, owners, and brokers
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        // Fetch users, owners, and brokers separately
        const users = await User.find({}).select('-password').lean();
        const owners = await Owner.find({}).select('-password').lean();
        const brokers = await Broker.find({}).select('-password').lean();

        // Combine all
        const allUsers = [...users, ...owners, ...brokers];

        // Sort by creation date (newest first)
        allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(allUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify a owner or broker
// @route   PUT /api/admin/verify/:id
// @access  Private (Admin)
const verifyOwner = async (req, res) => {
    try {
        // Try Owner
        let account = await Owner.findById(req.params.id);
        if (account) {
            account.isVerified = true;
            await account.save();
            return res.json({ message: 'Owner verified successfully' });
        }

        // Try Broker
        account = await Broker.findById(req.params.id);
        if (account) {
            account.isVerified = true;
            await account.save();
            return res.json({ message: 'Broker verified successfully' });
        }

        res.status(404).json({ message: 'User not found' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Delete a user, owner, or broker
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        // Try to find in User first
        let user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            return res.json({ message: 'User removed' });
        }

        // Check Owner
        user = await Owner.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            return res.json({ message: 'Owner removed' });
        }

        // Check Broker
        user = await Broker.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            return res.json({ message: 'Broker removed' });
        }

        res.status(404).json({ message: 'User not found' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// @desc    Get all properties
// @route   GET /api/admin/properties
// @access  Private (Admin)
const getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find({})
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a property
// @route   DELETE /api/admin/properties/:id
// @access  Private (Admin)
const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (property) {
            await property.deleteOne();
            res.json({ message: 'Property removed' });
        } else {
            res.status(404).json({ message: 'Property not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin)
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('tenant', 'name email')
            .populate('property', 'title location')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllUsers, verifyOwner, deleteUser, getAllProperties, deleteProperty, getAllBookings };
