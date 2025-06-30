const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
    const users = await User.find().select('-password');

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
}));

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Please provide a valid 10-digit phone number')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const fieldsToUpdate = {
        name: req.body.name,
        phone: req.body.phone
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
        fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    });
}));

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
router.post('/addresses', protect, [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    body('phone')
        .matches(/^[0-9]{10}$/)
        .withMessage('Please provide a valid 10-digit phone number'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    body('pincode')
        .matches(/^[0-9]{6}$/)
        .withMessage('Please provide a valid 6-digit pincode')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const user = await User.findById(req.user.id);
    await user.addAddress(req.body);

    res.status(200).json({
        success: true,
        data: user.addresses
    });
}));

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
router.put('/addresses/:addressId', protect, [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty'),
    body('phone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Please provide a valid 10-digit phone number'),
    body('address')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Address cannot be empty'),
    body('city')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('City cannot be empty'),
    body('state')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('State cannot be empty'),
    body('pincode')
        .optional()
        .matches(/^[0-9]{6}$/)
        .withMessage('Please provide a valid 6-digit pincode')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const user = await User.findById(req.user.id);
    await user.updateAddress(req.params.addressId, req.body);

    res.status(200).json({
        success: true,
        data: user.addresses
    });
}));

// @desc    Remove address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
router.delete('/addresses/:addressId', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    await user.removeAddress(req.params.addressId);

    res.status(200).json({
        success: true,
        data: user.addresses
    });
}));

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
router.get('/addresses', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user.addresses
    });
}));

// @desc    Add to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
router.post('/wishlist/:productId', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    await user.addToWishlist(req.params.productId);

    res.status(200).json({
        success: true,
        data: user.wishlist
    });
}));

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
router.delete('/wishlist/:productId', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    await user.removeFromWishlist(req.params.productId);

    res.status(200).json({
        success: true,
        data: user.wishlist
    });
}));

// @desc    Get wishlist
// @route   GET /api/users/wishlist
// @access  Private
router.get('/wishlist', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id)
        .populate('wishlist', 'name price originalPrice images stock');

    res.status(200).json({
        success: true,
        data: user.wishlist
    });
}));

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', protect, [
    body('notifications.email')
        .optional()
        .isBoolean()
        .withMessage('Email notification preference must be boolean'),
    body('notifications.sms')
        .optional()
        .isBoolean()
        .withMessage('SMS notification preference must be boolean'),
    body('notifications.push')
        .optional()
        .isBoolean()
        .withMessage('Push notification preference must be boolean'),
    body('currency')
        .optional()
        .isIn(['INR', 'USD', 'EUR'])
        .withMessage('Please provide a valid currency'),
    body('language')
        .optional()
        .isIn(['en', 'hi', 'ta', 'te'])
        .withMessage('Please provide a valid language')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const user = await User.findByIdAndUpdate(req.user.id, {
        preferences: req.body.preferences
    }, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user.preferences
    });
}));

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const newUsersThisMonth = await User.countDocuments({
        createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
    });

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            activeUsers,
            verifiedUsers,
            newUsersThisMonth
        }
    });
}));

module.exports = router; 