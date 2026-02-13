const Broker = require('../models/Broker');
const User = require('../models/User');

// @desc    Get all clients hired this broker
// @route   GET /api/broker/clients
// @access  Private (Broker)
const getMyClients = async (req, res) => {
    try {
        const broker = await Broker.findById(req.user._id).populate('clients', 'name email phone avatar location');
        if (!broker) {
            return res.status(404).json({ message: 'Broker not found' });
        }
        res.json(broker.clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMyClients };
