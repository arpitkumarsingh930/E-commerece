const express = require('express');
const { query, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const Product = require('../models/Product');
const Category = require('../models/Category');
const { optionalAuth } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Search products
// @route   GET /api/search
// @access  Public
router.get('/', optionalAuth, [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Search query must not be empty'),
    query('category')
        .optional()
        .isMongoId()
        .withMessage('Please provide a valid category ID'),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be a positive number'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be a positive number'),
    query('brand')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Brand must not be empty'),
    query('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    query('sort')
        .optional()
        .isIn(['price_asc', 'price_desc', 'newest', 'oldest', 'rating', 'popularity'])
        .withMessage('Invalid sort option'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const {
        q,
        category,
        minPrice,
        maxPrice,
        brand,
        rating,
        sort,
        page = 1,
        limit = 20
    } = req.query;

    // Build search query
    const searchQuery = { isActive: true };

    // Text search
    if (q) {
        searchQuery.$or = [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } },
            { brand: { $regex: q, $options: 'i' } }
        ];
    }

    // Category filter
    if (category) {
        searchQuery.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
        searchQuery.price = {};
        if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
        if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    // Brand filter
    if (brand) {
        searchQuery.brand = { $regex: brand, $options: 'i' };
    }

    // Rating filter
    if (rating) {
        searchQuery['ratings.average'] = { $gte: parseFloat(rating) };
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
        case 'price_asc':
            sortOptions = { price: 1 };
            break;
        case 'price_desc':
            sortOptions = { price: -1 };
            break;
        case 'newest':
            sortOptions = { createdAt: -1 };
            break;
        case 'oldest':
            sortOptions = { createdAt: 1 };
            break;
        case 'rating':
            sortOptions = { 'ratings.average': -1 };
            break;
        case 'popularity':
            sortOptions = { views: -1 };
            break;
        default:
            sortOptions = { createdAt: -1 };
    }

    // Execute search
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(searchQuery)
        .populate('category', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Product.countDocuments(searchQuery);

    // Calculate pagination
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
        success: true,
        data: products,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            total,
            hasNextPage,
            hasPrevPage,
            limit: parseInt(limit)
        }
    });
}));

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Public
router.get('/suggestions', optionalAuth, [
    query('q')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Search query is required')
], asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { q } = req.query;

    // Get product suggestions
    const productSuggestions = await Product.find({
        isActive: true,
        $or: [
            { name: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } }
        ]
    })
    .select('name brand')
    .limit(5);

    // Get category suggestions
    const categorySuggestions = await Category.find({
        isActive: true,
        name: { $regex: q, $options: 'i' }
    })
    .select('name')
    .limit(3);

    // Get brand suggestions
    const brandSuggestions = await Product.distinct('brand', {
        isActive: true,
        brand: { $regex: q, $options: 'i' }
    }).limit(3);

    res.status(200).json({
        success: true,
        data: {
            products: productSuggestions,
            categories: categorySuggestions,
            brands: brandSuggestions
        }
    });
}));

// @desc    Get search filters
// @route   GET /api/search/filters
// @access  Public
router.get('/filters', optionalAuth, asyncHandler(async (req, res, next) => {
    const { q, category } = req.query;

    // Build base query
    const baseQuery = { isActive: true };
    if (q) {
        baseQuery.$or = [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } },
            { brand: { $regex: q, $options: 'i' } }
        ];
    }
    if (category) {
        baseQuery.category = category;
    }

    // Get price range
    const priceStats = await Product.aggregate([
        { $match: baseQuery },
        {
            $group: {
                _id: null,
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        }
    ]);

    // Get brands
    const brands = await Product.distinct('brand', baseQuery);

    // Get categories
    const categories = await Category.find({ isActive: true })
        .select('name _id')
        .sort('name');

    // Get rating distribution
    const ratingStats = await Product.aggregate([
        { $match: baseQuery },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$ratings.average' },
                totalProducts: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 },
            brands: brands.sort(),
            categories,
            ratingStats: ratingStats[0] || { avgRating: 0, totalProducts: 0 }
        }
    });
}));

// @desc    Get trending searches
// @route   GET /api/search/trending
// @access  Public
router.get('/trending', optionalAuth, asyncHandler(async (req, res, next) => {
    // Get trending products based on views
    const trendingProducts = await Product.find({ isActive: true })
        .select('name brand views')
        .sort({ views: -1 })
        .limit(10);

    // Get popular brands
    const popularBrands = await Product.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$brand',
                count: { $sum: 1 },
                totalViews: { $sum: '$views' }
            }
        },
        { $sort: { totalViews: -1 } },
        { $limit: 5 }
    ]);

    res.status(200).json({
        success: true,
        data: {
            trendingProducts,
            popularBrands
        }
    });
}));

module.exports = router; 