const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true,
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid_confirm_pending', 'cancelled'],
        default: 'pending',
    },
    visitDate: {
        type: Date,
        required: true,
    },
    message: {
        type: String,
    },
    broker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Broker',
    },
    depositStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
    },
    depositAmount: {
        type: Number,
        default: 0,
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'cancelledByModel',
    },
    cancelledByModel: {
        type: String,
        enum: ['User', 'Owner', 'Broker', 'Admin'],
    },
    cancellationReason: {
        type: String,
    },
    cancelledAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Booking', bookingSchema);
