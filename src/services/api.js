import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tourbee_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('tourbee_access_token');
        localStorage.removeItem('tourbee_refresh_token');
        localStorage.removeItem('tourbee_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    if (response.data.access) {
      localStorage.setItem('tourbee_access_token', response.data.access);
      localStorage.setItem('tourbee_refresh_token', response.data.refresh);
      localStorage.setItem('tourbee_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('tourbee_access_token');
    localStorage.removeItem('tourbee_refresh_token');
    localStorage.removeItem('tourbee_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('tourbee_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
};

export const driverService = {
  getAll: (params) => api.get('/drivers/', { params }),
  getById: (id) => api.get(`/drivers/${id}/`),
  create: (data) => api.post('/drivers/', data),
  update: (id, data) => api.patch(`/drivers/${id}/`, data),
  delete: (id) => api.delete(`/drivers/${id}/`),
};

export const vehicleService = {
  getAll: (params) => api.get('/vehicles/', { params }),
  getById: (id) => api.get(`/vehicles/${id}/`),
  create: (data) => api.post('/vehicles/', data),
  update: (id, data) => api.patch(`/vehicles/${id}/`, data),
  delete: (id) => api.delete(`/vehicles/${id}/`),
};

export const submissionService = {
  // Earnings
  getEarnings: (params) => api.get('/submissions/earnings/', { params }),
  createEarnings: (data) => api.post('/submissions/earnings/', data),
  updateEarnings: (id, data) => api.patch(`/submissions/earnings/${id}/`, data),
  approveEarnings: (id, notes) => api.post(`/submissions/earnings/${id}/approve/`, { notes }),
  rejectEarnings: (id, reason) => api.post(`/submissions/earnings/${id}/reject/`, { reason }),
  requestCorrectionEarnings: (id, notes) => api.post(`/submissions/earnings/${id}/request_correction/`, { notes }),

  // Expenses
  getExpenses: (params) => api.get('/submissions/expenses/', { params }),
  createExpense: (data) => api.post('/submissions/expenses/', data),
  updateExpense: (id, data) => api.patch(`/submissions/expenses/${id}/`, data),
  approveExpense: (id, notes) => api.post(`/submissions/expenses/${id}/approve/`, { notes }),
  rejectExpense: (id, reason) => api.post(`/submissions/expenses/${id}/reject/`, { reason }),
  requestCorrectionExpense: (id, notes) => api.post(`/submissions/expenses/${id}/request_correction/`, { notes }),

  // Categories
  getCategories: () => api.get('/submissions/categories/'),

  // Attachments
  uploadAttachment: (formData) => api.post('/submissions/attachments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const financeService = {
  // Profit sharing salary
  computeSalary: (data) => api.post('/finance/salary-calculations/compute/', data),
  getSalaryCalculations: (params) => api.get('/finance/salary-calculations/', { params }),
  finalizeSalary: (id) => api.post(`/finance/salary-calculations/${id}/finalize/`),
  
  // Salary Payments
  getSalaryPayments: (params) => api.get('/finance/salary-payments/', { params }),
  createSalaryPayment: (data) => api.post('/finance/salary-payments/', data),

  // Rent Payments
  getRentPayments: (params) => api.get('/finance/rent-payments/', { params }),
  createRentPayment: (data) => api.post('/finance/rent-payments/', data),
  getRentSummary: (params) => api.get('/finance/rent-summary/', { params }),

  // Settings
  getSettings: () => api.get('/finance/settings/'),
  updateSettings: (data) => api.put('/finance/settings/', data),
};

export const maintenanceService = {
  getAll: (params) => api.get('/maintenance/', { params }),
  create: (data) => api.post('/maintenance/', data),
  update: (id, data) => api.patch(`/maintenance/${id}/`, data),
  delete: (id) => api.delete(`/maintenance/${id}/`),
};

export const reportService = {
  getDashboardMetrics: () => api.get('/reports/dashboard/'),
  getFinancialReport: (params) => api.get('/reports/financial/', { params }),
  getExportUrl: (type, format, startDate, endDate) => {
    let url = `/api/reports/export/?type=${type}&format=${format}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return url;
  },
};

export const fleetService = {
  liveCalculate: (data) => api.post('/fleet/calculate/live/', data),
  getCalculations: (params) => api.get('/fleet/calculations/', { params }),
  createCalculation: (data) => api.post('/fleet/calculations/', data),
  createSubmissionMultipart: (formData) => api.post('/fleet/calculations/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCalculation: (id, data) => api.patch(`/fleet/calculations/${id}/`, data),
  markStatus: (id, status) => api.post(`/fleet/calculations/${id}/mark_status/`, { status }),
  lockCalculation: (id) => api.post(`/fleet/calculations/${id}/lock/`),
  unlockCalculation: (id, data) => api.post(`/fleet/calculations/${id}/unlock/`, data),

  // Fleet vehicles — use these IDs when submitting calculations
  getFleetVehicles: (params) => api.get('/fleet/vehicles/', { params }),

  getCompanyPayments: (params) => api.get('/fleet/company-payments/', { params }),
  createCompanyPayment: (data) => api.post('/fleet/company-payments/', data),
  confirmCompanyPayment: (id) => api.post(`/fleet/company-payments/${id}/confirm/`),

  getSalaryPayments: (params) => api.get('/fleet/salary-payments/', { params }),
  createSalaryPayment: (data) => api.post('/fleet/salary-payments/', data),
  deleteSalaryPayment: (id) => api.delete(`/fleet/salary-payments/${id}/`),

  // Driver Salary Management (50% mode)
  getMySalary: (params) => api.get('/fleet/salary/me/', { params }),
  getSalaryOverview: (params) => api.get('/fleet/salary/overview/', { params }),
  getDriverSalary: (driverId, params) => api.get(`/fleet/salary/drivers/${driverId}/`, { params }),

  getDeductions: (params) => api.get('/fleet/deductions/', { params }),
  createDeduction: (formData) => api.post('/fleet/deductions/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approveDeduction: (id) => api.post(`/fleet/deductions/${id}/approve/`),
  rejectDeduction: (id) => api.post(`/fleet/deductions/${id}/reject/`),
  deleteDeduction: (id) => api.delete(`/fleet/deductions/${id}/`),

  getFleetDashboard: (params) => api.get('/fleet/dashboard/', { params }),
};

export const deductionService = {
  getAll: (params) => api.get('/fleet/deductions/', { params }),
  create: (formData) => api.post('/fleet/deductions/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approve: (id) => api.post(`/fleet/deductions/${id}/approve/`),
  reject: (id) => api.post(`/fleet/deductions/${id}/reject/`),
  delete: (id) => api.delete(`/fleet/deductions/${id}/`),
};

export default api;

