# Flipkart Backend API

A modern, scalable backend API for the Apple-inspired Flipkart e-commerce platform built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Product Management** - Complete CRUD operations with advanced filtering and search
- **Shopping Cart** - Persistent cart with real-time updates
- **Order Management** - Comprehensive order tracking and status management
- **Payment Integration** - Stripe payment processing with webhook support
- **Search & Filtering** - Advanced search with multiple filters and sorting options
- **Review System** - Product reviews with ratings and helpful votes
- **Wishlist Management** - User wishlist functionality
- **Address Management** - Multiple shipping addresses per user

### Technical Features
- **RESTful API Design** - Clean, consistent API endpoints
- **Input Validation** - Comprehensive request validation using express-validator
- **Error Handling** - Centralized error handling with custom error responses
- **Rate Limiting** - API rate limiting for security
- **Security** - Helmet.js security headers, CORS configuration
- **Database Optimization** - MongoDB indexing and query optimization
- **File Upload** - Image upload support with Cloudinary integration
- **Email Notifications** - Email verification and order notifications
- **Caching** - Redis caching for improved performance

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Redis (optional, for caching)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flipkart-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   BASE_URL=http://localhost:5000

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/flipkart

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   https://meet.google.com/mqd-ekqk-zxmnpm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/products?page=1&limit=20&sort=price_asc&category=60f1a2b3c4d5e6f7g8h9i0j1
```

#### Get Single Product
```http
GET /api/products/60f1a2b3c4d5e6f7g8h9i0j1
```

#### Create Product (Admin/Moderator)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with advanced features",
  "price": 129999,
  "originalPrice": 149999,
  "stock": 50,
  "category": "60f1a2b3c4d5e6f7g8h9i0j1",
  "brand": "Apple",
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "iPhone 15 Pro",
      "isPrimary": true
    }
  ]
}
```

#### Search Products
```http
GET /api/search?q=iphone&minPrice=50000&maxPrice=150000&brand=Apple&rating=4&sort=price_asc
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

#### Add Item to Cart
```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "60f1a2b3c4d5e6f7g8h9i0j1",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/60f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "paymentMethod": "card"
}
```

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

### User Endpoints

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "9876543210"
}
```

#### Add Address
```http
POST /api/users/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "type": "home",
  "isDefault": true
}
```

### Payment Endpoints

#### Create Payment Intent
```http
POST /api/payments/create-payment-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "60f1a2b3c4d5e6f7g8h9i0j1"
}
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (user/admin/moderator),
  addresses: [AddressSchema],
  wishlist: [ProductId],
  preferences: {
    notifications: { email, sms, push },
    currency: String,
    language: String
  }
}
```

### Product Model
```javascript
{
  name: String,
  slug: String (unique),
  description: String,
  category: ObjectId,
  brand: String,
  price: Number,
  originalPrice: Number,
  stock: Number,
  images: [ImageSchema],
  ratings: {
    average: Number,
    count: Number,
    distribution: Object
  },
  reviews: [ReviewSchema],
  variants: [VariantSchema]
}
```

### Order Model
```javascript
{
  orderNumber: String (unique),
  user: ObjectId,
  items: [OrderItemSchema],
  shippingAddress: AddressSchema,
  paymentMethod: String,
  status: String,
  subtotal: Number,
  shippingCost: Number,
  discount: Number,
  total: Number,
  statusHistory: [StatusHistorySchema]
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | `30d` |
| `EMAIL_HOST` | SMTP host | - |
| `EMAIL_PORT` | SMTP port | `587` |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |

### Database Indexes

The application includes optimized database indexes for:
- User email and phone lookups
- Product search and filtering
- Order status and user queries
- Category and brand filtering

## 🚀 Deployment

### Production Setup

1. **Set environment variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/flipkart
   ```

2. **Install dependencies**
   ```bash
   npm ci --only=production
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "auth"
```

## 📊 Monitoring & Logging

The application includes:
- Request logging with Morgan
- Error tracking and reporting
- Performance monitoring
- Health check endpoints

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Security headers with Helmet
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔄 API Versioning

The API uses URL versioning:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, etc.

## 📈 Performance Optimization

- Database query optimization
- Response compression
- Caching strategies
- Connection pooling
- Lazy loading for large datasets

---

**Built with ❤️ for the Apple-inspired Flipkart experience** 