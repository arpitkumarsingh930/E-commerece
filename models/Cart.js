const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    variant: {
        name: String,
        value: String
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    coupon: {
        code: String,
        discount: Number,
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage'
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('itemsCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Virtual for discount amount
cartSchema.virtual('discountAmount').get(function() {
    if (!this.coupon) return 0;
    
    if (this.coupon.type === 'percentage') {
        return (this.subtotal * this.coupon.discount) / 100;
    } else {
        return this.coupon.discount;
    }
});

// Virtual for total
cartSchema.virtual('total').get(function() {
    return this.subtotal - this.discountAmount;
});

// Index for better query performance
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });

// Pre-save middleware to update lastUpdated
cartSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, price, variant = null) {
    const existingItemIndex = this.items.findIndex(
        item => item.product.toString() === productId.toString() &&
                (!variant || JSON.stringify(item.variant) === JSON.stringify(variant))
    );

    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += quantity;
    } else {
        this.items.push({
            product: productId,
            quantity,
            price,
            variant
        });
    }

    return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
    const item = this.items.id(itemId);
    if (item) {
        item.quantity = quantity;
        return this.save();
    }
    throw new Error('Item not found in cart');
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
    this.items = this.items.filter(item => item._id.toString() !== itemId);
    return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
    this.coupon = null;
    return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discount, type) {
    this.coupon = {
        code: couponCode,
        discount,
        type
    };
    return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
    this.coupon = null;
    return this.save();
};

// Method to check if cart is empty
cartSchema.methods.isEmpty = function() {
    return this.items.length === 0;
};

// Method to get cart summary
cartSchema.methods.getSummary = function() {
    return {
        itemsCount: this.itemsCount,
        subtotal: this.subtotal,
        discount: this.discountAmount,
        total: this.total
    };
};

// Static method to find cart by user
cartSchema.statics.findByUser = function(userId) {
    return this.findOne({ user: userId }).populate('items.product');
};

// Static method to create or get cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
    let cart = await this.findOne({ user: userId });
    
    if (!cart) {
        cart = await this.create({ user: userId, items: [] });
    }
    
    return cart;
};

module.exports = mongoose.model('Cart', cartSchema); 