import axios from 'axios';

// Create Axios Instance connected to Spring Boot Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

/**
 * Request Interceptor:
 * Automatically attaches JWT Bearer token from localStorage to every authenticated request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Helper to sanitize and construct human-friendly error messages.
 * Prevents raw database or backend stack trace exposure to end users.
 */
export const formatUserFriendlyError = (error) => {
  if (!error.response) {
    // Network Error or Server Unreachable
    return 'Unable to connect to LibriFlow server (http://localhost:8080). Please check your network connection or ensure the backend service is running.';
  }

  const { status, data } = error.response;
  const backendMessage = data?.message;

  switch (status) {
    case 400:
      return backendMessage || 'Invalid request. Please verify the entered details and try again.';
    case 401:
      return backendMessage || 'Your session has expired or you are not signed in. Please log in again.';
    case 403:
      return 'Access Denied: You do not have permission to perform this action.';
    case 404:
      return backendMessage || 'The requested resource was not found.';
    case 409:
      return backendMessage || 'A conflict occurred. The record (e.g. ISBN or Email) may already exist.';
    case 500:
      return 'An unexpected server error occurred. Please try again in a few moments.';
    default:
      return backendMessage || `Request failed with status code ${status}. Please try again.`;
  }
};

/**
 * Response Interceptor:
 * Intercepts errors globally, formats user-friendly messages,
 * and handles session expiry / 401 status.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;

    // Enhance error object with sanitized, user-friendly message
    const friendlyMessage = formatUserFriendlyError(error);
    error.userMessage = friendlyMessage;

    // Handle 401 Unauthorized: Clear stale JWT token on protected pages
    if (status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * 1. Authentication Services
 * POST /api/auth/register
 * POST /api/auth/login
 */
export const authService = {
  // POST /api/auth/register
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  // POST /api/auth/login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // GET /api/auth/me (Current Authenticated Profile)
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

/**
 * 2. Book Management Services
 * GET    /api/books
 * GET    /api/books/{id}
 * POST   /api/books
 * PUT    /api/books/{id}
 * DELETE /api/books/{id}
 */
export const bookService = {
  // GET /api/books (with optional query & category search)
  getAllBooks: async (query = '', category = '') => {
    const params = {};
    if (query) params.query = query;
    if (category) params.category = category;
    const response = await api.get('/books', { params });
    return response.data;
  },

  // GET /api/books/{id}
  getBookById: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // POST /api/books (ADMIN Only)
  addBook: async (bookData) => {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  // PUT /api/books/{id} (ADMIN Only)
  updateBook: async (id, bookData) => {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  },

  // DELETE /api/books/{id} (ADMIN Only)
  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },
};

/**
 * 3. Borrowing Services
 * POST /api/borrowings/{bookId}
 * GET  /api/borrowings/my
 * GET  /api/borrowings
 * PUT  /api/borrowings/{id}/return
 */
export const borrowingService = {
  // POST /api/borrowings/{bookId} (STUDENT loan initiation)
  borrowBook: async (bookId) => {
    const response = await api.post(`/borrowings/${bookId}`);
    return response.data;
  },

  // GET /api/borrowings/my (STUDENT personal loans)
  getMyBorrowings: async () => {
    const response = await api.get('/borrowings/my');
    return response.data;
  },

  // GET /api/borrowings (ADMIN audit of all system borrowings)
  getAllBorrowings: async () => {
    const response = await api.get('/borrowings');
    return response.data;
  },

  // PUT /api/borrowings/{id}/return (Return borrowed book)
  returnBook: async (borrowingId) => {
    const response = await api.put(`/borrowings/${borrowingId}/return`);
    return response.data;
  },
};

/**
 * 4. Fine Management Services
 * GET /api/fines/my
 * GET /api/fines
 * PUT /api/fines/{id}/pay
 */
export const fineService = {
  // GET /api/fines/my (STUDENT personal fines)
  getMyFines: async () => {
    const response = await api.get('/fines/my');
    return response.data;
  },

  // GET /api/fines (ADMIN audit of all student fines)
  getAllFines: async () => {
    const response = await api.get('/fines');
    return response.data;
  },

  // PUT /api/fines/{id}/pay (Settle / Pay fine)
  payFine: async (fineId) => {
    const response = await api.put(`/fines/${fineId}/pay`);
    return response.data;
  },
};

/**
 * 5. Admin Analytics & Student Management Services
 * GET /api/admin/stats
 * GET /api/admin/students
 */
export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getStudents: async () => {
    const response = await api.get('/admin/students');
    return response.data;
  },
};

export default api;
