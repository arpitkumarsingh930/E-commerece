# Apple-inspired Flipkart - Minimalist E-commerce

A modern, minimalist e-commerce platform inspired by Apple's design philosophy, featuring smooth animations, glassmorphism effects, and a comprehensive backend API.

## 🌟 Features

### Frontend Features
- **Apple-inspired Design**: Clean, minimalist interface with glassmorphism effects
- **Smooth Animations**: Micro-interactions and transitions throughout the UI
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Search**: Instant product search with suggestions
- **Interactive Cart**: Slide-out cart with real-time updates
- **User Authentication**: Login/register modals with smooth transitions
- **Wishlist Management**: Add/remove products from wishlist
- **Product Filtering**: Grid and list view options
- **Loading States**: Beautiful loading animations and states

### Backend Features
- **RESTful API**: Complete CRUD operations for all entities
- **User Authentication**: JWT-based authentication with email verification
- **Product Management**: Categories, ratings, reviews, and inventory
- **Shopping Cart**: Persistent cart with quantity management
- **Order Processing**: Complete order lifecycle management
- **Payment Integration**: Stripe payment gateway integration
- **Search & Filtering**: Advanced search with multiple filters
- **Email Notifications**: Order confirmations and password reset
- **Security**: Rate limiting, CORS, input validation
- **Database**: MongoDB with Mongoose ODM

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd E-commerece
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/flipkart_ecommerce
   JWT_SECRET=your_super_secret_jwt_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

4. **Start the application**
   ```bash
   # Option 1: Use the startup script
   node start.js
   
   # Option 2: Start backend only
   npm start
   
   # Option 3: Start with nodemon for development
   npm run dev
   ```

5. **Access the application**
   - Frontend: Open `index.html` in your browser or use a local server
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 📁 Project Structure

```
E-commerece/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Error handling middleware
│   └── notFound.js         # 404 handler
├── models/
│   ├── User.js             # User model
│   ├── Product.js          # Product model
│   ├── Category.js         # Category model
│   ├── Cart.js             # Cart model
│   └── Order.js            # Order model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── products.js         # Product routes
│   ├── categories.js       # Category routes
│   ├── cart.js             # Cart routes
│   ├── orders.js           # Order routes
│   ├── users.js            # User routes
│   ├── payments.js         # Payment routes
│   └── search.js           # Search routes
├── utils/
│   ├── errorResponse.js    # Error response utility
│   ├── sendTokenResponse.js # JWT token utility
│   └── sendEmail.js        # Email utility
├── index.html              # Main frontend file
├── styles.css              # Frontend styles
├── script.js               # Frontend JavaScript
├── server.js               # Backend server
├── package.json            # Dependencies and scripts
├── env.example             # Environment variables template
├── start.js                # Startup script
└── README.md               # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgotpassword` - Forgot password
- `PUT /api/auth/resetpassword/:resettoken` - Reset password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/trending` - Get trending products

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/wishlist` - Get wishlist
- `POST /api/users/wishlist/:productId` - Add to wishlist
- `DELETE /api/users/wishlist/:productId` - Remove from wishlist

### Search
- `GET /api/search` - Search products

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment

## 🎨 Design Philosophy

### Apple-inspired Elements
- **Minimalism**: Clean, uncluttered interface focusing on content
- **Typography**: Inter font family for excellent readability
- **Color Palette**: Subtle grays with blue accents
- **Glassmorphism**: Frosted glass effects for depth
- **Micro-interactions**: Smooth hover states and transitions
- **White Space**: Generous spacing for visual breathing room

### Animation Principles
- **Easing**: Cubic-bezier curves for natural motion
- **Staggered Animations**: Sequential loading for visual hierarchy
- **Hover Effects**: Subtle scale and shadow changes
- **Loading States**: Smooth transitions between states
- **Scroll Effects**: Parallax and reveal animations

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable rounds
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin resource sharing control
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Mongoose ODM protection
- **XSS Protection**: Content Security Policy headers

## 📱 Responsive Design

The application is fully responsive with breakpoints for:
- **Desktop**: 1024px and above
- **Tablet**: 768px to 1023px
- **Mobile**: Below 768px

## 🚀 Deployment

### Frontend Deployment
- **Netlify**: Drag and drop the frontend files
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Enable in repository settings

### Backend Deployment
- **Heroku**: Connect your GitHub repository
- **Railway**: Deploy with one click
- **DigitalOcean**: Use App Platform
- **AWS**: Deploy to EC2 or use Elastic Beanstalk

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
```

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📞 Support

For support and questions:
- Create an issue in the repository
- Email: arpitkumarsingh930@gmail.com
- Documentation: https://github.com/arpitkumarsingh930

---

**Built with ❤️ using modern web technologies** 
