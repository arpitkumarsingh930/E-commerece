const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const Product = require('../models/Product');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', optionalAuth, asyncHandler(async (req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Product.find(JSON.parse(queryStr)).populate('category', 'name');

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.status(200).json({
        success: true,
        count: products.length,
        pagination,
        data: products
    });
}));

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', asyncHandler(async (req, res, next) => {
    const products = await Product.findFeatured();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
}));

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
router.get('/trending', asyncHandler(async (req, res, next) => {
    const products = await Product.findTrending();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
}));

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name')
        .populate('reviews.user', 'name avatar');

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Increment views
    await product.incrementViews();

    res.status(200).json({
        success: true,
        data: product
    });
}));

// @desc    Create new product
// @route   POST /api/products
// @access  Private
router.post('/', protect, authorize('admin', 'moderator'), [
    body('name')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Product name must be between 2 and 200 characters'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('originalPrice')
        .isFloat({ min: 0 })
        .withMessage('Original price must be a positive number'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    body('category')
        .isMongoId()
        .withMessage('Please provide a valid category ID'),
    body('brand')
        .trim()
        .notEmpty()
        .withMessage('Brand is required')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    // Add seller to request body
    req.body.seller = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        data: product
    });
}));

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
router.put('/:id', protect, authorize('admin', 'moderator'), asyncHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this product`, 401));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: product
    });
}));

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
router.delete('/:id', protect, authorize('admin', 'moderator'), asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is product owner or admin
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this product`, 401));
    }

    await product.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
}));

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', asyncHandler(async (req, res, next) => {
    const products = await Product.findFeatured();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
}));

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
router.get('/trending', asyncHandler(async (req, res, next) => {
    const products = await Product.findTrending();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
}));

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
router.get('/new-arrivals', asyncHandler(async (req, res, next) => {
    const products = await Product.findNewArrivals();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
}));

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
// @access  Public
router.get('/best-sellers', asyncHandler(async (req, res, next) => {
    const products = await Product.findBestSellers();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
}));

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
router.get('/search', asyncHandler(async (req, res, next) => {
    const { q, category, minPrice, maxPrice, brand, sort } = req.query;

    if (!q) {
        return next(new ErrorResponse('Please provide a search query', 400));
    }

    const options = {
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        brand,
        sort
    };

    const products = await Product.search(q, options);

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
}));

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('title')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Review title must be between 2 and 100 characters'),
    body('comment')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Review comment must be between 10 and 500 characters')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
        review => review.user.toString() === req.user.id
    );

    if (existingReview) {
        return next(new ErrorResponse('You have already reviewed this product', 400));
    }

    const review = {
        user: req.user.id,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment,
        images: req.body.images || []
    };

    await product.addReview(review);

    res.status(200).json({
        success: true,
        data: product
    });
}));

// @desc    Update product review
// @route   PUT /api/products/:id/reviews/:reviewId
// @access  Private
router.put('/:id/reviews/:reviewId', protect, asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    const review = product.reviews.find(
        review => review._id.toString() === req.params.reviewId
    );

    if (!review) {
        return next(new ErrorResponse(`Review not found with id of ${req.params.reviewId}`, 404));
    }

    // Make sure user owns the review
    if (review.user.toString() !== req.user.id) {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this review`, 401));
    }

    // Update review
    Object.keys(req.body).forEach(key => {
        if (['rating', 'title', 'comment', 'images'].includes(key)) {
            review[key] = req.body[key];
        }
    });

    await product.updateRatings();

    res.status(200).json({
        success: true,
        data: product
    });
}));

// @desc    Delete product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
router.delete('/:id/reviews/:reviewId', protect, asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    const review = product.reviews.find(
        review => review._id.toString() === req.params.reviewId
    );

    if (!review) {
        return next(new ErrorResponse(`Review not found with id of ${req.params.reviewId}`, 404));
    }

    // Make sure user owns the review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this review`, 401));
    }

    await product.removeReview(req.params.reviewId);

    res.status(200).json({
        success: true,
        data: product
    });
}));

module.exports = router; 