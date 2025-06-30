const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    images: [{
        type: String
    }],
    helpful: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        helpful: {
            type: Boolean,
            default: true
        }
    }],
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const variantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    images: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
        maxlength: [200, 'Product name cannot be more than 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a product description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    shortDescription: {
        type: String,
        maxlength: [200, 'Short description cannot be more than 200 characters']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: String,
        required: [true, 'Please provide a brand name']
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        required: [true, 'Please provide original price'],
        min: [0, 'Original price cannot be negative']
    },
    discount: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot be more than 100%']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    variants: [variantSchema],
    specifications: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    features: [{
        type: String
    }],
    tags: [{
        type: String,
        lowercase: true
    }],
    stock: {
        type: Number,
        required: [true, 'Please provide stock quantity'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    weight: {
        type: Number,
        min: [0, 'Weight cannot be negative']
    },
    dimensions: {
        length: {
            type: Number,
            min: [0, 'Length cannot be negative']
        },
        width: {
            type: Number,
            min: [0, 'Width cannot be negative']
        },
        height: {
            type: Number,
            min: [0, 'Height cannot be negative']
        }
    },
    shipping: {
        weight: {
            type: Number,
            min: [0, 'Shipping weight cannot be negative']
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        freeShipping: {
            type: Boolean,
            default: false
        },
        shippingCost: {
            type: Number,
            min: [0, 'Shipping cost cannot be negative'],
            default: 0
        }
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        },
        distribution: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 }
        }
    },
    reviews: [reviewSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isTrending: {
        type: Boolean,
        default: false
    },
    isNewArrival: {
        type: Boolean,
        default: false
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    warranty: {
        type: String
    },
    returnPolicy: {
        type: String
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Virtual for in stock status
productSchema.virtual('inStock').get(function() {
    return this.stock > 0;
});

// Virtual for low stock status
productSchema.virtual('lowStock').get(function() {
    return this.stock > 0 && this.stock <= 10;
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
    if (!this.isModified('name')) {
        return next();
    }
    
    this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    
    next();
});

// Pre-save middleware to calculate discount
productSchema.pre('save', function(next) {
    if (this.originalPrice > this.price) {
        this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    } else {
        this.discount = 0;
    }
    next();
});

// Method to update ratings
productSchema.methods.updateRatings = function() {
    if (this.reviews.length === 0) {
        this.ratings.average = 0;
        this.ratings.count = 0;
        this.ratings.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        return this.save();
    }

    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.ratings.count = this.reviews.length;

    // Calculate rating distribution
    this.ratings.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach(review => {
        this.ratings.distribution[review.rating]++;
    });

    return this.save();
};

// Method to add review
productSchema.methods.addReview = async function(reviewData) {
    this.reviews.push(reviewData);
    await this.updateRatings();
    return this;
};

// Method to remove review
productSchema.methods.removeReview = async function(reviewId) {
    this.reviews = this.reviews.filter(review => review._id.toString() !== reviewId);
    await this.updateRatings();
    return this;
};

// Method to update stock
productSchema.methods.updateStock = function(quantity) {
    this.stock = Math.max(0, this.stock + quantity);
    return this.save();
};

// Method to increment views
productSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Method to increment sales
productSchema.methods.incrementSales = function(quantity = 1) {
    this.sales += quantity;
    return this.save();
};

// Static method to find featured products
productSchema.statics.findFeatured = function() {
    return this.find({ isFeatured: true, isActive: true })
        .populate('category', 'name')
        .sort('-createdAt');
};

// Static method to find trending products
productSchema.statics.findTrending = function() {
    return this.find({ isTrending: true, isActive: true })
        .populate('category', 'name')
        .sort('-views');
};

// Static method to find new arrivals
productSchema.statics.findNewArrivals = function() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.find({
        isNewArrival: true,
        isActive: true,
        createdAt: { $gte: thirtyDaysAgo }
    })
    .populate('category', 'name')
    .sort('-createdAt');
};

// Static method to find best sellers
productSchema.statics.findBestSellers = function() {
    return this.find({ isBestSeller: true, isActive: true })
        .populate('category', 'name')
        .sort('-sales');
};

// Static method to search products
productSchema.statics.search = function(query, options = {}) {
    const searchQuery = {
        $and: [
            { isActive: true },
            {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } },
                    { brand: { $regex: query, $options: 'i' } }
                ]
            }
        ]
    };

    if (options.category) {
        searchQuery.$and.push({ category: options.category });
    }

    if (options.minPrice !== undefined) {
        searchQuery.$and.push({ price: { $gte: options.minPrice } });
    }

    if (options.maxPrice !== undefined) {
        searchQuery.$and.push({ price: { $lte: options.maxPrice } });
    }

    if (options.brand) {
        searchQuery.$and.push({ brand: { $regex: options.brand, $options: 'i' } });
    }

    return this.find(searchQuery)
        .populate('category', 'name')
        .sort(options.sort || '-createdAt');
};

module.exports = mongoose.model('Product', productSchema); 