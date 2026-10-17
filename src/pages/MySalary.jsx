import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, History, Info, RotateCcw, CalendarDays } from 'lucide-react';
import { useMySalary } from '../hooks/useMySalary';
import {
  formatINR,
  SalarySummaryCards,
  PaymentHistory,
} from '../components/SalaryParts';

// Compact "My Salary" block embedded in the 50% driver dashboard.
export function MySalaryDashboardSection() {
  const { data, isLoading, error } = useMySalary();

  if (isLoading && !data) {
    return <div className="h-28 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />;
  }
  if (error || !data) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">My Salary</h3>
        <Link to="/my-salary" className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:underline">
          <span>Payment history</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <SalarySummaryCards
        compact
        total={data.total_salary}
        paid={data.paid_salary}
        balance={data.salary_balance}
        status={data.status}
        hasSalary={data.has_salary}
      />
    </section>
  );
}

export default function MySalary() {
  const [range, setRange] = useState({ date_from: '', date_to: '' });
  const params = {};
  if (range.date_from) params.date_from = range.date_from;
  if (range.date_to) params.date_to = range.date_to;

  const { data, isLoading, error } = useMySalary(params);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-9 h-9 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Could not load your salary details.</span>
      </div>
    );
  }

  // Fixed Daily Rent drivers have no 50% salary.
  if (data && !data.salary_applicable && !data.has_salary) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">My Salary</h2>
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-600 flex items-start space-x-3">
          <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>
            Salary does not apply to the Fixed Daily Rent mode. You can see your rent and payments on the{' '}
            <Link to="/rent" className="font-bold text-emerald-600 hover:underline">Daily Rent</Link> page.
          </p>
        </div>
      </div>
    );
  }

  const filtered = range.date_from || range.date_to;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">My Salary</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Your 50% share of daily profit, and what TourBee has paid you so far.
        </p>
      </div>

      <SalarySummaryCards
        total={data.total_salary}
        paid={data.paid_salary}
        balance={data.salary_balance}
        status={data.status}
        hasSalary={data.has_salary}
      />

      {data.status === 'PENDING' && Number(data.paid_salary) > 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 font-medium">
          Part-paid: {formatINR(data.paid_salary)} received, {formatINR(data.salary_balance)} still to be paid.
        </p>
      )}

      {/* Date filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">From</label>
          <input
            type="date"
            value={range.date_from}
            onChange={(e) => setRange((r) => ({ ...r, date_from: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">To</label>
          <input
            type="date"
            value={range.date_to}
            onChange={(e) => setRange((r) => ({ ...r, date_to: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        {filtered && (
          <button
            onClick={() => setRange({ date_from: '', date_to: '' })}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
      {filtered && (
        <p className="text-[11px] text-slate-400 -mt-3">
          The date filter narrows the lists below. Your Total, Paid and Balance above always cover all days.
        </p>
      )}

      {/* Payment history */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
          <History className="w-4 h-4 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Salary Payment History</h3>
        </div>
        <PaymentHistory payments={data.payments} />
      </div>

      {/* Where the total comes from */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Daily Salary Earned</h3>
        </div>
        {data.daily_salary.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No 50% daily calculations in this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                  <th className="py-3 px-4 text-right">Your salary (50%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.daily_salary.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{d.date}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{d.vehicle_reg}</td>
                    <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap">{formatINR(d.profit_amount)}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">{formatINR(d.driver_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
