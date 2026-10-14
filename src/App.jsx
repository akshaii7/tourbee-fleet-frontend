import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Submissions from './pages/Submissions';
import Approvals from './pages/Approvals';
import SalaryCalculations from './pages/SalaryCalculations';
import DailyRent from './pages/DailyRent';
import Maintenance from './pages/Maintenance';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import DailyCalculation from './pages/DailyCalculation';
import MySalary from './pages/MySalary';
import DriverSalaryManagement from './pages/DriverSalaryManagement';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-emerald-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold tracking-wider uppercase">Loading TourBee Fleet...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (Desktop + Mobile) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Authenticated Dashboard Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Admin Features */}
            <Route path="/drivers" element={
              <AdminRoute><Drivers /></AdminRoute>
            } />
            <Route path="/vehicles" element={
              <AdminRoute><Vehicles /></AdminRoute>
            } />
            <Route path="/approvals" element={
              <AdminRoute><Approvals /></AdminRoute>
            } />
            <Route path="/reports" element={
              <AdminRoute><Reports /></AdminRoute>
            } />
            <Route path="/driver-salary" element={
              <AdminRoute><DriverSalaryManagement /></AdminRoute>
            } />
            <Route path="/admin/salary-management" element={
              <AdminRoute><DriverSalaryManagement /></AdminRoute>
            } />
            <Route path="/salary-management" element={
              <AdminRoute><DriverSalaryManagement /></AdminRoute>
            } />

            {/* Shared & Role-Filtered Features */}
            <Route path="/daily-calculation" element={<DailyCalculation />} />
            <Route path="/submissions" element={<Submissions />} />
            <Route path="/driver-expenses" element={<Submissions />} />
            <Route path="/salary" element={<DriverSalaryManagement />} />
            <Route path="/my-salary" element={<MySalary />} />
            <Route path="/rent" element={<DailyRent />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/payments" element={<Payments />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
