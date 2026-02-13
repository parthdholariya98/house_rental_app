const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Check if we're in development mode (no real Razorpay credentials)
const DEV_MODE = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('...');

let razorpay;
if (!DEV_MODE) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

// @desc    Create Razorpay Order
// @route   POST /api/payments/razorpay/order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;

        // Development Mode - Mock Order
        if (DEV_MODE) {
            const mockOrder = {
                id: `order_DEV${Date.now()}`,
                amount: amount * 100,
                currency: "INR",
                receipt: `receipt_${bookingId}`,
                status: "created"
            };
            console.log('⚠️  DEV MODE: Mock Razorpay order created');
            return res.status(200).json(mockOrder);
        }

        // Production Mode - Real Razorpay
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${bookingId}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, amount } = req.body;

        let isSignatureValid = false;

        // Development Mode - Accept any signature
        if (DEV_MODE) {
            console.log('⚠️  DEV MODE: Auto-accepting payment verification');
            isSignatureValid = true;
        } else {
            // Production Mode - Verify signature
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");
            isSignatureValid = expectedSignature === razorpay_signature;
        }

        if (isSignatureValid) {
            // Save Payment Record
            const payment = new Payment({
                booking: bookingId,
                user: req.user.id,
                amount,
                paymentMethod: 'upi',
                transactionId: razorpay_payment_id,
                status: 'success'
            });
            await payment.save();

            // Update Booking
            const booking = await Booking.findById(bookingId);
            booking.depositStatus = 'paid';
            booking.status = 'paid_confirm_pending'; // Waiting for broker confirmation
            await booking.save();

            res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature (Fake Payment Attempt)" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/stripe/create-intent
// @access  Private
const createStripeIntent = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: 'inr',
            metadata: { bookingId, userId: req.user.id.toString() }
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify Stripe Payment
// @route   POST /api/payments/stripe/verify
// @access  Private
const verifyStripePayment = async (req, res) => {
    try {
        const { paymentIntentId, bookingId } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.bookingId === bookingId) {
            // Check if already paid to prevent double entry
            const existingPayment = await Payment.findOne({ transactionId: paymentIntentId });
            if (existingPayment) return res.status(400).json({ message: 'Payment already recorded' });

            const payment = new Payment({
                booking: bookingId,
                user: req.user.id,
                amount: paymentIntent.amount / 100,
                paymentMethod: 'card',
                transactionId: paymentIntentId,
                status: 'success'
            });
            await payment.save();

            const booking = await Booking.findById(bookingId);
            booking.depositStatus = 'paid';
            await booking.save();

            res.status(200).json({ success: true, message: 'Stripe payment verified' });
        } else {
            res.status(400).json({ success: false, message: 'Stripe payment failed or invalid' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payment history for user
const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id }).populate('booking');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    createStripeIntent,
    verifyStripePayment,
    getMyPayments
};
