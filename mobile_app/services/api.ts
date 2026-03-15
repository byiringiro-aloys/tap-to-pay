import { API_BASE_URL } from '@/constants/config';
import * as SecureStore from 'expo-secure-store';

/**
 * Handle API responses
 * @param {Response} response API response object
 * @returns {Promise<any>} Parsed JSON or error
 */
async function handleResponse(response: Response) {
  let data;
  // Read body as text first to avoid "Already read" errors
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch (err) {
    // If it's not JSON (e.g. HTML error page), return a generic error
    console.error('API non-JSON response:', text.substring(0, 200));
    throw new Error(`Server returned a non-JSON response (Status: ${response.status})`);
  }
  
  if (!response.ok) {
    throw new Error(data.error || data.message || `API error: ${response.status}`);
  }
  return data;
}

/**
 * Get the stored token
 * @returns {Promise<string | null>} Bearer Token
 */
export async function getToken() {
  try {
    return await SecureStore.getItemAsync('user_token');
  } catch (error) {
    return null;
  }
}

/**
 * Authenticated request wrapper
 * @param {string} endpoint API endpoint
 * @param {RequestInit} options Request options
 */
async function authRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
}

// ==================== AUTH SERVICES ====================
export const authService = {
  login: (payload: any) => 
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),
    
  verify: () => authRequest('/auth/verify'),
  
  registerMember: (payload: any) => authRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  
  setupPassword: (payload: any) => 
    fetch(`${API_BASE_URL}/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),
    
  forgotPassword: (username: string) => 
    fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    }).then(handleResponse),
    
  resetPassword: (payload: any) => 
    fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),
    
  logout: async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
  }
};

// ==================== PRODUCT SERVICES ====================
export const productService = {
  getProducts: () => fetch(`${API_BASE_URL}/api/products`).then(handleResponse),
  getCategories: () => fetch(`${API_BASE_URL}/api/categories`).then(handleResponse),
  reserveProducts: (items: any[], sessionId: string) => fetch(`${API_BASE_URL}/api/products/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, sessionId })
  }).then(handleResponse),
  
  // Agent-only
  addProduct: (data: any) => authRequest('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => authRequest(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => authRequest(`/api/products/${id}`, { method: 'DELETE' }),
  addCategory: (data: any) => authRequest('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateStock: (id: string, newStock: number) => authRequest(`/api/products/${id}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ stock: newStock })
  }),
  addStock: (id: string, qty: number) => authRequest(`/api/products/${id}/add-stock`, {
    method: 'POST',
    body: JSON.stringify({ quantity: qty })
  })
};

// ==================== CARD SERVICES ====================
export const cardService = {
  getCards: () => authRequest('/cards'),
  getCard: (uid: string) => authRequest(`/card/${uid}`),
  
  updateCard: (uid: string, data: any) => authRequest(`/card/${uid}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  deleteCard: (uid: string) => authRequest(`/card/${uid}`, { method: 'DELETE' }),
  
  setPasscode: (uid: string, passcode: string) => fetch(`${API_BASE_URL}/card/${uid}/set-passcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode })
  }).then(handleResponse),
  
  verifyPasscode: (uid: string, passcode: string) => fetch(`${API_BASE_URL}/card/${uid}/verify-passcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode })
  }).then(handleResponse)
};

// ==================== TRANSACTION SERVICES ====================
export const transactionService = {
  getTransactions: () => authRequest('/transactions'),
  getUserTransactions: (uid: string) => authRequest(`/transactions/${uid}`),
  
  pay: (payload: any) => 
    fetch(`${API_BASE_URL}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),
    
  topup: (payload: any) => 
    fetch(`${API_BASE_URL}/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse)
};

// ==================== USER MANAGEMENT SERVICES ====================
export const userService = {
  getUsers: () => authRequest('/auth/users'),
  addUser: (payload: { fullName: string; email: string }) => authRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  deleteUser: (id: string) => authRequest(`/auth/users/${id}`, { method: 'DELETE' }),
};

// ==================== STATS SERVICES ====================
export const statsService = {
  getStats: () => authRequest('/stats'),
};
