// Apple-inspired Flipkart - Minimalist JavaScript

// Global variables
let cart = [];
let products = [];
let currentView = 'grid';
let currentPage = 1;
const productsPerPage = 8;

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// API Helper Functions
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Authentication Functions
const login = async (email, password) => {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        return response;
    } catch (error) {
        throw error;
    }
};

const register = async (userData) => {
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        authToken = response.token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        return response;
    } catch (error) {
        throw error;
    }
};

const logout = async () => {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        updateAuthUI();
    }
};

// Product Functions
const getProducts = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await apiRequest(`/products?${queryParams}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getProduct = async (productId) => {
    try {
        const response = await apiRequest(`/products/${productId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getFeaturedProducts = async () => {
    try {
        const response = await apiRequest('/products/featured');
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getTrendingProducts = async () => {
    try {
        const response = await apiRequest('/products/trending');
        return response.data;
    } catch (error) {
        throw error;
    }
};

const searchProducts = async (query, filters = {}) => {
    try {
        const searchParams = { q: query, ...filters };
        const queryParams = new URLSearchParams(searchParams).toString();
        const response = await apiRequest(`/search?${queryParams}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Cart Functions
const getCart = async () => {
    try {
        const response = await apiRequest('/cart');
        return response.data;
    } catch (error) {
        throw error;
    }
};

const addToCart = async (productId, quantity = 1) => {
    try {
        const response = await apiRequest('/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const updateCartItem = async (itemId, quantity) => {
    try {
        const response = await apiRequest(`/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const removeFromCart = async (itemId) => {
    try {
        const response = await apiRequest(`/cart/${itemId}`, {
            method: 'DELETE'
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const clearCart = async () => {
    try {
        const response = await apiRequest('/cart', {
            method: 'DELETE'
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// User Functions
const getUserProfile = async () => {
    try {
        const response = await apiRequest('/users/profile');
        return response.data;
    } catch (error) {
        throw error;
    }
};

const updateProfile = async (profileData) => {
    try {
        const response = await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getWishlist = async () => {
    try {
        const response = await apiRequest('/users/wishlist');
        return response.data;
    } catch (error) {
        throw error;
    }
};

const addToWishlist = async (productId) => {
    try {
        const response = await apiRequest(`/users/wishlist/${productId}`, {
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const removeFromWishlist = async (productId) => {
    try {
        const response = await apiRequest(`/users/wishlist/${productId}`, {
            method: 'DELETE'
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Order Functions
const createOrder = async (orderData) => {
    try {
        const response = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getOrders = async () => {
    try {
        const response = await apiRequest('/orders');
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Initialize app with backend integration
let wishlist = [];

// Load user data on page load
const loadUserData = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
};

// Update authentication UI
const updateAuthUI = () => {
    const authSection = document.querySelector('.auth-section');
    const userSection = document.querySelector('.user-section');
    
    if (currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'flex';
        document.querySelector('.user-name').textContent = currentUser.name;
    } else {
        authSection.style.display = 'flex';
        userSection.style.display = 'none';
    }
};

// Modal Functions
const showModal = (modalId) => {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    // Animate the modal content
    setTimeout(() => {
        const modalContent = modal.querySelector('.bg-white');
        modalContent.style.transform = 'scale(1)';
        modalContent.style.opacity = '1';
    }, 10);
};

const hideModal = (modalId) => {
    const modal = document.getElementById(modalId);
    const modalContent = modal.querySelector('.bg-white');
    
    modalContent.style.transform = 'scale(0.95)';
    modalContent.style.opacity = '0';
    
    setTimeout(() => {
        modal.classList.remove('active');
        modal.classList.add('hidden');
    }, 300);
};

// Load products from API
const loadProducts = async () => {
    console.log('🔄 Loading products...');
    try {
        showLoading();
        products = await getProducts();
        console.log('✅ Products loaded:', products.length);
        displayProducts(products);
        hideLoading();
    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Only show error if it's a real failure, not a temporary network issue
        if (error.message && !error.message.includes('fetch')) {
            showError('Failed to load products');
        }
        hideLoading();
    }
};

// Load featured products
const loadFeaturedProducts = async () => {
    try {
        const featuredProducts = await getFeaturedProducts();
        displayFeaturedProducts(featuredProducts);
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
};

// Load trending products
const loadTrendingProducts = async () => {
    try {
        const trendingProducts = await getTrendingProducts();
        displayTrendingProducts(trendingProducts);
    } catch (error) {
        console.error('Error loading trending products:', error);
    }
};

// Load cart from API
const loadCart = async () => {
    if (!currentUser) return;
    
    try {
        cart = await getCart();
        updateCartUI();
    } catch (error) {
        console.error('Error loading cart:', error);
    }
};

// Load wishlist from API
const loadWishlist = async () => {
    if (!currentUser) return;
    
    try {
        wishlist = await getWishlist();
        updateWishlistUI();
    } catch (error) {
        console.error('Error loading wishlist:', error);
    }
};

// Handle login
const handleLogin = async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        showLoading();
        await login(email, password);
        updateAuthUI();
        await loadCart();
        await loadWishlist();
        hideLoading();
        showSuccess('Login successful!');
        
        // Close modal
        hideModal('login-modal');
    } catch (error) {
        hideLoading();
        showError(error.message || 'Login failed');
    }
};

// Handle registration
const handleRegister = async (event) => {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const phone = document.getElementById('register-phone').value;
    
    try {
        showLoading();
        await register({ name, email, password, phone });
        updateAuthUI();
        hideLoading();
        showSuccess('Registration successful! Please check your email for verification.');
        
        // Close modal
        hideModal('register-modal');
    } catch (error) {
        hideLoading();
        showError(error.message || 'Registration failed');
    }
};

// Handle logout
const handleLogout = async () => {
    try {
        await logout();
        cart = { items: [] };
        wishlist = [];
        updateCartUI();
        updateWishlistUI();
        showSuccess('Logged out successfully!');
    } catch (error) {
        showError('Logout failed');
    }
};

// Handle add to cart
const handleAddToCart = async (productId, quantity = 1) => {
    if (!currentUser) {
        showError('Please login to add items to cart');
        return;
    }
    
    try {
        await addToCart(productId, quantity);
        await loadCart();
        showSuccess('Added to cart successfully!');
    } catch (error) {
        showError(error.message || 'Failed to add to cart');
    }
};

// Handle remove from cart
const handleRemoveFromCart = async (itemId) => {
    try {
        await removeFromCart(itemId);
        await loadCart();
        showSuccess('Item removed from cart');
    } catch (error) {
        showError(error.message || 'Failed to remove item');
    }
};

// Handle update cart quantity
const handleUpdateCartQuantity = async (itemId, quantity) => {
    try {
        await updateCartItem(itemId, quantity);
        await loadCart();
    } catch (error) {
        showError(error.message || 'Failed to update quantity');
    }
};

// Handle add to wishlist
const handleAddToWishlist = async (productId) => {
    if (!currentUser) {
        showError('Please login to add items to wishlist');
        return;
    }
    
    try {
        await addToWishlist(productId);
        await loadWishlist();
        showSuccess('Added to wishlist!');
    } catch (error) {
        showError(error.message || 'Failed to add to wishlist');
    }
};

// Handle remove from wishlist
const handleRemoveFromWishlist = async (productId) => {
    try {
        await removeFromWishlist(productId);
        await loadWishlist();
        showSuccess('Removed from wishlist');
    } catch (error) {
        showError(error.message || 'Failed to remove from wishlist');
    }
};

// Handle search
const handleSearch = async (query) => {
    try {
        showLoading();
        const searchResults = await searchProducts(query);
        displayProducts(searchResults);
        hideLoading();
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed');
        hideLoading();
    }
};

// Handle checkout
const handleCheckout = async (orderData) => {
    try {
        showLoading();
        const order = await createOrder(orderData);
        await clearCart();
        await loadCart();
        hideLoading();
        showSuccess('Order placed successfully!');
        return order;
    } catch (error) {
        hideLoading();
        showError(error.message || 'Checkout failed');
        throw error;
    }
};

// Update cart UI
const updateCartUI = () => {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = itemCount;
    
    // Update cart items display
    cartItems.innerHTML = '';
    cart.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.product.images[0]?.url || 'placeholder.jpg'}" alt="${item.product.name}">
            <div class="cart-item-details">
                <h4>${item.product.name}</h4>
                <p>₹${item.price}</p>
                <div class="quantity-controls">
                    <button onclick="handleUpdateCartQuantity('${item._id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="handleUpdateCartQuantity('${item._id}', ${item.quantity + 1})">+</button>
                </div>
                <button onclick="handleRemoveFromCart('${item._id}')" class="remove-btn">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Update total
    const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;
};

// Update wishlist UI
const updateWishlistUI = () => {
    const wishlistCount = document.querySelector('.wishlist-count');
    wishlistCount.textContent = wishlist.length;
};

// Display products
const displayProducts = (productsToDisplay) => {
    const productsContainer = document.querySelector('.products-grid');
    productsContainer.innerHTML = '';
    
    productsToDisplay.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
};

// Display featured products
const displayFeaturedProducts = (featuredProducts) => {
    const featuredContainer = document.querySelector('.featured-products');
    if (!featuredContainer) return;
    
    featuredContainer.innerHTML = '';
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        featuredContainer.appendChild(productCard);
    });
};

// Display trending products
const displayTrendingProducts = (trendingProducts) => {
    const trendingContainer = document.querySelector('.trending-products');
    if (!trendingContainer) return;
    
    trendingContainer.innerHTML = '';
    trendingProducts.forEach(product => {
        const productCard = createProductCard(product);
        trendingContainer.appendChild(productCard);
    });
};

// Create product card
const createProductCard = (product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const isInWishlist = wishlist.some(item => item._id === product._id);
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.images[0]?.url || 'placeholder.jpg'}" alt="${product.name}">
            <div class="product-actions">
                <button onclick="handleAddToCart('${product._id}')" class="add-to-cart-btn">
                    <i class="fas fa-shopping-cart"></i>
                </button>
                <button onclick="handleAddToWishlist('${product._id}')" class="wishlist-btn ${isInWishlist ? 'active' : ''}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-brand">${product.brand}</p>
            <div class="product-rating">
                <span class="stars">${'★'.repeat(Math.floor(product.ratings?.average || 0))}${'☆'.repeat(5 - Math.floor(product.ratings?.average || 0))}</span>
                <span class="rating-count">(${product.ratings?.count || 0})</span>
            </div>
            <div class="product-price">
                <span class="current-price">₹${product.price}</span>
                ${product.originalPrice > product.price ? `<span class="original-price">₹${product.originalPrice}</span>` : ''}
                ${product.discount > 0 ? `<span class="discount">${product.discount}% OFF</span>` : ''}
            </div>
        </div>
    `;
    
    return card;
};

// Show loading state
const showLoading = () => {
    const loading = document.querySelector('.loading');
    if (loading) loading.classList.add('active');
};

// Hide loading state
const hideLoading = () => {
    const loading = document.querySelector('.loading');
    if (loading) loading.classList.remove('active');
};

// Show success message
const showSuccess = (message) => {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
};

// Show error message
const showError = (message) => {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
};

// Cart functionality
const toggleCart = () => {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('hidden');
};

// Initialize the application
const initApp = async () => {
    loadUserData();
    await loadProducts();
    await loadFeaturedProducts();
    await loadTrendingProducts();
    
    if (currentUser) {
        await loadCart();
        await loadWishlist();
    }
    
    // Add event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Modal event listeners
    document.getElementById('login-btn').addEventListener('click', () => showModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => showModal('register-modal'));
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Switch between modals
    document.querySelector('.switch-to-register').addEventListener('click', () => {
        hideModal('login-modal');
        setTimeout(() => showModal('register-modal'), 300);
    });
    
    document.querySelector('.switch-to-login').addEventListener('click', () => {
        hideModal('register-modal');
        setTimeout(() => showModal('login-modal'), 300);
    });
    
    // Cart event listeners
    document.getElementById('cartBtn').addEventListener('click', toggleCart);
    document.getElementById('closeCart').addEventListener('click', toggleCart);
    document.getElementById('cartOverlay').addEventListener('click', toggleCart);
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (e.target.value.trim()) {
                handleSearch(e.target.value.trim());
            } else {
                loadProducts();
            }
        }, 500);
    });
    
    // Grid/List view toggle
    document.getElementById('gridView').addEventListener('click', () => {
        document.getElementById('productsContainer').className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8';
        document.getElementById('gridView').classList.add('active');
        document.getElementById('listView').classList.remove('active');
    });
    
    document.getElementById('listView').addEventListener('click', () => {
        document.getElementById('productsContainer').className = 'grid grid-cols-1 gap-8';
        document.getElementById('listView').classList.add('active');
        document.getElementById('gridView').classList.remove('active');
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for global access
window.handleAddToCart = handleAddToCart;
window.handleRemoveFromCart = handleRemoveFromCart;
window.handleUpdateCartQuantity = handleUpdateCartQuantity;
window.handleAddToWishlist = handleAddToWishlist;
window.handleRemoveFromWishlist = handleRemoveFromWishlist;
window.handleSearch = handl