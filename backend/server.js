require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Register Models
require('./models/User');
require('./models/Owner');
require('./models/Broker');
require('./models/Admin');
require('./models/Property');

const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const brokerRoutes = require('./routes/brokerRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        if (res.statusCode === 400) {
            console.log(`[${new Date().toISOString()}] 400 BAD REQUEST: ${req.method} ${req.url}`);
            console.log('Headers:', JSON.stringify(req.headers, null, 2));
            // Log body if available (excluding multipart/form-data as it might be large/binary)
            if (!req.headers['content-type']?.includes('multipart/form-data')) {
                console.log('Body:', JSON.stringify(req.body, null, 2));
            } else {
                console.log('Body: Multipart/Form-Data (fields below)');
                console.log(req.body);
            }
        } else {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} (${Date.now() - start}ms)`);
        }
    });
    next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/broker', brokerRoutes);


// Basic Route
app.get('/', (req, res) => {
    res.send('House Rental API is running');
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
