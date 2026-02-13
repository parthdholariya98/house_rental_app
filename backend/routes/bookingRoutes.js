const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus, updateDepositStatus, payBookingDeposit, cancelBooking } = require('../controllers/bookingController');
const { protect, verifyRole } = require('../middleware/authMiddleware');

router.post('/', protect, verifyRole(['user']), createBooking);
router.get('/', protect, getBookings);
router.put('/:id', protect, verifyRole(['owner', 'broker']), updateBookingStatus);
router.put('/:id/deposit', protect, verifyRole(['broker', 'owner']), updateDepositStatus);

// Pay Deposit Route
router.post('/:id/pay', protect, payBookingDeposit);

// Cancel Booking Route
router.put('/:id/cancel', protect, cancelBooking);


module.exports = router;
