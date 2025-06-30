const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, asyncHandler(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user.id })
        .populate('items.product', 'name price originalPrice images stock sku');

    if (!cart) {
        cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({
        success: true,
        data: cart
    });
}));

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
router.post('/', protect, [
    body('productId')
        .isMongoId()
        .withMessage('Please provide a valid product ID'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { productId, quantity, variant } = req.body;

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
        return next(new ErrorResponse('Product not found or unavailable', 404));
    }

    // Check stock availability
    if (product.stock < quantity) {
        return next(new ErrorResponse('Insufficient stock available', 400));
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user.id,
            items: []
        });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId && 
                (!variant || item.variant === variant)
    );

    if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (product.stock < newQuantity) {
            return next(new ErrorResponse('Insufficient stock available', 400));
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
    } else {
        // Add new item
        cart.items.push({
            product: productId,
            quantity,
            variant,
            price: product.price
        });
    }

    await cart.save();

    // Populate product details
    await cart.populate('items.product', 'name price originalPrice images stock sku');

    res.status(200).json({
        success: true,
        data: cart
    });
}));

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
router.put('/:itemId', protect, [
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
        return next(new ErrorResponse('Cart not found', 404));
    }

    const itemIndex = cart.items.findIndex(
        item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
        return next(new ErrorResponse('Item not found in cart', 404));
    }

    // Check stock availability
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product || product.stock < quantity) {
        return next(new ErrorResponse('Insufficient stock available', 400));
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Populate product details
    await cart.populate('items.product', 'name price originalPrice images stock sku');

    res.status(200).json({
        success: true,
        data: cart
    });
}));

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
router.delete('/:itemId', protect, asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
        return next(new ErrorResponse('Cart not found', 404));
    }

    const itemIndex = cart.items.findIndex(
        item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
        return next(new ErrorResponse('Item not found in cart', 404));
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate product details
    await cart.populate('items.product', 'name price originalPrice images stock sku');

    res.status(200).json({
        success: true,
        data: cart
    });
}));

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
router.delete('/', protect, asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
        return next(new ErrorResponse('Cart not found', 404));
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
        success: true,
        data: cart
    });
}));

// @desc    Get cart summary
// @route   GET /api/cart/summary
// @access  Private
router.get('/summary', protect, asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user.id })
        .populate('items.product', 'name price originalPrice stock');

    if (!cart || cart.items.length === 0) {
        return res.status(200).json({
            success: true,
            data: {
                itemsCount: 0,
                subtotal: 0,
                discount: 0,
                total: 0
            }
        });
    }

    let subtotal = 0;
    let discount = 0;
    let itemsCount = 0;

    cart.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const originalTotal = item.product.originalPrice * item.quantity;
        
        subtotal += itemTotal;
        discount += (originalTotal - itemTotal);
        itemsCount += item.quantity;
    });

    const total = subtotal;

    res.status(200).json({
        success: true,
        data: {
            itemsCount,
            subtotal,
            discount,
            total
        }
    });
}));

module.exports = router; 