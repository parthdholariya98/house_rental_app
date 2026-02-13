const Message = require('../models/Message');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    const { receiverId, receiverModel, content, propertyId } = req.body;

    try {
        const senderRole = req.user.role; // user, owner, broker, admin
        const senderModel = req.user.role === 'user' ? 'User' : (req.user.role === 'owner' ? 'Owner' : (req.user.role === 'broker' ? 'Broker' : 'Admin'));

        // Logic: Role-to-Role chat is disabled. One of them MUST be a 'User'.
        if (senderModel !== 'User' && receiverModel !== 'User') {
            return res.status(403).json({
                message: 'Direct chat between Partners (Owners/Brokers) is disabled. You can only chat with Potential Tenants.'
            });
        }

        const message = new Message({
            sender: req.user._id,
            senderModel,
            receiver: receiverId,
            receiverModel,
            content,
            property: propertyId
        });

        const savedMessage = await message.save();
        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get my messages (inbox/sent)
// @route   GET /api/messages
// @access  Private
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
            ]
        })
            .populate('sender', 'name email avatar')
            .populate('receiver', 'name email avatar')
            .populate('property', 'title')
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (message && message.receiver.toString() === req.user._id.toString()) {
            message.isRead = true;
            await message.save();
            res.json({ message: 'Marked as read' });
        } else {
            res.status(404).json({ message: 'Message not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { sendMessage, getMessages, markAsRead };
