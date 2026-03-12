// Configuration for different environments
const config = {
  // Automatically detect if running locally or on production
  getBackendUrl: function() {
    // Check if running in React Native/Expo environment
    if (typeof window === 'undefined' || !window.location) {
      // Mobile app - use production server
      return 'https://tapandpay-backend.onrender.com';
    }
    
    const hostname = window.location.hostname;
    
    // If running on localhost, use local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8208';
    }
    
    // If running on production
    return 'https://tapandpay-backend.onrender.com';
  }
};

// Export the backend URL
const BACKEND_URL = config.getBackendUrl();
console.log('🔗 Backend URL:', BACKEND_URL);
