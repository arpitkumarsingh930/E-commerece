const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Apple-inspired Flipkart E-commerce...\n');

// Start backend server
console.log('📦 Starting backend server...');
const backend = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

backend.on('error', (error) => {
    console.error('❌ Backend server error:', error);
});

backend.on('close', (code) => {
    console.log(`📦 Backend server exited with code ${code}`);
});

// Instructions for frontend
console.log('\n🌐 Frontend Instructions:');
console.log('1. Open index.html in your browser');
console.log('2. Or use a local server like:');
console.log('   - Python: python -m http.server 3000');
console.log('   - Node.js: npx serve .');
console.log('   - VS Code: Live Server extension');
console.log('\n📱 Frontend will be available at: http://localhost:3000');
console.log('🔧 Backend API will be available at: http://localhost:5000');
console.log('\n💡 Make sure MongoDB is running locally or update MONGODB_URI in .env');
console.log('💡 Update other environment variables in .env as needed\n');

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill('SIGTERM');
    process.exit(0);
}); 