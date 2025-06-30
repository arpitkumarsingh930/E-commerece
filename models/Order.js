const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
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
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    }
});

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: String
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cod', 'card', 'upi', 'netbanking']
    },
    paymentStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'completed', 'failed', 'refunded']
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: [0, 'Shipping cost cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    },
    couponCode: String,
    trackingNumber: String,
    notes: String,
    statusHistory: [statusHistorySchema],
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for items count
orderSchema.virtual('itemsCount').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for discount percentage
orderSchema.virtual('discountPercentage').get(function() {
    if (this.subtotal > 0) {
        return Math.round((this.discount / this.subtotal) * 100);
    }
    return 0;
});

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Index for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.product': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Get count of orders for today
        const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        const orderCount = await this.constructor.countDocuments({
            createdAt: { $gte: todayStart, $lt: todayEnd }
        });
        
        const sequence = (orderCount + 1).toString().padStart(4, '0');
        this.orderNumber = `FK${year}${month}${day}${sequence}`;
    }
    next();
});

// Pre-save middleware to add initial status to history
orderSchema.pre('save', function(next) {
    if (this.isNew && this.statusHistory.length === 0) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            updatedBy: this.user,
            notes: 'Order created'
        });
    }
    next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(status, updatedBy, notes = '') {
    this.status = status;
    this.statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy,
        notes
    });

    // Set specific timestamps based on status
    if (status === 'delivered') {
        this.deliveredAt = new Date();
    } else if (status === 'cancelled') {
        this.cancelledAt = new Date();
        this.cancelledBy = updatedBy;
    }

    return this.save();
};

// Method to calculate estimated delivery
orderSchema.methods.calculateEstimatedDelivery = function() {
    const deliveryDays = {
        'pending': 7,
        'confirmed': 6,
        'processing': 5,
        'shipped': 3,
        'delivered': 0,
        'cancelled': 0
    };

    const days = deliveryDays[this.status] || 7;
    this.estimatedDelivery = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.save();
};

// Method to get order summary
orderSchema.methods.getSummary = function() {
    return {
        orderNumber: this.orderNumber,
        itemsCount: this.itemsCount,
        subtotal: this.subtotal,
        shippingCost: this.shippingCost,
        discount: this.discount,
        total: this.total,
        status: this.status,
        paymentStatus: this.paymentStatus
    };
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId) {
    return this.find({ user: userId })
        .populate('items.product', 'name images')
        .sort('-createdAt');
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
    return this.find({ status })
        .populate('user', 'name email')
        .populate('items.product', 'name images')
        .sort('-createdAt');
};

// Static method to get order statistics
orderSchema.statics.getStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$total' }
            }
        }
    ]);
};

// Static method to get revenue statistics
orderSchema.statics.getRevenueStats = function(startDate, endDate) {
    const matchStage = {};
    if (startDate && endDate) {
        matchStage.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    matchStage.status = { $ne: 'cancelled' };

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                revenue: { $sum: '$total' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
};

module.exports = mongoose.model('Order', orderSchema); 