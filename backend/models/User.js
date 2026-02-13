const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'user', // Always user
    },
    isVerified: { type: Boolean, default: false }, // Verification status
    avatar: {
        type: String,
        default: 'https://res.cloudinary.com/dfvffsv0c/image/upload/v1735125586/house_rental_platform/default-avatar_vqc6xj.png'
    },
    phone: String,
    location: String,
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    hiredBroker: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker' },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
