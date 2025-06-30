const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flipkart';

async function addMoreProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find existing category
    let category = await Category.findOne({ name: 'Smartphones' });
    if (!category) {
      category = await Category.create({
        name: 'Smartphones',
        description: 'All kinds of smartphones',
      });
    }

    // Find existing seller
    const seller = await User.findOne({ email: 'seller@example.com' });
    if (!seller) {
      console.log('No seller found, please run the main seed script first');
      return;
    }

    // Check if we already have enough products
    const existingCount = await Product.countDocuments();
    if (existingCount >= 5) {
      console.log(`Already have ${existingCount} products in database`);
      return;
    }

    const newProducts = [
      {
        name: "Samsung Galaxy S24",
        description: "Latest Samsung flagship with AI features.",
        shortDescription: "Samsung's latest flagship.",
        category: category._id,
        brand: "Samsung",
        price: 899,
        originalPrice: 999,
        discount: 10,
        images: [{
          url: "https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-s928-sm-s928bztqins-thumb-539573983",
          alt: "Galaxy S24",
          isPrimary: true
        }],
        features: ["5G", "AMOLED Display", "AI Camera"],
        tags: ["samsung", "galaxy", "smartphone"],
        stock: 20,
        sku: "GALAXY24-001",
        seller: seller._id,
        isFeatured: true
      },
      {
        name: "Google Pixel 8",
        description: "Google's latest Pixel with advanced AI photography.",
        shortDescription: "Latest Google Pixel.",
        category: category._id,
        brand: "Google",
        price: 699,
        originalPrice: 799,
        discount: 12.5,
        images: [{
          url: "https://lh3.googleusercontent.com/AdK42YsO_9TJHlUNJb3Aex9L-SQ7ByJhGCJ3VnB_XyfuS8Z5y-q8l0kGnCvqOr4X_bWJ=w1920-h1080",
          alt: "Pixel 8",
          isPrimary: true
        }],
        features: ["5G", "AI Photography", "Pure Android"],
        tags: ["google", "pixel", "smartphone"],
        stock: 15,
        sku: "PIXEL8-001",
        seller: seller._id,
        isTrending: true
      },
      {
        name: "OnePlus 12",
        description: "Flagship killer with premium features at competitive price.",
        shortDescription: "OnePlus flagship device.",
        category: category._id,
        brand: "OnePlus",
        price: 799,
        originalPrice: 899,
        discount: 11,
        images: [{
          url: "https://oasis.opstatics.com/content/dam/oasis/page/2023/global/products/find-n3/pc/find-n3-hero-image.png",
          alt: "OnePlus 12",
          isPrimary: true
        }],
        features: ["5G", "120Hz Display", "Fast Charging"],
        tags: ["oneplus", "flagship", "smartphone"],
        stock: 30,
        sku: "ONEPLUS12-001",
        seller: seller._id,
        isNewArrival: true
      }
    ];

    for (const productData of newProducts) {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (!existingProduct) {
        await Product.create(productData);
        console.log(`✅ Created product: ${productData.name}`);
      } else {
        console.log(`⚠️ Product already exists: ${productData.name}`);
      }
    }

    console.log('🎉 Additional products added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding products:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addMoreProducts();
