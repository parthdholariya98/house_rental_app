const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ownerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'owner' }, // Fixed role
    isVerified: { type: Boolean, default: false }, // Verification status
    avatar: { type: String, default: 'https://res.cloudinary.com/dfvffsv0c/image/upload/v1735125586/house_rental_platform/default-avatar_vqc6xj.png' },
    phone: String,
    location: String,
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: { type: Date, default: Date.now }
});

// Hash password
ownerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) { next(err); }
});

// Compare password
ownerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Owner', ownerSchema);
