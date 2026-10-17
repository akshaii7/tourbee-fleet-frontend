/**
 * Centralized, stable query keys for React Query across TourBee Fleet Manager.
 * Ensures hooks calling the same endpoint share exactly ONE cache entry.
 */

export const queryKeys = {
  // Auth profile: GET /api/auth/profile/
  me: ['me'],

  // Fleet Dashboard metrics: GET /api/fleet/dashboard/
  dashboard: (params = {}) => {
    if (!params || Object.keys(params).length === 0) return ['dashboard'];
    const { date = '', driver = '', vehicle_reg = '', payment_mode = '', status = '' } = params;
    if (!date && !driver && !vehicle_reg && !payment_mode && !status) return ['dashboard'];
    return ['dashboard', { date, driver, vehicle_reg, payment_mode, status }];
  },

  // Drivers list: GET /api/drivers/
  drivers: ['drivers'],

  // Vehicles list: GET /api/fleet/vehicles/
  vehicles: ['vehicles'],

  // Calculations: GET /api/fleet/calculations/
  calculations: ['calculations'],

  // Maintenance records: GET /api/maintenance/
  maintenance: (params = {}) => {
    if (!params || Object.keys(params).length === 0) return ['maintenance'];
    const { vehicle = '', maintenance_type = '' } = params;
    if (!vehicle && !maintenance_type) return ['maintenance'];
    return ['maintenance', { vehicle, maintenance_type }];
  },

  // Financial P&L report: GET /api/reports/financial/
  financial: (startDate = '', endDate = '') => ['financial', startDate || '', endDate || ''],

  // Driver salary overview (admin): GET /api/fleet/salary/overview/
  salaryOverview: ['salaryOverview'],

  // Salary disbursements / payments: GET /api/fleet/salary-payments/
  salaryPayments: (params = {}) => {
    if (!params || Object.keys(params).length === 0) return ['salaryPayments'];
    const { driver = '', date_from = '', date_to = '' } = params;
    if (!driver && !date_from && !date_to) return ['salaryPayments'];
    return ['salaryPayments', { driver, date_from, date_to }];
  },

  // Driver individual salary: GET /api/fleet/salary/me/
  mySalary: (params = {}) => {
    if (!params || Object.keys(params).length === 0) return ['mySalary'];
    const { date_from = '', date_to = '' } = params;
    if (!date_from && !date_to) return ['mySalary'];
    return ['mySalary', { date_from, date_to }];
  },

  // Accident / other deductions: GET /api/fleet/deductions/
  deductions: ['deductions'],

  // Payments page records: GET /api/finance/salary-payments/ and /api/finance/rent-payments/
  financeSalaryPayments: ['financeSalaryPayments'],
  financeRentPayments: ['financeRentPayments'],

  // Approvals queue
  approvals: ['approvals'],
};
