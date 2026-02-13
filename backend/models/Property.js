const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    deposit: {
        type: Number,
        required: true,
        default: 0
    },
    type: {
        type: String, // e.g., Apartment, House, Villa, Tenament
        required: true,
    },
    bhk: {
        type: Number,
        required: true, // 1, 2, 3 etc.
    },
    amenities: [{
        type: String,
    }],
    images: [{
        type: String, // URLs to images
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'posterModel'
    },
    posterModel: {
        type: String,
        required: true,
        // enum: ['Owner', 'Broker', 'Admin'] // Removed strict enum to prevent validation errors if case mismatches slightly. Logic is handled in controller.
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Property', propertySchema);

