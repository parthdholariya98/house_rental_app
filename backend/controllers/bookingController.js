const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const sendEmail = require('../utils/sendEmail');

// Helper to send Slot Confirmation Email
const sendSlotConfirmationEmail = async (bookingId) => {
    try {
        const fullBooking = await Booking.findById(bookingId)
            .populate('property')
            .populate('tenant', 'name email');

        if (!fullBooking || !fullBooking.tenant || !fullBooking.tenant.email) {
            console.error(`[Email Error] Missing booking/tenant data for ID: ${bookingId}`);
            return;
        }

        const propertyTitle = fullBooking.property ? fullBooking.property.title : 'Property';
        const propertyLocation = fullBooking.property ? fullBooking.property.location : 'Details available locally';

        const isOwner = fullBooking.property?.posterModel === 'Owner';
        const posterTitle = isOwner ? 'Property Owner' : 'Broker';

        await sendEmail({
            email: fullBooking.tenant.email,
            subject: `Slot Confirmed: ${propertyTitle} - RentalHub`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                    <div style="background-color: #4f46e5; padding: 30px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Visit Slot Confirmed!</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">Great news! Your booking has been approved.</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hi <b>${fullBooking.tenant.name}</b>,</p>
                        <p style="color: #475569; line-height: 1.6;">Your visit request for <b>${propertyTitle}</b> has been officially confirmed by the ${posterTitle}.</p>
                        
                        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 25px; border-radius: 12px; margin: 25px 0;">
                            <h3 style="margin: 0 0 15px; color: #4f46e5; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Visit Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">📅 Date</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${new Date(fullBooking.visitDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📍 Location</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${propertyLocation}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">👤 Managed By</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${posterTitle}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="color: #475569; line-height: 1.6; font-size: 15px;">
                            ${isOwner
                    ? "Since this is a direct listing from the owner, you can proceed to the visit directly at the scheduled time."
                    : "Your deposit has been verified, and your slot is now reserved with the broker."}
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0 20px;">
                            <a href="http://localhost:5173/bookings" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">View Booking Status</a>
                        </div>
                    </div>
                    
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} RentalHub. All rights reserved.</p>
                        <p style="margin: 5px 0 0;">This is an automated confirmation email. Please do not reply.</p>
                    </div>
                </div>
            `
        });
    } catch (err) {
        console.error('Slot Confirmation Email Error:', err.message);
    }
};

// Helper to send Booking Cancellation Email
const sendBookingCancellationEmail = async (bookingId) => {
    try {
        const fullBooking = await Booking.findById(bookingId)
            .populate('property')
            .populate('tenant', 'name email')
            .populate('cancelledBy', 'name email');

        if (!fullBooking || !fullBooking.tenant || !fullBooking.tenant.email) {
            console.error(`[Email Error] Missing booking/tenant data for ID: ${bookingId}`);
            return;
        }

        const propertyTitle = fullBooking.property ? fullBooking.property.title : 'Property';
        const propertyLocation = fullBooking.property ? fullBooking.property.location : 'N/A';
        const cancelledByName = fullBooking.cancelledBy ? fullBooking.cancelledBy.name : 'System';
        const cancellationReason = fullBooking.cancellationReason || 'No reason provided';

        await sendEmail({
            email: fullBooking.tenant.email,
            subject: `Booking Cancelled: ${propertyTitle} - RentalHub`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                    <div style="background-color: #dc2626; padding: 30px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Booking Cancelled</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">Your booking has been cancelled.</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hi <b>${fullBooking.tenant.name}</b>,</p>
                        <p style="color: #475569; line-height: 1.6;">We regret to inform you that your booking for <b>${propertyTitle}</b> has been cancelled.</p>
                        
                        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 25px; border-radius: 12px; margin: 25px 0;">
                            <h3 style="margin: 0 0 15px; color: #dc2626; font-size: 16px; border-bottom: 1px solid #fecaca; padding-bottom: 5px;">Cancellation Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 140px;">🏠 Property</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${propertyTitle}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📍 Location</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${propertyLocation}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Visit Date</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${new Date(fullBooking.visitDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">👤 Cancelled By</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${cancelledByName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">💬 Reason</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${cancellationReason}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style="color: #475569; line-height: 1.6; font-size: 15px;">
                            ${fullBooking.depositStatus === 'paid'
                    ? 'Your deposit will be refunded within 5-7 business days.'
                    : 'No payment was processed for this booking.'}
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0 20px;">
                            <a href="http://localhost:5173/properties" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Browse Other Properties</a>
                        </div>
                    </div>
                    
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} RentalHub. All rights reserved.</p>
                        <p style="margin: 5px 0 0;">This is an automated notification email. Please do not reply.</p>
                    </div>
                </div>
            `
        });
    } catch (err) {
        console.error('Cancellation Email Error:', err.message);
    }
};

// Helper to send Payment Invoice Email
const sendPaymentInvoiceEmail = async (paymentId) => {
    try {
        const fullPayment = await Payment.findById(paymentId)
            .populate({
                path: 'booking',
                populate: { path: 'property' }
            })
            .populate('user', 'name email');

        if (!fullPayment || !fullPayment.user) return;

        await sendEmail({
            email: fullPayment.user.email,
            subject: `Payment Invoice: ${fullPayment.transactionId} - RentalHub`,
            html: `
                <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 650px; margin: auto; border: 1px solid #edf2f7; border-radius: 20px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
                    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">PAYMENT INVOICE</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Transaction Successful</p>
                    </div>
                    
                    <div style="padding: 40px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #f7fafc; padding-bottom: 20px;">
                            <div>
                                <p style="margin: 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Invoice To</p>
                                <p style="margin: 5px 0 0; color: #2d3748; font-weight: 700; font-size: 18px;">${fullPayment.user.name}</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Transaction ID</p>
                                <p style="margin: 5px 0 0; color: #4f46e5; font-family: monospace; font-weight: 700;">${fullPayment.transactionId}</p>
                            </div>
                        </div>

                        <div style="margin: 30px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #f8fafc;">
                                        <th style="text-align: left; padding: 15px; color: #4a5568; font-size: 14px; border-bottom: 2px solid #edf2f7;">Property Listing</th>
                                        <th style="text-align: right; padding: 15px; color: #4a5568; font-size: 14px; border-bottom: 2px solid #edf2f7;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 20px 15px; border-bottom: 1px solid #edf2f7;">
                                            <p style="margin: 0; color: #2d3748; font-weight: 600;">${fullPayment.booking.property?.title || 'Property'}</p>
                                            <p style="margin: 5px 0 0; color: #718096; font-size: 13px;">Security Deposit Verification</p>
                                        </td>
                                        <td style="padding: 20px 15px; text-align: right; border-bottom: 1px solid #edf2f7;">
                                            <span style="color: #2d3748; font-weight: 700; font-size: 16px;">₹${fullPayment.amount.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td style="padding: 20px 15px; text-align: right; color: #718096; font-weight: 600;">Grand Total</td>
                                        <td style="padding: 20px 15px; text-align: right; color: #4f46e5; font-weight: 800; font-size: 22px;">₹${fullPayment.amount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div style="background-color: #ebf4ff; border-radius: 12px; padding: 20px; margin-top: 20px;">
                            <p style="margin: 0; color: #2c5282; font-size: 14px; line-height: 1.5;">
                                <b>Payment Method:</b> <span style="text-transform: uppercase;">${fullPayment.paymentMethod}</span><br>
                                <b>Status:</b> Completed Successfully<br>
                                <b>Date:</b> ${new Date(fullPayment.createdAt).toLocaleString()}
                            </p>
                        </div>

                        <div style="text-align: center; margin-top: 40px;">
                            <p style="color: #a0aec0; font-size: 13px;">Thank you for choosing RentalHub for your property needs.</p>
                        </div>
                    </div>
                </div>
            `
        });
    } catch (err) {
        console.error('Invoice Email Error:', err.message);
    }
};

// Helper to send Booking Request Received Email
const sendBookingRequestEmail = async (bookingId) => {
    try {
        const fullBooking = await Booking.findById(bookingId)
            .populate('property')
            .populate('tenant', 'name email');

        if (!fullBooking || !fullBooking.tenant) return;

        const propertyTitle = fullBooking.property?.title || 'Property';

        await sendEmail({
            email: fullBooking.tenant.email,
            subject: `Request Received: ${propertyTitle} - RentalHub`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                    <div style="background-color: #f59e0b; padding: 30px; text-align: center; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Booking Request Received</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">We've received your request for <b>${propertyTitle}</b>.</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; color: #1e293b; margin-top: 0;">Hi <b>${fullBooking.tenant.name}</b>,</p>
                        <p style="color: #475569; line-height: 1.6;">Your visit request has been sent to the property owner/broker. They will review it and update your status shortly.</p>
                        
                        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 25px; border-radius: 12px; margin: 25px 0;">
                            <h3 style="margin: 0 0 15px; color: #b45309; font-size: 16px;">What's Next?</h3>
                            <p style="margin: 0; font-size: 14px; color: #92400e;">1. The owner will check availability.<br>2. You will receive another email once approved.<br>3. You can track this in your dashboard.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 35px 0 20px;">
                            <a href="http://localhost:5173/bookings" style="background-color: #f59e0b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Check Booking Dashboard</a>
                        </div>
                    </div>
                </div>
            `
        });
    } catch (err) {
        console.error('Request Received Email Error:', err.message);
    }
};

// @desc    Create a booking request
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res) => {
    const { propertyId, visitDate, message } = req.body;

    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const booking = new Booking({
            property: propertyId,
            tenant: req.user._id,
            visitDate,
            message,
            broker: req.user.hiredBroker || undefined,
            depositAmount: property.deposit || 0,
            depositStatus: 'pending' // pending until paid
        });

        const createdBooking = await booking.save();

        // Trigger Background Email
        sendBookingRequestEmail(createdBooking._id).catch(e => console.error('Background Email Error:', e));

        res.status(201).json(createdBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all bookings (Admin/Owner/User)
const getBookings = async (req, res) => {
    try {
        let bookings;
        if (req.user.role === 'admin') {
            bookings = await Booking.find({})
                .populate('property', 'title location owner posterModel')
                .populate('tenant', 'name email phone');
        } else if (req.user.role === 'owner' || req.user.role === 'broker') {
            const myProperties = await Property.find({ owner: req.user._id });
            const myPropertyIds = myProperties.map(p => p._id);

            bookings = await Booking.find({ property: { $in: myPropertyIds } })
                .populate('property', 'title location owner posterModel')
                .populate('tenant', 'name email phone avatar');
        } else {
            bookings = await Booking.find({ tenant: req.user._id })
                .populate({
                    path: 'property',
                    select: 'title location owner deposit posterModel',
                    populate: { path: 'owner', select: 'name email phone' }
                });
        }
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update booking status (Approve/Reject)
const updateBookingStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const booking = await Booking.findById(req.params.id).populate('property');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const isLister = booking.property.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isLister && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to manage this booking' });
        }

        booking.status = status;
        const updatedBooking = await booking.save();

        if (status === 'approved') {
            // Only send confirmation email immediately if it's an Owner (Direct Deal)
            // For Brokers, we wait for payment
            if (booking.property.posterModel === 'Owner') {
                console.log(`[StatusUpdate] Triggering background email for Owner Booking: ${updatedBooking._id}`);
                sendSlotConfirmationEmail(updatedBooking._id).catch(e => console.error('Background Email Error:', e));
            }
        }

        res.json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update deposit status (Broker/Owner)
const updateDepositStatus = async (req, res) => {
    const { depositStatus, depositAmount } = req.body;

    try {
        const booking = await Booking.findById(req.params.id).populate('property');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const isLister = booking.property.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isLister && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (depositStatus) booking.depositStatus = depositStatus;
        if (depositAmount) booking.depositAmount = depositAmount;

        if (depositStatus === 'paid') {
            // For Brokers, this is the final confirmation
            booking.status = 'paid';
        }

        const updatedBooking = await booking.save();

        if (depositStatus === 'paid') {
            console.log(`[DepositUpdate] Triggering final confirmation email for Booking: ${updatedBooking._id}`);
            sendSlotConfirmationEmail(updatedBooking._id).catch(e => console.error('Background Email Error:', e));
        }

        res.json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Pay Booking Deposit (Simulate)
const payBookingDeposit = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        const booking = await Booking.findById(req.params.id).populate('property');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.tenant.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        let mappedMethod = 'card';
        if (paymentMethod?.includes('UPI')) mappedMethod = 'upi';
        if (paymentMethod?.includes('Net Banking')) mappedMethod = 'netbanking';

        const payment = new Payment({
            booking: booking._id,
            user: req.user._id,
            amount: booking.property?.deposit || 0,
            paymentMethod: mappedMethod,
            transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            status: 'success'
        });

        const savedPayment = await payment.save();
        sendPaymentInvoiceEmail(savedPayment._id).catch(e => console.error('Background Invoice Error:', e));

        booking.depositStatus = 'paid';
        booking.status = 'paid_confirm_pending';
        await booking.save();

        res.json({
            message: 'Payment Recorded! Awaiting final confirmation.',
            booking,
            transactionId: payment.transactionId
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (User/Owner/Broker/Admin)
const cancelBooking = async (req, res) => {
    const { reason } = req.body;

    try {
        const booking = await Booking.findById(req.params.id)
            .populate('property')
            .populate('tenant', 'name email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check authorization
        const isUser = booking.tenant._id.toString() === req.user._id.toString();
        const isOwner = booking.property.owner && booking.property.owner.toString() === req.user._id.toString();
        const isBroker = booking.broker && booking.broker.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isUser && !isOwner && !isBroker && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        // Check if booking can be cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        // Update booking status
        booking.status = 'cancelled';
        booking.cancelledBy = req.user._id;
        booking.cancelledByModel = req.user.role === 'user' ? 'User' :
            req.user.role === 'owner' ? 'Owner' :
                req.user.role === 'broker' ? 'Broker' : 'Admin';
        booking.cancellationReason = reason || 'No reason provided';
        booking.cancelledAt = new Date();

        // If deposit was paid, mark it for refund
        if (booking.depositStatus === 'paid') {
            booking.depositStatus = 'refunded';
        }

        const updatedBooking = await booking.save();

        // Send cancellation email
        console.log(`[CancelBooking] Triggering cancellation email for Booking: ${updatedBooking._id}`);
        sendBookingCancellationEmail(updatedBooking._id).catch(e => console.error('Background Email Error:', e));

        res.json({
            message: 'Booking cancelled successfully',
            booking: updatedBooking
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createBooking, getBookings, updateBookingStatus, updateDepositStatus, payBookingDeposit, cancelBooking };
