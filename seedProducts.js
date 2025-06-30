const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flipkart';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 1. Create a sample category
    let category = await Category.findOne({ name: 'Smartphones' });
    if (!category) {
      category = await Category.create({
        name: 'Smartphones',
        description: 'All kinds of smartphones',
      });
    }

    // 2. Create a sample user (seller)
    const seller = await User.create({
      name: 'Admin Seller',
      email: 'seller@example.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'admin'
    });

    // 3. Insert products
    const products = [
      {
        name: "Apple iPhone 15",
        slug: "apple-iphone-15",
        description: "The latest iPhone with advanced features.",
        shortDescription: "Latest Apple iPhone.",
        category: category._id,
        brand: "Apple",
        price: 999,
        originalPrice: 1099,
        discount: 10,
        images: [
          {
            url: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-model-unselect-gallery-1-202309?wid=5120&hei=2880&fmt=jpeg&qlt=80&.v=1692923778669",
            alt: "iPhone 15",
            isPrimary: true
          }
        ],
        stock: 25,
        sku: "IPHONE15-001",
        seller: seller._id,
        features: ["5G", "OLED Display", "Triple Camera"],
        tags: ["apple", "iphone", "smartphone"]
      },
      {
        name: "Samsung Galaxy S23",
        slug: "samsung-galaxy-s23",
        description: "Flagship Samsung phone with stunning display.",
        shortDescription: "Flagship Samsung phone.",
        category: category._id,
        brand: "Samsung",
        price: 899,
        originalPrice: 999,
        discount: 10,
        images: [
          {
            url: "https://images.samsung.com/is/image/samsung/p6pim/in/sm-s911bzvdinu/gallery/in-galaxy-s23-s911-447678-sm-s911bzvdinu-534192991?$650_519_PNG$",
            alt: "Galaxy S23",
            isPrimary: true
          }
        ],
        stock: 30,
        sku: "SAMS23-001",
        seller: seller._id,
        features: ["AMOLED", "Triple Camera", "Fast Charging"],
        tags: ["samsung", "galaxy", "smartphone"]
      }
    ];

    await Product.deleteMany({});
    await Product.insertMany(products);

    console.log('✅ Sample categories, user, and products inserted!');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
  }
}

seed();
