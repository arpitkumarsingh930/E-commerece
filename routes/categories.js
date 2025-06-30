const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', asyncHandler(async (req, res, next) => {
    const categories = await Category.find({ isActive: true }).sort('name');

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
}));

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: category
    });
}));

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
router.post('/', protect, authorize('admin'), [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot be more than 500 characters')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
        success: true,
        data: category
    });
}));

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
router.put('/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
    let category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: category
    });
}));

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
    }

    await category.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
}));

module.exports = router; 