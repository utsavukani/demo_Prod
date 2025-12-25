import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: (email: string, role: 'student' | 'parent') =>
    api.post('/auth/otp', { email, role }).then(res => res.data),
  
  verifyOTP: (email: string, otp: string, userData?: any) =>
    api.post('/auth/verify', { email, otp, ...userData }).then(res => res.data),
  
  getCurrentUser: () =>
    api.get('/auth/me').then(res => res.data),
};

// User API
export const userAPI = {
  getProfile: () =>
    api.get('/users/profile').then(res => res.data),
  
  updateProfile: (data: any) =>
    api.patch('/users/profile', data).then(res => res.data),
  
  getBalance: () =>
    api.get('/users/balance').then(res => res.data),
};

// Transaction API
export const transactionAPI = {
  getTransactions: (params?: any) =>
    api.get('/transactions', { params }).then(res => res.data),
  
  createTransaction: (data: any) =>
    api.post('/transactions', data).then(res => res.data),
  
  parseSMS: (smsText: string) =>
    api.post('/transactions/parse-sms', { smsText }).then(res => res.data),
  
  mockUPI: () =>
    api.post('/transactions/mock-upi').then(res => res.data),
  
  updateCategory: (id: string, category: string) =>
    api.patch(`/transactions/${id}/category`, { category }).then(res => res.data),
};

// Goal API
export const goalAPI = {
  getGoals: (status?: string) =>
    api.get('/goals', { params: status ? { status } : {} }).then(res => res.data),
  
  createGoal: (data: any) =>
    api.post('/goals', data).then(res => res.data),
  
  topupGoal: (id: string, amount: number) =>
    api.patch(`/goals/${id}/topup`, { amount }).then(res => res.data),
  
  updateGoal: (id: string, data: any) =>
    api.patch(`/goals/${id}`, data).then(res => res.data),
  
  deleteGoal: (id: string) =>
    api.delete(`/goals/${id}`).then(res => res.data),
};

// Analytics API
export const analyticsAPI = {
  getSummary: (period?: string) =>
    api.get('/analytics/summary', { params: period ? { period } : {} }).then(res => res.data),
  
  getTrends: (period?: string, category?: string) =>
    api.get('/analytics/trends', { params: { period, category } }).then(res => res.data),
  
  getInsights: () =>
    api.get('/analytics/insights').then(res => res.data),
};

// Parent API
export const parentAPI = {
  inviteParent: (parentEmail: string) =>
    api.post('/parent/invite', { parentEmail }).then(res => res.data),
  
  acceptInvite: (studentId: string) =>
    api.post('/parent/accept', { studentId }).then(res => res.data),
  
  getChildren: () =>
    api.get('/parent/children').then(res => res.data),
  
  getChildSummary: (childId: string, period?: string) =>
    api.get(`/parent/child/${childId}/summary`, { params: period ? { period } : {} }).then(res => res.data),
  
  removeChild: (childId: string) =>
    api.delete(`/parent/child/${childId}`).then(res => res.data),
};

// Allowance API
export const allowanceAPI = {
  getRequests: (status?: string) =>
    api.get('/allowance', { params: status ? { status } : {} }).then(res => res.data),
  
  createRequest: (data: any) =>
    api.post('/allowance', data).then(res => res.data),
  
  makeDecision: (id: string, status: 'approved' | 'rejected', parentNote?: string) =>
    api.post(`/allowance/${id}/decision`, { status, parentNote }).then(res => res.data),
  
  getRequest: (id: string) =>
    api.get(`/allowance/${id}`).then(res => res.data),
};

// ML API
export const mlAPI = {
  categorize: (data: any) =>
    api.post('/ml/categorize', data).then(res => res.data),
  
  getStats: () =>
    api.get('/ml/stats').then(res => res.data),
};