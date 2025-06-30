const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, asyncHandler(async (req, res, next) => {
    let query;

    if (req.user.role === 'admin') {
        query = Order.find().populate('user', 'name email');
    } else {
        query = Order.find({ user: req.user.id });
    }

    const orders = await query
        .populate('items.product', 'name images')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
}));

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res, next) => {
    let order;

    if (req.user.role === 'admin') {
        order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.product', 'name images price');
    } else {
        order = await Order.findById(req.params.id)
            .populate('items.product', 'name images price');
        
        if (order && order.user.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized to access this order', 401));
        }
    }

    if (!order) {
        return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: order
    });
}));

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, [
    body('shippingAddress')
        .isObject()
        .withMessage('Shipping address is required'),
    body('paymentMethod')
        .isIn(['cod', 'card', 'upi', 'netbanking'])
        .withMessage('Please provide a valid payment method')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { shippingAddress, paymentMethod, couponCode } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id })
        .populate('items.product', 'name price stock');

    if (!cart || cart.items.length === 0) {
        return next(new ErrorResponse('Cart is empty', 400));
    }

    // Validate stock and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
        const product = item.product;
        
        if (!product.isActive) {
            return next(new ErrorResponse(`Product ${product.name} is no longer available`, 400));
        }

        if (product.stock < item.quantity) {
            return next(new ErrorResponse(`Insufficient stock for ${product.name}`, 400));
        }

        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
            product: product._id,
            name: product.name,
            quantity: item.quantity,
            price: item.price,
            total: itemTotal
        });
    }

    // Calculate shipping cost
    const shippingCost = subtotal > 1000 ? 0 : 100; // Free shipping above ₹1000

    // Calculate discount
    let discount = 0;
    if (couponCode) {
        // Apply coupon logic here
        discount = Math.min(subtotal * 0.1, 500); // 10% off, max ₹500
    }

    const total = subtotal + shippingCost - discount;

    // Create order
    const order = await Order.create({
        user: req.user.id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingCost,
        discount,
        total,
        couponCode
    });

    // Update product stock
    for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.product._id, {
            $inc: { stock: -item.quantity, sales: item.quantity }
        });
    }

    // Clear cart
    await cart.clearCart();

    // Populate order details
    await order.populate('items.product', 'name images');

    res.status(201).json({
        success: true,
        data: order
    });
}));

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), [
    body('status')
        .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Please provide a valid order status')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    const { status, trackingNumber, notes } = req.body;

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = notes;

    // Add status update to history
    order.statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy: req.user.id,
        notes
    });

    await order.save();

    res.status(200).json({
        success: true,
        data: order
    });
}));

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to cancel this order', 401));
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
        return next(new ErrorResponse('Order cannot be cancelled at this stage', 400));
    }

    order.status = 'cancelled';
    order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        updatedBy: req.user.id,
        notes: 'Order cancelled by user'
    });

    // Restore product stock
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, sales: -item.quantity }
        });
    }

    await order.save();

    res.status(200).json({
        success: true,
        data: order
    });
}));

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
    const stats = await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$total' }
            }
        }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            stats,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        }
    });
}));

module.exports = router; 