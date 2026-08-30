import axios from 'axios';


const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  `${window.location.origin.replace(/\/$/, '')}/api`;

const API = axios.create({
baseURL: API_BASE_URL,
  timeout: 30000,
});
// ─────────────────────────────────────────────────────────────────────────────
// INTERCEPTORS 
// ─────────────────────────────────────────────────────────────────────────────

 
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('dv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


API.interceptors.response.use(
  (res) => res,
  (err) => {
    
    if (err.response?.status === 401 && 
        err.config?.url !== '/auth/me' && 
        err.config?.url !== '/auth/login') {
      localStorage.removeItem('dv_token');
      localStorage.removeItem('dv_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH API 
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  // new registration endpoint
  register: (data) => API.post('/auth/register', data),
  
  // login endpoint
  login: (data) => API.post('/auth/login', data),
  
  //otp
  verify2FA: (data) => API.post('/auth/verify-2fa', data),
  
  // fetch current user data
    getMe: () => API.get('/auth/me'),
  
  // update user profile (name, email, etc.)
  updateProfile: (data) => API.put('/auth/update-profile', data),
  
  // change password endpoint
  updatePassword: (data) => API.put('/auth/update-password', data),
  getWishlist: () => API.get('/auth/wishlist'),
  toggleWishlist: (productId) => API.post(`/auth/wishlist/${productId}`),

  
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.put(`/auth/reset-password/${token}`, { password }),
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT API 
// ─────────────────────────────────────────────────────────────────────────────
export const productAPI = {
  // 
  getAll: (params) => API.get('/products', { params }),
  getAdminAll: (params) => API.get('/products/admin/list', { params }),
  
  // fetch one product by ID
  getOne: (id) => API.get(`/products/${id}`),
  
  // add new product (admin/managers only - verified in server)
  create: (data) => API.post('/products', data),
  
  //update product (admin/managers only - verified in server)
  update: (id, data) => API.put(`/products/${id}`, data),
  
  // delete product (admin/managers only - verified in server)
  delete: (id) => API.delete(`/products/${id}`),
  
  // add review to product (available only for customers - verification is done in server)
  addReview: (id, data) => API.post(`/products/${id}/reviews`, data),

  // remove review from product
  deleteReview: (productId, reviewId) => 
    API.delete(`/products/${productId}/reviews/${reviewId}`),
  
  // fetch category statistics
  getCategoryStats: () => API.get('/products/categories/stats'),
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER API 
// ─────────────────────────────────────────────────────────────────────────────
export const orderAPI = {
  create: (data, idempotencyKey) => API.post('/orders', data, { headers: { 'Idempotency-Key': idempotencyKey } }),
  // fetch orders of the logged-in user
  getMyOrders: () => API.get('/orders/my'),
  
  // fetch one order by ID (only if it belongs to the user or if user is admin/manager)
  getOne: (id) => API.get(`/orders/${id}`),
  
  // fetch all orders
  getAll: (params) => API.get('/orders', { params }),
  
  // update order status
  updateStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),

  // confirm order and send codes (for admins)
  confirmAndSend: (id, data = {}) => API.post(`/orders/${id}/confirm-and-send`, data),
  submitPaymentProof: (id, file) => {
    const form = new FormData();
    form.append('proof', file);
    return API.post(`/orders/payment-proof/${id}`, form);
  },
  confirmPayment: (id) => API.post(`/orders/${id}/confirm-payment`),
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT API
// ─────────────────────────────────────────────────────────────────────────────
export const paymentAPI = {
  // جلب إعدادات الدفع (Public Key)
  getConfig: () => API.get('/payments/config'),
  
  // إنشاء نية دفع جديدة (Payment Intent)
  createPaymentIntent: (data) => API.post('/payments/create-payment-intent', data),
  
  // تأكيد نجاح عملية الدفع
  confirmPayment: (id) => API.post(`/payments/confirm/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// DIGITAL CODES API 
// ─────────────────────────────────────────────────────────────────────────────
export const codeAPI = {
  // bulk code addition for a product
  addBulk: (data) => API.post('/codes/bulk', data),
  
  // fetch codes for a specific product
  getByProduct: (id, params) => API.get(`/codes/product/${id}`, { params }),
  
  // fetch codes statistics
  getStats: () => API.get('/codes/stats'),
  
  // delete a code
  delete: (id) => API.delete(`/codes/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API 
// ─────────────────────────────────────────────────────────────────────────────

export const adminAPI = {
  // fetch dashboard data (Dashboard Overview)
  getDashboard: () => API.get('/admin/dashboard'),
  
  // fetch list of all users
  getUsers: (params) => API.get('/admin/users', { params }),
  getDeliveryEmployees: () => API.get('/admin/delivery-employees'),
  inviteEmployee: (data) => API.post('/admin/users/invite', data),
  
  //  role management (promote/demote user role)
  updateUserRole: (id, data) => API.put(`/admin/users/${id}/role`, data),
  
  // toggle user active/suspended status
  toggleUserStatus: (id) => API.put(`/admin/users/${id}/toggle-status`),

  // update system settings (like maintenance mode, feature toggles, etc.)
  updateSettings: (data) => API.put('/admin/settings', data),

  // change user password
  changeUserPassword: (id, data) => API.put(`/admin/users/${id}/password`, data),

  // fetch list of all financials
  getFinancials: (params) => API.get('/admin/financials', { params }),

  getLogs: () => API.get('/admin/logs'),

  deleteUser: (id) => API.delete(`/admin/users/${id}`),

};

export const supplierAPI = {
  categories: (supplier) => API.get(`/suppliers/${supplier}/categories`),
  search: (supplier, params) => API.get(`/suppliers/${supplier}/products/search`, { params }),
  details: (supplier, productId) => API.get(`/suppliers/${supplier}/products/${encodeURIComponent(productId)}`),
  catalogCategories: (supplier, catalogType, params = {}) => API.get(`/suppliers/${supplier}/catalog/${catalogType}/categories`, { params }),
  catalogOffers: (supplier, catalogType, categoryId, params = {}) => API.get(`/suppliers/${supplier}/catalog/${catalogType}/${encodeURIComponent(categoryId)}/offers`, { params }),
  catalogSpecial: (supplier, catalogType, params = {}) => API.get(`/suppliers/${supplier}/catalog/${catalogType}`, { params }),
  import: (supplier, productId, data) => API.post(`/suppliers/${supplier}/products/${encodeURIComponent(productId)}/import`, data),
  sync: (supplier, productId, data = {}) => API.put(`/suppliers/${supplier}/products/${encodeURIComponent(productId)}/sync`, data),
  balance: (supplier) => API.get(`/suppliers/${supplier}/balance`)
};

export const settingsAPI = {
  getPromotionCampaign: () => API.get('/settings/promotion-campaign', { params: { t: Date.now() } }),
  getBankTransfer: () => API.get('/settings/bank-transfer', { params: { t: Date.now() } }),
};

export const discountAPI = {
  validate: (data) => API.post('/discounts/validate', data),
};
// ─────────────────────────────────────────────────────────────────────────────
// CART API 
// ─────────────────────────────────────────────────────────────────────────────
export const cartAPI = {
  // fetch current user's cart
  getCart: () => API.get('/cart'),
  
  // add item to cart
  addItem: (productId, quantity) => API.post('/cart/add', { productId, quantity }),
  
  // update item quantity in cart
  updateItem: (productId, quantity) => API.put('/cart/update', { productId, quantity }),
  
  // remove item from cart
  removeItem: (productId) => API.delete(`/cart/remove/${productId}`),
  
  // clear the entire cart
  clearCart: () => API.delete('/cart/clear'),
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM API 
// ─────────────────────────────────────────────────────────────────────────────
export const systemAPI = {
  // check system health/status
  health: () => API.get('/health'),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION API 
// ─────────────────────────────────────────────────────────────────────────────
export const notificationAPI = {
  // fetch notifications for the logged-in user with optional filters (like unread only, pagination, etc.)
  getNotifications: (params) => API.get('/notifications', { params }),
  
  // mark a single notification as read
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  
  // mark all notifications as read
  markAllAsRead: () => API.put('/notifications/mark-all-read'),
  
  // delete a single notification
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
  
  // delete all notifications
  clearAll: () => API.delete('/notifications/clear-all'),
};


export default API;
