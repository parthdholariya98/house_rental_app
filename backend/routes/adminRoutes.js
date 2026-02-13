const express = require('express');
const router = express.Router();
const { getAllUsers, verifyOwner, deleteUser, getAllProperties, deleteProperty, getAllBookings } = require('../controllers/adminController');
const { protect, verifyRole } = require('../middleware/authMiddleware');

router.get('/users', protect, verifyRole(['admin']), getAllUsers);
router.put('/verify/:id', protect, verifyRole(['admin']), verifyOwner);
router.delete('/users/:id', protect, verifyRole(['admin']), deleteUser);

// Property Routes
router.get('/properties', protect, verifyRole(['admin']), getAllProperties);
router.delete('/properties/:id', protect, verifyRole(['admin']), deleteProperty);

// Booking Routes
router.get('/bookings', protect, verifyRole(['admin']), getAllBookings);

module.exports = router;
