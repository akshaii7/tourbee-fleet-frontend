import React, { useState, useRef, useMemo } from 'react';
import { AlertCircle, CheckCircle2, History, Plus, RotateCcw, Search, X, Info } from 'lucide-react';
import { fleetService } from '../services/api';
import { useSalaryOverview, SALARY_OVERVIEW_QUERY_KEY } from '../hooks/useSalaryOverview';
import { useSalaryPayments, SALARY_PAYMENTS_QUERY_KEY } from '../hooks/useSalaryPayments';
import { queryClient } from '../queryClient';
import {
  formatINR,
  SalaryStatusBadge,
  SalarySummaryCards,
  PaymentHistory,
  apiErrorMessage,
} from '../components/SalaryParts';

// Local (not UTC) YYYY-MM-DD so the default date is right around midnight in India.
const todayLocal = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const newKey = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Whole paise as integers, so the check never suffers float drift.
const toPaise = (v) => Math.round(Number(v) * 100);

const emptyForm = (driverId = '') => ({
  driver: driverId,
  amount: '',
  payment_date: todayLocal(),
  transaction_reference: '',
  notes: '',
});

export default function DriverSalaryManagement() {
  const [filters, setFilters] = useState({ driver: '', date_from: '', date_to: '' });
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');

  const payParams = useMemo(() => {
    const p = {};
    if (filters.driver) p.driver = filters.driver;
    if (filters.date_from) p.date_from = filters.date_from;
    if (filters.date_to) p.date_to = filters.date_to;
    return p;
  }, [filters.driver, filters.date_from, filters.date_to]);

  const { data: ovData, isLoading: ovLoading, error: ovError } = useSalaryOverview();
  const { data: payData, isLoading: payLoading, error: payError } = useSalaryPayments(payParams);

  const allDrivers = useMemo(() => ovData?.drivers || [], [ovData]);
  const payments = useMemo(() => {
    const list = payData?.results || payData || [];
    return { rows: Array.isArray(list) ? list : [], count: payData?.count ?? (Array.isArray(list) ? list.length : 0) };
  }, [payData]);

  const loading = ovLoading || payLoading;
  const error = ovError
    ? apiErrorMessage(ovError, 'Failed to load salary records.')
    : (payError ? apiErrorMessage(payError, 'Failed to load salary payments.') : '');

  // Payment modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); // blocks double-clicks before state re-renders
  const idemKey = useRef(newKey());

  // Drivers in scope of the driver filter (all drivers when no filter is chosen).
  const scopedDrivers = filters.driver
    ? allDrivers.filter((d) => String(d.driver_id) === String(filters.driver))
    : allDrivers;

  // Totals for the cards, summed in whole paise to avoid float drift.
  const sumPaise = (key) => scopedDrivers.reduce((acc, d) => acc + toPaise(d[key]), 0);
  const totals = {
    total_salary: sumPaise('total_salary') / 100,
    paid_salary: sumPaise('paid_salary') / 100,
    salary_balance: sumPaise('salary_balance') / 100,
  };

  const visibleDrivers = scopedDrivers.filter((d) => {
    const q = search.trim().toLowerCase();
    return !q || d.driver_name.toLowerCase().includes(q) || d.username.toLowerCase().includes(q) || (d.assigned_vehicle || '').toLowerCase().includes(q);
  });

  const selectedForm = allDrivers.find((d) => String(d.driver_id) === String(form.driver));
  const balance = selectedForm ? Number(selectedForm.salary_balance) : 0;

  const openModal = (driverId = '') => {
    idemKey.current = newKey();
    setForm(emptyForm(driverId ? String(driverId) : ''));
    setFormError('');
    setModalOpen(true);
  };

  const validate = () => {
    if (!form.driver) return 'Select a driver.';
    if (!form.amount || Number.isNaN(Number(form.amount))) return 'Enter the payment amount.';
    if (!/^\d+(\.\d{1,2})?$/.test(String(form.amount).trim())) return 'Amount must be a positive number with at most 2 decimals.';
    const paise = toPaise(form.amount);
    if (paise <= 0) return 'Payment amount must be greater than zero.';
    if (paise > toPaise(balance)) return `Amount exceeds the outstanding balance of ${formatINR(balance)}.`;
    if (!form.payment_date) return 'Choose the payment date.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // duplicate click
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fleetService.createSalaryPayment({
        driver: form.driver,
        amount: String(form.amount).trim(),
        payment_date: form.payment_date,
        transaction_reference: form.transaction_reference.trim(),
        notes: form.notes.trim(),
        idempotency_key: idemKey.current, // a retry of THIS submission can never pay twice
      });
      const who = selectedForm?.driver_name || 'driver';
      setSuccess(
        res.data?.duplicate
          ? `That payment was already recorded for ${who}. No second payment was made.`
          : `Recorded ${formatINR(res.data.amount)} for ${who}. Balance now ${formatINR(res.data.salary_summary.salary_balance)}.`
      );
      setTimeout(() => setSuccess(''), 6000);
      setModalOpen(false);
      idemKey.current = newKey();
      queryClient.invalidateQueries({ queryKey: SALARY_PAYMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SALARY_OVERVIEW_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mySalary'] });
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not record the payment.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const filtersActive = filters.driver || filters.date_from || filters.date_to;
  const totalStatus = totals.salary_balance > 0 ? 'PENDING' : 'PAID';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Driver Salary Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            50% Profit-Sharing drivers only. Salary = Profit ÷ 2 from the daily calculations. Fixed Daily Rent drivers are not included.
          </p>
        </div>
        <button
          onClick={() => openModal(filters.driver)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Salary Payment</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary */}
      <SalarySummaryCards
        total={totals.total_salary}
        paid={totals.paid_salary}
        balance={totals.salary_balance}
        status={totalStatus}
        hasSalary
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Driver</label>
          <select
            value={filters.driver}
            onChange={(e) => setFilters((f) => ({ ...f, driver: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All drivers</option>
            {allDrivers.map((d) => (
              <option key={d.driver_id} value={d.driver_id}>{d.driver_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Payments from</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Payments to</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => setFilters({ driver: '', date_from: '', date_to: '' })}
          disabled={!filtersActive}
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
      {(filters.date_from || filters.date_to) && (
        <p className="text-[11px] text-slate-400 -mt-4">
          Dates filter the payment history only. Total, Paid and Balance always cover all days.
        </p>
      )}

      {/* Drivers */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Drivers & Salary Balances</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver or vehicle"
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading && !allDrivers.length ? (
          <div className="py-10 text-center text-sm text-slate-400">Loading salary records…</div>
        ) : visibleDrivers.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No 50% Profit-Sharing drivers found.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-slate-100">
              {visibleDrivers.map((d) => (
                <li key={d.driver_id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{d.driver_name}</div>
                      <div className="text-[11px] text-slate-500">{d.assigned_vehicle || 'No vehicle'}</div>
                    </div>
                    <SalaryStatusBadge status={d.status} hasSalary={d.has_salary} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                      <div className="text-sm font-black text-slate-900">{formatINR(d.total_salary)}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">Paid</div>
                      <div className="text-sm font-black text-emerald-700">{formatINR(d.paid_salary)}</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2">
                      <div className="text-[10px] font-bold text-amber-800 uppercase">Balance</div>
                      <div className="text-sm font-black text-amber-900">{formatINR(d.salary_balance)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters((f) => ({ ...f, driver: String(d.driver_id) }))}
                      className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl"
                    >
                      <History className="w-3.5 h-3.5" /><span>History</span>
                    </button>
                    <button
                      onClick={() => openModal(d.driver_id)}
                      disabled={Number(d.salary_balance) <= 0}
                      className="flex-1 px-3 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl disabled:opacity-40"
                    >
                      Pay
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4 text-right">Total Salary</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleDrivers.map((d) => (
                    <tr key={d.driver_id} className={String(filters.driver) === String(d.driver_id) ? 'bg-emerald-50/40' : ''}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{d.driver_name}</div>
                        <div className="text-[11px] text-slate-400">@{d.username}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{d.assigned_vehicle || '—'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{formatINR(d.total_salary)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">{formatINR(d.paid_salary)}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-700 whitespace-nowrap">{formatINR(d.salary_balance)}</td>
                      <td className="py-3 px-4"><SalaryStatusBadge status={d.status} hasSalary={d.has_salary} /></td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setFilters((f) => ({ ...f, driver: String(d.driver_id) }))}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                          History
                        </button>
                        <button
                          onClick={() => openModal(d.driver_id)}
                          disabled={Number(d.salary_balance) <= 0}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center space-x-2">
          <History className="w-4 h-4 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Salary Payment History</h3>
          {filtersActive && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Filtered</span>}
        </div>
        <PaymentHistory
          payments={payments.rows}
          showDriver
          showRecordedBy
          emptyText={filtersActive ? 'No payments match these filters.' : 'No salary payments recorded yet.'}
        />
        {payments.count > payments.rows.length && (
          <p className="p-3 text-center text-[11px] text-slate-400 border-t border-slate-100">
            Showing the latest {payments.rows.length} of {payments.count} payments. Narrow with the filters above.
          </p>
        )}
      </div>

      {/* Record payment modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !submitting && setModalOpen(false)} />
          <form
            onSubmit={submit}
            noValidate
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Record Salary Payment</h3>
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Driver</label>
                <select
                  value={form.driver}
                  onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value, amount: '' }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select driver…</option>
                  {allDrivers.map((d) => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.driver_name} — balance {formatINR(d.salary_balance)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedForm && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                    <div className="font-black text-slate-900">{formatINR(selectedForm.total_salary)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-2">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">Paid</div>
                    <div className="font-black text-emerald-700">{formatINR(selectedForm.paid_salary)}</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2">
                    <div className="text-[10px] font-bold text-amber-800 uppercase">Balance</div>
                    <div className="font-black text-amber-900">{formatINR(selectedForm.salary_balance)}</div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Amount (₹)</label>
                  {selectedForm && balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, amount: String(balance.toFixed(2)).replace(/\.00$/, '') }))}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      Pay full balance
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Payment date</label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Reference (optional)</label>
                <input
                  value={form.transaction_reference}
                  onChange={(e) => setForm((f) => ({ ...f, transaction_reference: e.target.value }))}
                  placeholder="UPI / bank transaction ID"
                  maxLength={150}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Note (optional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-px" />
                  <span>{formError}</span>
                </div>
              )}
              {selectedForm && balance <= 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start space-x-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-px" />
                  <span>This driver has no outstanding salary balance.</span>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (selectedForm && balance <= 0)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 disabled:opacity-50"
              >
                {submitting ? 'Recording…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
