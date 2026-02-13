const User = require('../models/User');
const Owner = require('../models/Owner');
const Admin = require('../models/Admin');
const Broker = require('../models/Broker');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user or owner
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check in both collections to prevent duplicate emails across system
        const userExists = await User.findOne({ email });
        const ownerExists = await Owner.findOne({ email });
        const adminExists = await Admin.findOne({ email });
        const brokerExists = await Broker.findOne({ email });

        if (userExists || ownerExists || adminExists || brokerExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let userData = {
            name,
            email,
            password,
            role: role === 'owner' ? 'owner' : (role === 'broker' ? 'broker' : 'user')
        };

        if (req.file) {
            userData.avatar = req.file.path;
        }

        if (role === 'owner') {
            user = await Owner.create(userData);
        } else if (role === 'broker') {
            user = await Broker.create(userData);
        } else {
            user = await User.create(userData);
        }

        if (user) {
            // Send Welcome Email
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Welcome to RentalHub - Account Created!',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h2 style="color: #4f46e5;">Welcome to RentalHub, ${user.name}!</h2>
                            </div>
                            <p>Thank you for joining our platform. Your account has been successfully created.</p>
                            <p>You can now browse premium properties, book visits, and manage your rental journey all in one place.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://localhost:5173" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
                            </div>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #888;">This is an automated message, please do not reply.</p>
                            <p style="font-size: 12px; color: #888;">Best regards,<br>The RentalHub Team</p>
                        </div>
                    `
                });
            } catch (err) {
                console.log('Email missing/error:', err.message);
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                location: user.location,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Login Attempt:', email);
        // Check all collections sequentially
        let user = await User.findOne({ email });
        let role = 'user';

        if (user) console.log('Found in User collection');

        if (!user) {
            user = await Owner.findOne({ email });
            role = 'owner';
            if (user) console.log('Found in Owner collection');
        }

        if (!user) {
            user = await Broker.findOne({ email });
            role = 'broker';
            if (user) console.log('Found in Broker collection');
        }

        if (!user) {
            user = await Admin.findOne({ email });
            role = 'admin';
            if (user) console.log('Found in Admin collection, Hash:', user.password);
        }

        if (!user) {
            console.log('User not found in any collection');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        console.log('Password Match Result:', isMatch);

        if (isMatch) {
            // Send Login Notification
            try {
                await sendEmail({
                    email: user.email,
                    subject: `Welcome Back to RentalHub!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h2 style="color: #4f46e5;">Welcome Back, ${user.name}!</h2>
                            </div>
                            <p>We're glad to see you again. You've successfully logged into your account at <strong>${new Date().toLocaleString()}</strong>.</p>
                            <p>Now you can continue exploring the best rental properties in your area.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://localhost:5173" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; rounded-md: 5px; font-weight: bold;">Browse Properties</a>
                            </div>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #888;">If this wasn't you, please reset your password immediately for security.</p>
                            <p style="font-size: 12px; color: #888;">Best regards,<br>The RentalHub Team</p>
                        </div>
                    `
                });
            } catch (err) {
                console.log('Email missing/error:', err.message);
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || role,
                avatar: user.avatar,
                phone: user.phone,
                location: user.location,
                hiredBroker: user.hiredBroker,
                token: generateToken(user._id, user.role || role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const googleAuth = async (req, res) => {
    const { email, name, photo, role: requestedRole } = req.body;
    try {
        let user = await User.findOne({ email });
        let currentRole = 'user';

        if (!user) {
            user = await Owner.findOne({ email });
            if (user) currentRole = 'owner';
        }

        if (!user) {
            user = await Broker.findOne({ email });
            if (user) currentRole = 'broker';
        }

        if (!user) {
            user = await Admin.findOne({ email });
            if (user) currentRole = 'admin';
        }

        if (user) {
            // Send Welcome Back Email
            try {
                await sendEmail({
                    email: user.email,
                    subject: `Welcome Back to RentalHub!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h2 style="color: #4f46e5;">Welcome Back, ${user.name}!</h2>
                            </div>
                            <p>You've successfully logged into your account via Google at <strong>${new Date().toLocaleString()}</strong>.</p>
                            <p>Now you can continue exploring the best rental properties in your area.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #888;">If this wasn't you, please check your Google Account security settings.</p>
                            <p style="font-size: 12px; color: #888;">Best regards,<br>The RentalHub Team</p>
                        </div>
                    `
                });
            } catch (err) {
                console.log('Login Email Error:', err.message);
            }

            const token = generateToken(user._id, user.role || currentRole);
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || currentRole,
                avatar: user.avatar,
                properties: user.properties,
                token,
            });
        } else {
            const generatedPassword =
                Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8);

            let newUser;
            const finalRole = requestedRole === 'owner' ? 'owner' : (requestedRole === 'broker' ? 'broker' : 'user');

            if (finalRole === 'owner') {
                newUser = new Owner({
                    name: name,
                    email: email,
                    password: generatedPassword,
                    role: 'owner',
                    avatar: photo,
                });
            } else if (finalRole === 'broker') {
                newUser = new Broker({
                    name: name,
                    email: email,
                    password: generatedPassword,
                    role: 'broker',
                    avatar: photo,
                });
            } else {
                newUser = new User({
                    name: name,
                    email: email,
                    password: generatedPassword,
                    role: 'user',
                    avatar: photo,
                });
            }

            await newUser.save();

            // Send Welcome Email for New Google User
            try {
                await sendEmail({
                    email: newUser.email,
                    subject: 'Welcome to RentalHub!',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #4f46e5;">Welcome, ${newUser.name}!</h2>
                            <p>Thank you for joining our platform via Google. Your account has been successfully created.</p>
                            <p>You can now browse properties, hire brokers, and manage your rental journey effortlessly.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #888;">Best regards,<br>The RentalHub Team</p>
                        </div>
                    `
                });
            } catch (err) {
                console.log('Register Email Error:', err.message);
            }

            const token = generateToken(newUser._id, finalRole);
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: finalRole,
                avatar: newUser.avatar,
                token,
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        console.log('--- DB UPDATE START ---');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        const { name, email, phone, location } = req.body;
        let avatar = req.body.avatar;

        if (req.file) {
            avatar = req.file.path; // Cloudinary URL
        }

        const user = req.user;

        if (user) {
            user.name = name || user.name;
            user.email = email || user.email;
            user.avatar = avatar || user.avatar;
            console.log('Setting Avatar to:', user.avatar);

            // Check if these fields exist in schema (they might not yet)
            if (phone !== undefined) user.phone = phone;
            if (location !== undefined) user.location = location;

            const updatedUser = await user.save();
            console.log('User Saved Successfully:', updatedUser.avatar);

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                phone: updatedUser.phone,
                location: updatedUser.location,
                hiredBroker: updatedUser.hiredBroker,
                properties: updatedUser.properties,
                token: generateToken(updatedUser._id, updatedUser.role),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            user = await Owner.findOne({ email });
        }
        if (!user) {
            user = await Broker.findOne({ email });
        }
        if (!user) {
            user = await Admin.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save({ validateBeforeSave: false });

        const resetUrl = `http://localhost:5173/resetpassword/${resetToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                html: `
                    <h1>You have requested a password reset</h1>
                    <p>Please click on the following link to reset your password:</p>
                    <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
                `
            });

            res.status(200).json({ message: 'Email sent' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    try {
        let user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            user = await Owner.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() },
            });
        }

        if (!user) {
            user = await Broker.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() },
            });
        }

        if (!user) {
            user = await Admin.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() },
            });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            message: 'Password reset successful',
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, googleAuth, forgotPassword, resetPassword, updateProfile };
