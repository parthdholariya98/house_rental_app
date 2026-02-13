const User = require('../models/User');
const Broker = require('../models/Broker');

// @desc    Hire a broker
// @route   PUT /api/users/hire-broker
// @access  Private (User)
const hireBroker = async (req, res) => {
    const { brokerId } = req.body;

    try {
        const broker = await Broker.findById(brokerId);
        if (!broker) {
            return res.status(404).json({ message: 'Broker not found' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.hiredBroker = brokerId;
        await user.save();

        // Add user to broker's clients if not already there
        if (!broker.clients.includes(user._id)) {
            broker.clients.push(user._id);
            await broker.save();
        }

        res.json({ message: 'Broker hired successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all brokers
// @route   GET /api/users/brokers
// @access  Private
const getBrokers = async (req, res) => {
    try {
        const brokers = await Broker.find({}).select('-password');
        res.json(brokers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { hireBroker, getBrokers, getMe };
