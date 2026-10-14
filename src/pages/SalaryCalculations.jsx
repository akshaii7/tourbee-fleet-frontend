import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fleetService, driverService, deductionService } from '../services/api';
import {
  DollarSign,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Receipt,
  AlertCircle,
  Plus,
  FileCheck,
  ShieldAlert,
  FileText,
  Trash2,
  Check,
  X
} from 'lucide-react';

export default function SalaryCalculations() {
  const { user, isAdmin } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [calculations, setCalculations] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected driver for balance / filter
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Deduction Modal State
  const [deductionModal, setDeductionModal] = useState(false);
  const [deductionForm, setDeductionForm] = useState({
    driver: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    reason: '',
    file: null,
  });
  const [submittingDeduction, setSubmittingDeduction] = useState(false);

  // Salary Payout Modal State
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    driver: '',
    amount: '',
    month: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const promises = [
        fleetService.getCalculations(),
        fleetService.getSalaryPayments(),
        fleetService.getDeductions(),
      ];
      if (isAdmin) {
        promises.push(driverService.getAll());
      }

      const [calcRes, payRes, dedRes, drvRes] = await Promise.all(promises);
      const calcList = calcRes.data.results || calcRes.data || [];
      const payList = payRes.data.results || payRes.data || [];
      const dedList = dedRes.data.results || dedRes.data || [];

      setCalculations(calcList);
      setSalaryPayments(payList);
      setDeductions(dedList);

      if (drvRes) {
        const drvList = drvRes.data.results || drvRes.data || [];
        setDrivers(drvList);
        if (drvList.length > 0 && !selectedDriverId) {
          setSelectedDriverId(drvList[0].id);
          setDeductionForm((prev) => ({ ...prev, driver: drvList[0].id }));
          setPaymentForm((prev) => ({ ...prev, driver: drvList[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch financial and deduction records.');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  // Filter items by selectedDriverId if chosen or current driver
  const activeDriverId = isAdmin ? selectedDriverId : (user?.driver_profile?.id || '');

  const filteredCalcs = activeDriverId
    ? calculations.filter((c) => String(c.driver) === String(activeDriverId) || String(c.driver?.id) === String(activeDriverId))
    : calculations;

  const filteredPayments = activeDriverId
    ? salaryPayments.filter((p) => String(p.driver) === String(activeDriverId) || String(p.driver?.id) === String(activeDriverId))
    : salaryPayments;

  const filteredDeductions = activeDriverId
    ? deductions.filter((d) => String(d.driver) === String(activeDriverId) || String(d.driver?.id) === String(activeDriverId))
    : deductions;

  // Salary Balance Formula:
  // Approved Salary Balance = Total Approved Driver Salary - Salary Already Paid - Approved Deductions
  const totalApprovedSalary = filteredCalcs.reduce(
    (acc, curr) => acc + Number(curr.driver_share || 0),
    0
  );

  const totalSalaryPaid = filteredPayments.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  const totalApprovedDeductions = filteredDeductions
    .filter((d) => d.status === 'APPROVED')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalPendingDeductions = filteredDeductions
    .filter((d) => d.status === 'PENDING')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const remainingSalaryBalance = Math.max(
    0,
    totalApprovedSalary - totalSalaryPaid - totalApprovedDeductions
  );

  // Handle Add Deduction Submit
  const handleCreateDeduction = async (e) => {
    e.preventDefault();
    if (!deductionForm.driver && isAdmin) {
      setError('Please select a driver for deduction.');
      return;
    }
    setSubmittingDeduction(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      data.append('driver', deductionForm.driver || selectedDriverId);
      data.append('date', deductionForm.date);
      data.append('amount', deductionForm.amount);
      data.append('reason', deductionForm.reason);
      if (deductionForm.file) {
        data.append('supporting_document', deductionForm.file);
      }

      await fleetService.createDeduction(data);
      setSuccessMsg('Accident / Other Deduction recorded successfully!');
      setDeductionModal(false);
      setDeductionForm({
        driver: selectedDriverId || '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        reason: '',
        file: null,
      });
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to record deduction entry.');
    } finally {
      setSubmittingDeduction(false);
    }
  };

  // Handle Approve / Reject Deduction
  const handleApproveDeduction = async (id) => {
    try {
      await fleetService.approveDeduction(id);
      setSuccessMsg('Deduction approved successfully. Driver balance updated.');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to approve deduction.');
    }
  };

  const handleRejectDeduction = async (id) => {
    try {
      await fleetService.rejectDeduction(id);
      setSuccessMsg('Deduction rejected.');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to reject deduction.');
    }
  };

  // Handle Salary Payment
  const handleRecordSalaryPayment = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setError('');

    try {
      await fleetService.createSalaryPayment({
        driver: paymentForm.driver || selectedDriverId,
        amount: paymentForm.amount,
        month: paymentForm.month,
        notes: paymentForm.notes || 'Salary disbursement',
      });
      setSuccessMsg(`Salary payment of ₹${paymentForm.amount} disbursed successfully!`);
      setPaymentModal(false);
      setPaymentForm({
        driver: selectedDriverId || '',
        amount: '',
        month: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to record salary payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Salary & Profit Share Details
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            50% Revenue Sharing & Deduction Ledger. Approved deductions update remaining balance automatically.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setDeductionForm((prev) => ({ ...prev, driver: selectedDriverId || (drivers[0]?.id || '') }));
                setDeductionModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Add Accident / Deduction</span>
            </button>
            <button
              onClick={() => {
                setPaymentForm((prev) => ({
                  ...prev,
                  driver: selectedDriverId || (drivers[0]?.id || ''),
                  amount: remainingSalaryBalance > 0 ? remainingSalaryBalance.toFixed(2) : '',
                }));
                setPaymentModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Salary Payment</span>
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Driver Selector Filter for Admin */}
      {isAdmin && drivers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">Filter By Driver:</span>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
            >
              <option value="">All Registered Drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user_full_name || d.user_username || `Driver #${d.id}`} {d.assigned_vehicle_reg ? `(${d.assigned_vehicle_reg})` : ''}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Formula: Approved Salary Balance = Total Approved Driver Salary - Salary Already Paid - Approved Deductions
          </span>
        </div>
      )}

      {/* Financial Metric Cards (Total Approved, Paid, Deductions, Remaining Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Approved Driver Salary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Approved Driver Salary
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatINR(totalApprovedSalary)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            From {filteredCalcs.length} verified daily calculations
          </p>
        </div>

        {/* Card 2: Salary Already Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Salary Already Paid
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">
            {formatINR(totalSalaryPaid)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Disbursed to driver bank / UPI
          </p>
        </div>

        {/* Card 3: Approved Deductions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Approved Deductions
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              {filteredDeductions.filter((d) => d.status === 'APPROVED').length} Approved
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            -{formatINR(totalApprovedDeductions)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Accident, damage & other deductions
          </p>
        </div>

        {/* Card 4: Remaining Salary Balance */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-md">
          <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
            Remaining Salary Balance
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight text-white">
            {formatINR(remainingSalaryBalance)}
          </div>
          <p className="text-xs text-emerald-100/80 mt-1 font-medium">
            Net balance payable to driver
          </p>
        </div>
      </div>

      {/* Accident / Other Deduction Ledger Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>Accident / Other Deduction Records</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Only admin-approved deductions affect the driver balance. History and reasons are preserved.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setDeductionForm((prev) => ({ ...prev, driver: selectedDriverId || (drivers[0]?.id || '') }));
                setDeductionModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Deduction</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Driver</th>
                <th className="px-5 py-3.5">Reason / Description</th>
                <th className="px-5 py-3.5">Deduction Amount</th>
                <th className="px-5 py-3.5">Document / Proof</th>
                <th className="px-5 py-3.5">Status</th>
                {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDeductions.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {new Date(d.date).toLocaleDateString('en-GB')}
                    <div className="text-[10px] text-slate-400 font-normal">
                      {d.created_at ? new Date(d.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{d.driver_name || `Driver #${d.driver}`}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-800 font-medium max-w-xs">
                    {d.reason}
                  </td>
                  <td className="px-5 py-4 text-rose-600 font-extrabold text-sm">
                    -{formatINR(d.amount)}
                  </td>
                  <td className="px-5 py-4">
                    {d.supporting_document ? (
                      <a
                        href={d.supporting_document}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-bold underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">None attached</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        d.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-4 text-right">
                      {d.status === 'PENDING' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleApproveDeduction(d.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            title="Approve Deduction"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRejectDeduction(d.id)}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                            title="Reject Deduction"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredDeductions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-8 text-center text-slate-400">
                    No accident or deduction records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Calculations / Profit Share Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Daily Driver Salary & Share Records</h3>
            <p className="text-xs text-slate-500 mt-0.5">50% Distributable Profit share earnings per shift</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{filteredCalcs.length} shifts found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Driver</th>
                <th className="px-5 py-3.5">Uber Earnings</th>
                <th className="px-5 py-3.5">Cash Collected</th>
                <th className="px-5 py-3.5">Net Driver Profit Share</th>
                <th className="px-5 py-3.5">Company Share</th>
                <th className="px-5 py-3.5">Company Payment (J)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCalcs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {new Date(c.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{c.driver_name || `Driver #${c.driver}`}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{c.vehicle_reg || 'Assigned Car'}</div>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {formatINR(c.A)}
                  </td>
                  <td className="px-5 py-4 font-semibold text-amber-700">
                    {formatINR(c.B)}
                  </td>
                  <td className="px-5 py-4 text-emerald-700 font-extrabold text-sm">
                    {formatINR(c.driver_share)}
                  </td>
                  <td className="px-5 py-4 text-teal-700 font-bold">
                    {formatINR(c.company_share)}
                  </td>
                  <td className="px-5 py-4 text-slate-900 font-extrabold">
                    {formatINR(c.J)}
                  </td>
                </tr>
              ))}
              {filteredCalcs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No daily calculation records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Disbursement History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Salary Payment Disbursements</h3>
          <span className="text-xs text-slate-400 font-semibold">{filteredPayments.length} payouts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Payment Date</th>
                <th className="px-5 py-3.5">Driver</th>
                <th className="px-5 py-3.5">Amount Disbursed</th>
                <th className="px-5 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {new Date(p.payment_date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {p.driver_name || `Driver #${p.driver}`}
                  </td>
                  <td className="px-5 py-4 text-blue-700 font-extrabold text-sm">
                    {formatINR(p.amount)}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {p.notes || 'Settled'}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    No salary payout records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Accident / Other Deduction Modal */}
      {deductionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-2.5 mb-1">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Add Accident / Other Deduction
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter deduction amount, driver, and description. Affects the driver balance automatically once approved.
            </p>

            <form onSubmit={handleCreateDeduction} className="space-y-4 text-xs">
              {isAdmin && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver</label>
                  <select
                    required
                    value={deductionForm.driver}
                    onChange={(e) => setDeductionForm({ ...deductionForm, driver: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.user_full_name || d.user_username || `Driver #${d.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={deductionForm.date}
                  onChange={(e) => setDeductionForm({ ...deductionForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deduction Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1500.00"
                  value={deductionForm.amount}
                  onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-rose-600 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accident damage, Vehicle repair, Traffic fine"
                  value={deductionForm.reason}
                  onChange={(e) => setDeductionForm({ ...deductionForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Optional Supporting Document or Photo</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDeductionForm({ ...deductionForm, file: e.target.files[0] })}
                  className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-100 file:font-semibold file:text-xs hover:file:bg-slate-200"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeductionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeduction}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {submittingDeduction ? 'Saving...' : 'Save Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Disbursement Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Record Salary Disbursement
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Disburse salary payment to driver. Remaining balance will update automatically.
            </p>

            <form onSubmit={handleRecordSalaryPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver</label>
                <select
                  required
                  value={paymentForm.driver}
                  onChange={(e) => setPaymentForm({ ...paymentForm, driver: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user_full_name || d.user_username || `Driver #${d.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount to Disburse (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Google Pay UPI / Bank Transfer"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {submittingPayment ? 'Recording...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
