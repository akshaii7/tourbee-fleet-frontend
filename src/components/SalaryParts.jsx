import React from 'react';
import { Wallet, CheckCircle2, Clock, Banknote, Receipt } from 'lucide-react';

// Consistent INR formatting for every salary figure (₹4,008 / ₹1,999.50).
export const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val || 0));

// Pending = balance > 0, Paid = balance settled. A partial payment stays Pending.
export function SalaryStatusBadge({ status, hasSalary = true, className = '' }) {
  if (!hasSalary) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 ${className}`}>
        No salary yet
      </span>
    );
  }
  const paid = status === 'PAID';
  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
        paid
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      } ${className}`}
    >
      {paid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      <span>{paid ? 'Paid' : 'Pending'}</span>
    </span>
  );
}

// Total Salary / Paid Salary / Salary Balance summary cards.
export function SalarySummaryCards({ total, paid, balance, status, hasSalary = true, compact = false }) {
  const pad = compact ? 'p-4' : 'p-5';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className={`bg-white ${pad} rounded-2xl border border-slate-200/80 shadow-sm`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Salary</span>
          <Wallet className="w-4 h-4 text-slate-300" />
        </div>
        <div className="text-2xl font-black text-slate-900 mt-1.5">{formatINR(total)}</div>
        <p className="text-[11px] text-slate-500 mt-0.5">Your 50% share, all days</p>
      </div>

      <div className={`bg-white ${pad} rounded-2xl border border-emerald-200 shadow-sm`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Paid Salary</span>
          <Banknote className="w-4 h-4 text-emerald-300" />
        </div>
        <div className="text-2xl font-black text-emerald-600 mt-1.5">{formatINR(paid)}</div>
        <p className="text-[11px] text-slate-500 mt-0.5">Paid by TourBee so far</p>
      </div>

      <div className={`${pad} rounded-2xl border shadow-sm ${status === 'PAID' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${status === 'PAID' ? 'text-emerald-800' : 'text-amber-800'}`}>
            Salary Balance
          </span>
          <SalaryStatusBadge status={status} hasSalary={hasSalary} />
        </div>
        <div className={`text-2xl font-black mt-1.5 ${status === 'PAID' ? 'text-emerald-900' : 'text-amber-950'}`}>
          {formatINR(balance)}
        </div>
        <p className="text-[11px] text-slate-600 mt-0.5">Total Salary − Paid Salary</p>
      </div>
    </div>
  );
}

// Readable payment history: cards on mobile, table on larger screens.
export function PaymentHistory({ payments = [], emptyText = 'No salary payments recorded yet.', showRecordedBy = false, showDriver = false }) {
  if (!payments.length) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        {emptyText}
      </div>
    );
  }
  return (
    <>
      {/* Mobile cards */}
      <ul className="md:hidden divide-y divide-slate-100">
        {payments.map((p) => (
          <li key={p.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {showDriver && <div className="text-sm font-bold text-slate-900 truncate">{p.driver_name}</div>}
              <div className={showDriver ? 'text-xs font-semibold text-slate-600' : 'text-sm font-bold text-slate-900'}>{p.payment_date}</div>
              <div className="text-xs text-slate-500 truncate">
                {[p.transaction_reference, p.notes].filter(Boolean).join(' · ') || '—'}
              </div>
              {showRecordedBy && p.recorded_by_name && (
                <div className="text-[11px] text-slate-400 mt-0.5">by {p.recorded_by_name}</div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-black text-emerald-600">{formatINR(p.amount)}</div>
              <SalaryStatusBadge status="PAID" className="mt-1" />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              {showDriver && <th className="py-3 px-4">Driver</th>}
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Note</th>
              {showRecordedBy && <th className="py-3 px-4">Recorded by</th>}
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id}>
                {showDriver && <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{p.driver_name}</td>}
                <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{p.payment_date}</td>
                <td className="py-3 px-4 text-right font-black text-emerald-600 whitespace-nowrap">{formatINR(p.amount)}</td>
                <td className="py-3 px-4 text-slate-600">{p.transaction_reference || '—'}</td>
                <td className="py-3 px-4 text-slate-600">{p.notes || '—'}</td>
                {showRecordedBy && <td className="py-3 px-4 text-slate-500">{p.recorded_by_name || '—'}</td>}
                <td className="py-3 px-4"><SalaryStatusBadge status="PAID" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Pull a readable message out of a DRF error response.
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return fallback;
  const first = (v) => (Array.isArray(v) ? v[0] : typeof v === 'object' && v ? first(Object.values(v)[0]) : v);
  const msg = data.detail || data.error || first(Object.values(data)[0]);
  return typeof msg === 'string' ? msg : fallback;
}
