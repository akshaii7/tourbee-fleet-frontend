import React, { useState, useMemo } from 'react';
import { reportService } from '../services/api';
import { useFinancialReport, FINANCIAL_QUERY_KEY } from '../hooks/useFinancialReport';
import { queryClient } from '../queryClient';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Fuel,
  Wrench,
  Car,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';

const formatLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function Reports() {
  const now = new Date();
  const todayStr = formatLocalYMD(now);
  const firstOfMonthStr = formatLocalYMD(new Date(now.getFullYear(), now.getMonth(), 1));

  const [startDate, setStartDate] = useState(firstOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [exportType, setExportType] = useState('earnings');

  const reportParams = useMemo(() => {
    const p = {};
    if (startDate) p.start_date = startDate;
    if (endDate) p.end_date = endDate;
    return p;
  }, [startDate, endDate]);

  const { data: report, isLoading: loading, error: queryError, refetch } = useFinancialReport(reportParams);
  const error = queryError ? 'Failed to generate financial reports.' : '';

  const handleExport = (format) => {
    const url = reportService.getExportUrl(exportType, format, startDate, endDate);
    window.open(url, '_blank');
  };

  const setPreset = (preset) => {
    const d = new Date();
    if (preset === 'THIS_MONTH') {
      setStartDate(firstOfMonthStr);
      setEndDate(todayStr);
    } else if (preset === 'LAST_30') {
      const past30 = new Date();
      past30.setDate(d.getDate() - 30);
      setStartDate(formatLocalYMD(past30));
      setEndDate(todayStr);
    } else if (preset === 'ALL_TIME') {
      setStartDate('');
      setEndDate('');
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const summary = report?.summary || {};
  const vehicles = report?.vehicle_breakdown || [];
  const drivers = report?.driver_breakdown || [];
  const hasData = (summary.gross_uber_earnings || 0) > 0 || (summary.rent_revenue || 0) > 0 || vehicles.length > 0;

  return (
    <div className="space-y-6">
      {/* Header & Export Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Financial P&L Statements & Exports</span>
            {loading && <RotateCcw className="w-4 h-4 text-emerald-600 animate-spin" />}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Audit-ready profit & loss reporting with Excel and CSV data exports for Kerala fleet operations.
          </p>
        </div>

        {/* Date Filters & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPreset('THIS_MONTH')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                startDate === firstOfMonthStr && endDate === todayStr
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPreset('LAST_30')}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setPreset('ALL_TIME')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                !startDate && !endDate
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-0 focus:outline-none text-xs font-semibold"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-0 focus:outline-none text-xs font-semibold"
            />
          </div>

          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm focus:outline-none cursor-pointer"
          >
            <option value="earnings">Earnings & Calculations</option>
            <option value="expenses">Operating & Fuel Expenses</option>
            <option value="maintenance">Maintenance Records</option>
          </select>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !hasData && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              No calculations found for {startDate ? startDate : 'the start'} to {endDate ? endDate : 'today'}. Try viewing all-time records.
            </span>
          </div>
          <button
            onClick={() => setPreset('ALL_TIME')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap active:scale-95 transition-all"
          >
            Show All Time Records
          </button>
        </div>
      )}

      {/* P&L Statement Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">TourBee Kerala Fleet Pvt Ltd</h3>
            <p className="text-xs text-slate-500">
              Profit & Loss Statement for Period: {startDate} to {endDate}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Inflow</span>
            <span className="text-xl font-extrabold text-emerald-800">
              {formatINR((Number(summary.gross_uber_earnings) || 0) + (Number(summary.rent_revenue) || 0))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 text-xs">
          {/* Revenue Breakdown */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
              <span>Operating Revenues</span>
              <span className="text-emerald-700">Inflow (₹)</span>
            </h4>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-600 font-medium">Approved Gross Uber Earnings:</span>
              <span className="font-bold text-slate-900">{formatINR(summary.gross_uber_earnings)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-600 font-medium">Fixed Rent Collections:</span>
              <span className="font-bold text-slate-900">{formatINR(summary.rent_revenue)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-600 font-medium">Total Trips Recorded:</span>
              <span className="font-bold text-slate-900">{summary.total_trips} rides</span>
            </div>
          </div>

          {/* Deductions and Overhead */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
              <span>Deductions & Overhead Costs</span>
              <span className="text-rose-700">Outflow (₹)</span>
            </h4>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-600 font-medium">Uber Platform Commission & GST:</span>
              <span className="font-bold text-rose-600">-{formatINR(summary.uber_commission)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-600 font-medium">Approved CNG Fuel Bills:</span>
              <span className="font-bold text-rose-600">-{formatINR(summary.cng_expenses)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-600 font-medium">Highway FASTag & Tolls:</span>
              <span className="font-bold text-rose-600">-{formatINR(summary.toll_expenses)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-600 font-medium">Garage Maintenance (Company Expense):</span>
              <span className="font-bold text-rose-600">-{formatINR(summary.maintenance_costs)}</span>
            </div>
          </div>
        </div>

        {/* Net Bottom Line Bar */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">
              Net Fleet Operating Profit
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Company 50% Share + Rent Revenue - Vehicle Maintenance Costs
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {formatINR(summary.company_net_profit)}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Level Contribution */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Vehicle Performance & Fleet Contribution</h3>
          <span className="text-xs text-slate-400">{vehicles.length} active vehicles</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Registration</th>
                <th className="px-5 py-3.5">Model</th>
                <th className="px-5 py-3.5">Completed Trips</th>
                <th className="px-5 py-3.5">Gross Revenue</th>
                <th className="px-5 py-3.5">Operating Fuel</th>
                <th className="px-5 py-3.5">Garage Maintenance</th>
                <th className="px-5 py-3.5 font-bold text-slate-900">Net Fleet Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900 font-mono">{v.registration}</td>
                  <td className="px-5 py-4 text-slate-700">{v.model}</td>
                  <td className="px-5 py-4">{v.trips} rides</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{formatINR(v.gross_earnings)}</td>
                  <td className="px-5 py-4 text-slate-700">{formatINR(v.operating_expenses)}</td>
                  <td className="px-5 py-4 text-rose-600">{formatINR(v.maintenance_cost)}</td>
                  <td className="px-5 py-4 font-extrabold text-emerald-700 text-sm">
                    {formatINR(v.net_fleet_contribution)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Performance & Earnings Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Driver Performance & Earnings Breakdown</h3>
          <span className="text-xs text-slate-400">{drivers.length} registered drivers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Driver Name</th>
                <th className="px-5 py-3.5">Payment Mode</th>
                <th className="px-5 py-3.5">Assigned Vehicle</th>
                <th className="px-5 py-3.5">Submissions / Trips</th>
                <th className="px-5 py-3.5">Gross Revenue</th>
                <th className="px-5 py-3.5">Expenses & CNG</th>
                <th className="px-5 py-3.5 font-bold text-slate-900">50% Salary / Rent Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">{d.name}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.driver_type === 'DAILY_RENT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.driver_type === 'DAILY_RENT' ? 'Fixed Daily Rent' : '50% Profit Share'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold text-slate-800">{d.vehicle || 'None'}</td>
                  <td className="px-5 py-4">{d.trips || 0} days</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{formatINR(d.gross_earnings)}</td>
                  <td className="px-5 py-4 text-slate-700">{formatINR(d.expenses)}</td>
                  <td className="px-5 py-4 font-extrabold text-emerald-700 text-sm">
                    {d.driver_type === 'DAILY_RENT' ? formatINR(d.rent_due) : formatINR(d.driver_salary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
