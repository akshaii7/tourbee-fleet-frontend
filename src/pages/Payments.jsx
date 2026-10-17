import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { financeService } from '../services/api';
import {
  Receipt,
  DollarSign,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Search,
  Filter
} from 'lucide-react';

import { useFinanceSalaryPayments, useFinanceRentPayments } from '../hooks/useFinancePayments';

export default function Payments() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('SALARY'); // 'SALARY' or 'RENT'

  const { data: salaryData, isLoading: salaryLoading, error: salaryError } = useFinanceSalaryPayments();
  const { data: rentData, isLoading: rentLoading, error: rentError } = useFinanceRentPayments();

  const salaryPayments = salaryData || [];
  const rentPayments = rentData || [];
  const loading = activeTab === 'SALARY' ? salaryLoading : rentLoading;
  const error = (activeTab === 'SALARY' ? salaryError : rentError) ? 'Failed to fetch payment records.' : '';

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Payment & Transaction Records
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Comprehensive ledger of driver profit payouts and vehicle rental collections with bank reference UTRs.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('SALARY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'SALARY'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Salary Disbursements ({salaryPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RENT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'RENT'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Rent Collections ({rentPayments.length})</span>
        </button>
      </div>

      {/* Tab 1: Salary Disbursements */}
      {activeTab === 'SALARY' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Driver</th>
                  <th className="px-5 py-3.5">Disbursed Amount</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Transaction Ref / UTR</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salaryPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {new Date(p.payment_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">{p.driver_name}</td>
                    <td className="px-5 py-4 font-extrabold text-emerald-700 text-sm">
                      {formatINR(p.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-700">{p.transaction_reference || 'N/A'}</td>
                    <td className="px-5 py-4 text-slate-500 italic max-w-xs truncate">{p.notes || '-'}</td>
                    <td className="px-5 py-4 text-slate-400">{p.recorded_by_name}</td>
                  </tr>
                ))}
                {salaryPayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-400">
                      No salary payment disbursements found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rent Collections */}
      {activeTab === 'RENT' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Driver & Vehicle</th>
                  <th className="px-5 py-3.5">Rental Period</th>
                  <th className="px-5 py-3.5">Total Due</th>
                  <th className="px-5 py-3.5">Amount Collected</th>
                  <th className="px-5 py-3.5">Outstanding Balance</th>
                  <th className="px-5 py-3.5">Method & Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {new Date(p.payment_date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{p.driver_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.vehicle_reg}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {new Date(p.period_start).toLocaleDateString('en-GB')} to {new Date(p.period_end).toLocaleDateString('en-GB')} ({p.days_count} days)
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">{formatINR(p.amount_due)}</td>
                    <td className="px-5 py-4 font-extrabold text-emerald-700 text-sm">{formatINR(p.amount_paid)}</td>
                    <td className="px-5 py-4 font-bold text-amber-700">{formatINR(p.outstanding_balance)}</td>
                    <td className="px-5 py-4">
                      <div>{p.payment_method}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.transaction_reference || 'N/A'}</div>
                    </td>
                  </tr>
                ))}
                {rentPayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-400">
                      No rent payments recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
