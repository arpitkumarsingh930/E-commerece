const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
router.post('/create-payment-intent', protect, [
    body('orderId')
        .isMongoId()
        .withMessage('Please provide a valid order ID')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to access this order', 401));
    }

    if (order.paymentStatus === 'completed') {
        return next(new ErrorResponse('Payment already completed', 400));
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'inr',
        metadata: {
            orderId: order._id.toString(),
            userId: req.user.id
        }
    });

    res.status(200).json({
        success: true,
        data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        }
    });
}));

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
router.post('/confirm', protect, [
    body('paymentIntentId')
        .notEmpty()
        .withMessage('Payment intent ID is required'),
    body('orderId')
        .isMongoId()
        .withMessage('Please provide a valid order ID')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { paymentIntentId, orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to access this order', 401));
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
        // Update order payment status
        order.paymentStatus = 'completed';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Payment confirmed successfully',
            data: order
        });
    } else {
        return next(new ErrorResponse('Payment not completed', 400));
    }
}));

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
router.get('/methods', protect, asyncHandler(async (req, res, next) => {
    const paymentMethods = await stripe.paymentMethods.list({
        customer: req.user.stripeCustomerId,
        type: 'card'
    });

    res.status(200).json({
        success: true,
        data: paymentMethods.data
    });
}));

// @desc    Add payment method
// @route   POST /api/payments/methods
// @access  Private
router.post('/methods', protect, [
    body('paymentMethodId')
        .notEmpty()
        .withMessage('Payment method ID is required')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { paymentMethodId } = req.body;

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: req.user.stripeCustomerId
    });

    res.status(200).json({
        success: true,
        message: 'Payment method added successfully'
    });
}));

// @desc    Remove payment method
// @route   DELETE /api/payments/methods/:paymentMethodId
// @access  Private
router.delete('/methods/:paymentMethodId', protect, asyncHandler(async (req, res, next) => {
    await stripe.paymentMethods.detach(req.params.paymentMethodId);

    res.status(200).json({
        success: true,
        message: 'Payment method removed successfully'
    });
}));

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private
router.post('/refund', protect, [
    body('orderId')
        .isMongoId()
        .withMessage('Please provide a valid order ID'),
    body('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
    body('reason')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Refund reason cannot be empty')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { orderId, amount, reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to process refund', 401));
    }

    if (order.paymentStatus !== 'completed') {
        return next(new ErrorResponse('Payment not completed', 400));
    }

    // Create refund
    const refundAmount = amount ? Math.round(amount * 100) : Math.round(order.total * 100);
    
    const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: refundAmount,
        reason: reason || 'requested_by_customer'
    });

    // Update order
    order.paymentStatus = 'refunded';
    order.refundAmount = refundAmount / 100;
    order.refundReason = reason;
    order.refundedAt = new Date();
    await order.save();

    res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: {
            refundId: refund.id,
            amount: refundAmount / 100,
            status: refund.status
        }
    });
}));

// @desc    Webhook handler
// @route   POST /api/payments/webhook
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: `Webhook Error: ${err.message}`
        });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handlePaymentSuccess(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            await handlePaymentFailure(failedPayment);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
}));

// Helper function to handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
    const orderId = paymentIntent.metadata.orderId;
    
    if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
            order.paymentStatus = 'completed';
            order.stripePaymentIntentId = paymentIntent.id;
            await order.save();
        }
    }
};

// Helper function to handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
    const orderId = paymentIntent.metadata.orderId;
    
    if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
            order.paymentStatus = 'failed';
            order.stripePaymentIntentId = paymentIntent.id;
            await order.save();
        }
    }
};

module.exports = router; 