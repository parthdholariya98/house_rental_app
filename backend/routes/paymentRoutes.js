const express = require('express');
const router = express.Router();
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    createStripeIntent,
    verifyStripePayment,
    getMyPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/verify', protect, verifyStripePayment);
router.get('/my-payments', protect, getMyPayments);

module.exports = router;
