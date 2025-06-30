const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a category name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name cannot be more than 50 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    image: {
        type: String
    },
    icon: {
        type: String
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    meta: {
        title: String,
        description: String,
        keywords: [String]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent',
    justOne: false
});

// Virtual for products count
categorySchema.virtual('productsCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

// Index for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ sortOrder: 1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
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

// Static method to find root categories
categorySchema.statics.findRoots = function() {
    return this.find({ parent: null, isActive: true })
        .populate('subcategories')
        .sort('sortOrder name');
};

// Static method to find featured categories
categorySchema.statics.findFeatured = function() {
    return this.find({ isFeatured: true, isActive: true })
        .sort('sortOrder name');
};

// Method to get full category path
categorySchema.methods.getPath = async function() {
    const path = [this];
    let current = this;
    
    while (current.parent) {
        current = await this.constructor.findById(current.parent);
        if (current) {
            path.unshift(current);
        } else {
            break;
        }
    }
    
    return path;
};

// Method to get all subcategories recursively
categorySchema.methods.getAllSubcategories = async function() {
    const subcategories = [];
    
    const getSubcategories = async (categoryId) => {
        const children = await this.constructor.find({ parent: categoryId, isActive: true });
        for (const child of children) {
            subcategories.push(child);
            await getSubcategories(child._id);
        }
    };
    
    await getSubcategories(this._id);
    return subcategories;
};

module.exports = mongoose.model('Category', categorySchema); 