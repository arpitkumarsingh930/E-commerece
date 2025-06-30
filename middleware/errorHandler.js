const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error(err.stack.red);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const message = `${field} already exists with value: ${value}`;
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new ErrorResponse(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new ErrorResponse(message, 401);
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File size too large';
        error = new ErrorResponse(message, 400);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field';
        error = new ErrorResponse(message, 400);
    }

    // Stripe errors
    if (err.type === 'StripeCardError') {
        const message = err.message;
        error = new ErrorResponse(message, 400);
    }

    if (err.type === 'StripeInvalidRequestError') {
        const message = 'Invalid payment request';
        error = new ErrorResponse(message, 400);
    }

    // Rate limit errors
    if (err.status === 429) {
        const message = 'Too many requests, please try again later';
        error = new ErrorResponse(message, 429);
    }

    // Network errors
    if (err.code === 'ENOTFOUND') {
        const message = 'Network error - unable to connect';
        error = new ErrorResponse(message, 500);
    }

    // Timeout errors
    if (err.code === 'ETIMEDOUT') {
        const message = 'Request timeout';
        error = new ErrorResponse(message, 408);
    }

    // Default error
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    });
};

module.exports = errorHandler; 