import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fleetService } from '../services/api';
import { useDashboard } from '../hooks/useDashboard';
import { useDrivers } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';
import { queryClient } from '../queryClient';
import { MySalaryDashboardSection } from './MySalary';
import {
  Car,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Fuel,
  ArrowRight,
  Filter,
  RotateCcw,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Check,
  CalendarDays,
  Receipt,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin filter state
  const [filters, setFilters] = useState({
    date: '',
    driver: '',
    vehicle_reg: '',
    payment_mode: '',
    status: '',
  });

  // Modal for previewing uploaded documents
  const [previewDoc, setPreviewDoc] = useState(null);

  const cleanParams = useMemo(() => {
    const p = {};
    if (filters.date) p.date = filters.date;
    if (filters.driver) p.driver = filters.driver;
    if (filters.vehicle_reg) p.vehicle_reg = filters.vehicle_reg;
    if (filters.payment_mode) p.payment_mode = filters.payment_mode;
    if (filters.status) p.status = filters.status;
    return p;
  }, [filters]);

  const { data: metrics, isLoading: loading, error: queryError } = useDashboard(cleanParams);
  const { data: driversData } = useDrivers();
  const { data: vehiclesData } = useVehicles();

  const driversRaw = driversData?.results ?? driversData?.data ?? driversData ?? [];
  const driversList = Array.isArray(driversRaw) ? driversRaw : [];

  const vehiclesRaw = vehiclesData?.results ?? vehiclesData?.data ?? vehiclesData ?? [];
  const vehiclesList = Array.isArray(vehiclesRaw) ? vehiclesRaw : [];

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({
      date: '',
      driver: '',
      vehicle_reg: '',
      payment_mode: '',
      status: '',
    });
  };

  const handleMarkStatus = async (calcId, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await fleetService.markStatus(calcId, newStatus);
      setSuccessMsg(`Submission #${calcId} updated to ${newStatus === 'PAID' ? 'Paid' : 'Pending'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
      queryClient.invalidateQueries({ queryKey: ['salaryOverview'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    } catch (err) {
      console.error(err);
      setError('Failed to update payment status.');
    }
  };

  const formatINR = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Connecting to PostgreSQL fleet database...</p>
        </div>
      </div>
    );
  }

  // ================= ADMIN DASHBOARD =================
  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Toast alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-2 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 skew-x-12 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-600/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Kerala Fleet Operations Center • Kochi & Ernakulam</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.first_name || 'Fleet Owner'}!
              </h2>
              <p className="text-emerald-200/90 text-sm mt-1 max-w-xl">
                Managing {metrics?.active_drivers_count || 0} active fleet drivers across 50% Profit-Sharing and Fixed Daily Rent programs.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/submissions"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>50% Submissions</span>
              </Link>
              <Link
                to="/rent"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm border border-white/20 transition-all"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Fixed Rent</span>
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 1: Active Drivers Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Drivers</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900">{metrics?.active_drivers_count || 0}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Currently active fleet drivers</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">50% Mode Drivers</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-blue-600">{metrics?.drivers_50_mode_count || 0}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Drivers on 50% Profit-Sharing program</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fixed-Rent Drivers</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-indigo-600">{metrics?.drivers_rent_mode_count || 0}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Drivers paying fixed daily rent (₹650/₹1,200)</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: 50% Mode Financial Metrics (Strictly not mixed with fixed rent) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>50% Profit-Sharing Mode Metrics</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Calculated strictly per confirmed formula</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Uber Earnings</span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatINR(metrics?.total_daily_uber_earnings)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Gross earnings before commission</p>
            </div>

            <Link
              to="/driver-salary"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-500/60 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                  Total Driver Salaries
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-0.5">
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                {formatINR(metrics?.total_driver_salaries)}
              </div>
              <p className="text-xs text-slate-500 mt-1">50% share of profit earned</p>
            </Link>

            <Link
              to="/driver-salary"
              className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Paid to Drivers
                </span>
                <span className="text-xs font-bold text-emerald-700 flex items-center space-x-0.5">
                  <span>History</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-800 mt-2">
                {formatINR(metrics?.total_salary_paid)}
              </div>
              <p className="text-xs text-emerald-700 mt-1">Confirmed salary payouts made</p>
            </Link>

            <Link
              to="/driver-salary"
              className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Unpaid Salary Balance
                </span>
                <span className="text-xs font-bold text-amber-700 flex items-center space-x-0.5">
                  <span>Pay</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-900 mt-2">
                {formatINR(metrics?.total_salary_balance)}
              </div>
              <p className="text-xs text-amber-700 mt-1">Outstanding salary yet to pay</p>
            </Link>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total TourBee Shares</span>
              <div className="text-2xl font-black text-teal-600 mt-2">
                {formatINR(metrics?.total_tourbee_shares)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Company's 50% share of profit</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Fixed Rent & Total Payments Received */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Fixed Rent & Total Collections</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Separated figures</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fixed Rent Pending</span>
              <div className="text-2xl font-black text-rose-600 mt-2">
                {formatINR(metrics?.total_fixed_rent_pending)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Pending rent collections from drivers</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fixed Rent Paid</span>
              <div className="text-2xl font-black text-indigo-700 mt-2">
                {formatINR(metrics?.total_fixed_rent_paid)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Confirmed fixed rent received</p>
            </div>

            <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Payments Received</span>
              <div className="text-2xl font-black text-emerald-950 mt-2">
                {formatINR(metrics?.total_payments_received)}
              </div>
              <p className="text-xs text-emerald-700 mt-1 font-medium">Paid GPay + Paid Fixed Rent collections</p>
            </div>
          </div>
        </div>

        {/* SECTION 4: Recent Driver Submissions with Filters */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Driver Submissions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter submissions by date, driver, vehicle, mode, and payment status</p>
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Driver</label>
              <select
                value={filters.driver}
                onChange={(e) => handleFilterChange('driver', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Drivers</option>
                {driversList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || d.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Vehicle</label>
              <input
                type="text"
                placeholder="e.g. KL-07"
                value={filters.vehicle_reg}
                onChange={(e) => handleFilterChange('vehicle_reg', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
              <select
                value={filters.payment_mode}
                onChange={(e) => handleFilterChange('payment_mode', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Modes</option>
                <option value="REVENUE_SHARING">50% Profit-Sharing</option>
                <option value="FIXED_RENT">Fixed Daily Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Calculation / Type</th>
                  <th className="py-3.5 px-4 text-right">Net Due / GPay</th>
                  <th className="py-3.5 px-4 text-center">Documents</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recent_submissions?.length > 0 ? (
                  metrics.recent_submissions.map((sub) => {
                    const is50 = sub.payment_mode === 'REVENUE_SHARING';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {sub.date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{sub.driver_name || `Driver #${sub.driver}`}</div>
                          {sub.driver_phone && (
                            <div className="text-[11px] text-slate-400">{sub.driver_phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          {sub.vehicle_reg || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              is50
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {is50 ? '50% Profit Share' : 'Fixed Rent'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {is50 ? (
                            <div className="space-y-0.5 text-[11px]">
                              <div>Uber: <span className="font-semibold text-slate-900">{formatINR(sub.total_uber_earnings)}</span></div>
                              <div className="text-slate-400">CNG: {formatINR(sub.cng_expense)} | Exp: {formatINR(sub.expenses)}</div>
                            </div>
                          ) : (
                            <span className="font-semibold text-indigo-900">
                              {sub.working_day_type === 'HALF_DAY' ? 'Half Day (₹650)' : 'Full Day (₹1,200)'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-sm text-slate-900">
                            {formatINR(sub.final_gpay_amount || sub.J)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            {(sub.cng_bill_url || sub.cng_bill_file) ? (
                              <button
                                onClick={() => setPreviewDoc({ title: 'CNG Bill', url: sub.cng_bill_url || sub.cng_bill_file })}
                                className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200"
                                title="View CNG Bill"
                              >
                                CNG Bill
                              </button>
                            ) : null}
                            {(sub.uber_screenshot_url || sub.uber_screenshot_file) ? (
                              <button
                                onClick={() => setPreviewDoc({ title: 'Uber Earnings Screenshot', url: sub.uber_screenshot_url || sub.uber_screenshot_file })}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200"
                                title="View Uber Screenshot"
                              >
                                Uber Proof
                              </button>
                            ) : null}
                            {!sub.cng_bill_url && !sub.cng_bill_file && !sub.uber_screenshot_url && !sub.uber_screenshot_file && (
                              <span className="text-slate-300">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black ${
                              sub.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {sub.status === 'PAID' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleMarkStatus(sub.id, sub.status)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              sub.status === 'PAID'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                          >
                            {sub.status === 'PAID' ? 'Mark Pending' : 'Mark Paid'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                      No driver submissions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{previewDoc.title}</h4>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 flex flex-col items-center justify-center bg-slate-50 min-h-[250px]">
                <img
                  src={previewDoc.url}
                  alt="Proof"
                  className="max-h-[70vh] rounded-lg object-contain shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none' }} className="p-6 text-center text-slate-500">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Image preview unavailable in embedded viewer</p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    <span>Click here to open in new tab</span>
                  </a>
                </div>
              </div>
              <div className="p-3 bg-slate-100 text-right">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline mr-3"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= DRIVER DASHBOARD =================
  const isFixedRent = metrics?.payment_mode === 'FIXED_RENT';

  if (isFixedRent) {
    // ---------------- FIXED DAILY RENT DRIVER DASHBOARD ----------------
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-700/60 text-indigo-200 text-xs font-bold mb-3 border border-indigo-500/40">
                <span>Fixed Daily Rent Mode</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {metrics?.driver_name || user?.username}!
              </h2>
              <p className="text-indigo-200/90 text-sm mt-1 max-w-xl">
                Assigned Vehicle: <span className="font-bold text-white">{metrics?.assigned_vehicle || 'Not Assigned'}</span>
              </p>
            </div>

            <Link
              to="/rent"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-950/40 active:scale-95 transition-all self-start md:self-auto"
            >
              <CalendarDays className="w-5 h-5" />
              <span>Submit Daily Rent</span>
            </Link>
          </div>
        </div>

        {/* Rent Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rent Payable</span>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {formatINR(metrics?.total_rent_due)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Accumulated rent obligation</p>
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Rent Due (Pending)</span>
            <div className="text-3xl font-black text-amber-900 mt-2">
              {formatINR(metrics?.total_rent_pending)}
            </div>
            <p className="text-xs text-amber-700 mt-1">Pending payment to TourBee</p>
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Rent Paid</span>
            <div className="text-3xl font-black text-emerald-900 mt-2">
              {formatINR(metrics?.total_rent_paid)}
            </div>
            <p className="text-xs text-emerald-700 mt-1">Confirmed payments to date</p>
          </div>
        </div>

        {/* Rent Program Rules Capsule */}
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-slate-700 text-xs space-y-1.5">
          <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span>Fixed Rent Mode Rates & Rules</span>
          </div>
          <p>• <strong>Half Day:</strong> ₹650 / day</p>
          <p>• <strong>Full Day:</strong> ₹1,200 / day</p>
          <p>• Fuel (CNG) and operational expenses are the driver's responsibility. Vehicle maintenance remains the company's responsibility.</p>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Your Recent Daily Rent Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Rent Type</th>
                  <th className="py-3 px-4 text-right">Rent Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recent_submissions?.length > 0 ? (
                  metrics.recent_submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-3 px-4 font-bold text-slate-800">{sub.date}</td>
                      <td className="py-3 px-4 text-slate-600">{sub.vehicle_reg || '—'}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-900">
                        {sub.working_day_type === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatINR(sub.final_gpay_amount || sub.J)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            sub.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {sub.status === 'PAID' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      No rent submissions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- 50% PROFIT-SHARING DRIVER DASHBOARD ----------------
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-bold mb-3 border border-emerald-500/40">
              <span>50% Profit-Sharing Mode</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {metrics?.driver_name || user?.username}!
            </h2>
            <p className="text-emerald-200/90 text-sm mt-1 max-w-xl">
              Assigned Vehicle: <span className="font-bold text-white">{metrics?.assigned_vehicle || 'Not Assigned'}</span>
            </p>
          </div>

          <Link
            to="/submissions"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-950/40 active:scale-95 transition-all self-start md:self-auto"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Submit Daily Uber Details</span>
          </Link>
        </div>
      </div>

      {/* 50% Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Uber Earnings</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {formatINR(metrics?.total_uber_earnings)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total revenue generated on Uber</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your 50% Salary Share</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {formatINR(metrics?.total_driver_salary)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Driver share of distributable profit</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TourBee 50% Share</span>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 mt-2">
            {formatINR(metrics?.total_tourbee_share)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Fleet owner share of profit</p>
        </div>

        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending GPay Amount</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-2">
            {formatINR(metrics?.total_gpay_pending)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Pending Google Pay settlement</p>
        </div>
      </div>

      {/* My Salary: Total / Paid / Balance */}
      <MySalaryDashboardSection />

      {/* Recent 50% Submissions & Calculation Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Your Daily Calculations & Settlement History</h3>
          <Link to="/submissions" className="text-xs font-bold text-emerald-600 hover:underline">
            New Submission →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Uber Gross</th>
                <th className="py-3 px-4">Cash Collected</th>
                <th className="py-3 px-4">CNG / Expenses</th>
                <th className="py-3 px-4">Driver Salary</th>
                <th className="py-3 px-4 text-right">Final GPay</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.recent_submissions?.length > 0 ? (
                metrics.recent_submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-3 px-4 font-bold text-slate-800">{sub.date}</td>
                    <td className="py-3 px-4 text-slate-600">{sub.vehicle_reg || '—'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatINR(sub.total_uber_earnings)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatINR(sub.passenger_cash_collected)}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatINR(sub.cng_expense)} + {formatINR(sub.expenses)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatINR(sub.driver_salary)}</td>
                    <td className="py-3 px-4 text-right font-black text-amber-950 text-sm">
                      {formatINR(sub.final_gpay_amount || sub.J)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          sub.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {sub.status === 'PAID' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-slate-400">
                    No submissions recorded yet. Click above to submit today's Uber details.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
