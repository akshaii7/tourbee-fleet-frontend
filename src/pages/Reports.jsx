import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
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
  FileText
} from 'lucide-react';

export default function Reports() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportService.getFinancialReport({
        start_date: startDate,
        end_date: endDate,
      });
      setReport(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate financial reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type, format) => {
    const url = reportService.getExportUrl(type, format, startDate, endDate);
    window.open(url, '_blank');
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

  return (
    <div className="space-y-6">
      {/* Header & Export Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial P&L Statements & Exports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Audit-ready profit & loss reporting with Excel and CSV data exports for Kerala fleet operations.
          </p>
        </div>

        {/* Date Filters & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleExport('earnings', 'excel')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('earnings', 'csv')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
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
              {formatINR(summary.gross_uber_earnings + summary.rent_revenue)}
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
    </div>
  );
}
