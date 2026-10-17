import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fleetService } from '../services/api';
import { useFleetVehicles } from '../hooks/useFleetVehicles';
import { useDrivers } from '../hooks/useDrivers';
import { useDashboard } from '../hooks/useDashboard';
import { useCalculations, CALCULATIONS_QUERY_KEY } from '../hooks/useCalculations';
import { queryClient } from '../queryClient';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Car,
  DollarSign,
  Fuel,
  Receipt,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function Submissions() {
  const { user, isAdmin } = useAuth();
  const revShareParams = useMemo(() => ({ payment_mode: 'REVENUE_SHARING' }), []);
  const { data: vRes, isLoading: vLoading } = useFleetVehicles();
  const { data: cRes, isLoading: cLoading } = useCalculations(revShareParams);
  const { data: dRes, isLoading: dLoading } = useDrivers();
  const { data: dashRes, isLoading: dashLoading } = useDashboard();

  const vehicles = useMemo(() => {
    const list = vRes?.results ?? vRes ?? [];
    return Array.isArray(list) ? list : [];
  }, [vRes]);

  const calculations = useMemo(() => {
    const list = cRes?.results ?? cRes ?? [];
    return Array.isArray(list) ? list : [];
  }, [cRes]);

  const drivers = useMemo(() => {
    const list = dRes?.results ?? dRes ?? [];
    return Array.isArray(list) ? list : [];
  }, [dRes]);

  const loading = vLoading || cLoading || (isAdmin ? dLoading : dashLoading);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Results Screen State
  const [submittedResult, setSubmittedResult] = useState(null);

  // File Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // The 9 Required Fields for 50% Mode
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    driver: '',
    vehicle: '',
    date: todayStr,
    total_uber_earnings: '',
    passenger_cash_collected: '',
    cng_expense: '',
    expenses: '',
    refund: '',
  });

  const [cngBillFile, setCngBillFile] = useState(null);
  const [uberScreenshotFile, setUberScreenshotFile] = useState(null);

  // Real-time live calculation breakdown
  const [liveBreakdown, setLiveBreakdown] = useState({
    wallet_difference: 0,
    profit_amount: 0,
    driver_salary: 0,
    tourbee_share: 0,
    amount_after_wallet: 0,
    final_gpay_amount: 0,
  });

  // Pre-select driver / vehicle
  useEffect(() => {
    if (isAdmin) {
      if (drivers.length > 0 && !formData.driver) {
        const firstDriver = drivers[0];
        const matchVeh = firstDriver.assigned_vehicle
          ? vehicles.find(v => v.id === firstDriver.assigned_vehicle || v.registration_number === firstDriver.assigned_vehicle)
          : null;
        setFormData((prev) => ({
          ...prev,
          driver: firstDriver.id,
          vehicle: prev.vehicle || matchVeh?.id || vehicles[0]?.id || '',
        }));
      } else if (vehicles.length > 0 && !formData.vehicle) {
        setFormData((prev) => ({ ...prev, vehicle: vehicles[0].id }));
      }
    } else {
      if (!formData.vehicle) {
        let assignedVehicleId = dashRes?.assigned_vehicle_id || (vehicles.length > 0 ? vehicles[0].id : '');
        if (assignedVehicleId) {
          setFormData((prev) => ({ ...prev, vehicle: assignedVehicleId }));
        }
      }
    }
  }, [isAdmin, drivers, vehicles, dashRes, formData.driver, formData.vehicle]);


  // Recalculate live breakdown — corrected 50% profit-sharing formula
  useEffect(() => {
    const A = Math.max(0, parseFloat(formData.total_uber_earnings) || 0);
    const B = Math.max(0, parseFloat(formData.passenger_cash_collected) || 0);
    const E = Math.max(0, parseFloat(formData.cng_expense) || 0);
    const D = Math.max(0, parseFloat(formData.expenses) || 0);
    const F = Math.max(0, parseFloat(formData.refund) || 0);

    // Step 1: Wallet Difference = Total Uber Earnings - Passenger Cash Collected
    const wallet_difference = A - B;

    // Step 2: Net Profit = Total Uber Earnings - CNG Expense - Other Expenses
    const profit_amount = A - E - D;

    // Step 3: Driver Share = Net Profit × 50%
    const driver_salary = profit_amount / 2;

    // Step 4: TourBee Share = Net Profit × 50%
    const tourbee_share = profit_amount / 2;

    // Step 5: Final GPay = TourBee Share - Wallet Difference - Refund
    // TourBee is owed their 50%, but Uber already settled wallet_difference
    // to the company, and refund reduces what the driver owes.
    const amount_after_wallet = tourbee_share - wallet_difference;
    const final_gpay_amount = amount_after_wallet - F;

    setLiveBreakdown({
      wallet_difference,
      profit_amount,
      driver_salary,
      tourbee_share,
      amount_after_wallet,
      final_gpay_amount,
    });
  }, [
    formData.total_uber_earnings,
    formData.passenger_cash_collected,
    formData.cng_expense,
    formData.expenses,
    formData.refund,
  ]);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.vehicle) {
      setError('Please select a vehicle number.');
      return;
    }
    if (!formData.date) {
      setError('Please select a date.');
      return;
    }
    if (formData.total_uber_earnings === '' || Number(formData.total_uber_earnings) < 0) {
      setError('Please enter a valid Total Uber Earnings amount.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('date', formData.date);
      data.append('vehicle', formData.vehicle);
      data.append('payment_mode', 'REVENUE_SHARING');
      data.append('total_uber_earnings', formData.total_uber_earnings || '0');
      data.append('passenger_cash_collected', formData.passenger_cash_collected || '0');
      data.append('cng_expense', formData.cng_expense || '0');
      data.append('expenses', formData.expenses || '0');
      data.append('refund', formData.refund || '0');

      if (isAdmin && formData.driver) {
        data.append('driver', formData.driver);
      }

      if (cngBillFile) {
        data.append('cng_bill_file', cngBillFile);
      }
      if (uberScreenshotFile) {
        data.append('uber_screenshot_file', uberScreenshotFile);
      }

      const res = await fleetService.createSubmissionMultipart(data);
      const saved = res.data;

      // Display the Results Screen
      setSubmittedResult(saved);
      setSuccessMsg('Daily Uber earnings submitted successfully!');

      // Reset form
      setFormData((prev) => ({
        ...prev,
        total_uber_earnings: '',
        passenger_cash_collected: '',
        cng_expense: '',
        expenses: '',
        refund: '',
      }));
      setCngBillFile(null);
      setUberScreenshotFile(null);

      // Invalidate calculations cache so list refreshes across all pages
      queryClient.invalidateQueries({ queryKey: CALCULATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error(err);
      const resData = err.response?.data;
      let msg = 'Failed to submit daily earnings. Please verify input values.';
      if (resData) {
        if (typeof resData === 'string') {
          msg = resData;
        } else if (resData.detail) {
          msg = resData.detail;
        } else if (resData.non_field_errors) {
          const raw = Array.isArray(resData.non_field_errors)
            ? resData.non_field_errors.join('. ')
            : String(resData.non_field_errors);
          if (raw.toLowerCase().includes('unique set') || raw.toLowerCase().includes('unique')) {
            msg = `A submission for this driver on ${formData.date || 'this date'} already exists. If you need to update it, please view the existing calculation below.`;
          } else {
            msg = raw;
          }
        } else {
          // Collect all field errors
          const fieldErrors = Object.entries(resData)
            .map(([field, errs]) => {
              const errText = Array.isArray(errs) ? errs.join(', ') : String(errs);
              return `${field}: ${errText}`;
            })
            .join(' | ');
          if (fieldErrors) {
            if (fieldErrors.toLowerCase().includes('unique set')) {
              msg = `A submission for this driver on ${formData.date || 'this date'} already exists.`;
            } else {
              msg = fieldErrors;
            }
          }
        }
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkStatus = async (calcId, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await fleetService.markStatus(calcId, newStatus);
      setSuccessMsg(`Status updated to ${newStatus === 'PAID' ? 'Paid' : 'Pending'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      queryClient.invalidateQueries({ queryKey: CALCULATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
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

  // Helper to load test example values
  const handleLoadTestExample = () => {
    setFormData((prev) => ({
      ...prev,
      total_uber_earnings: '13667',
      passenger_cash_collected: '13210',
      cng_expense: '4825',
      expenses: '826',
      refund: '415',
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2 border border-blue-200">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span>50% Profit-Sharing Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Daily Driver Submission
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Submit daily Uber revenue, fuel bills, and earnings screenshots with automatic 50% calculation.
          </p>
        </div>

        <button
          onClick={handleLoadTestExample}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold self-start border border-slate-300"
          title="Fills in: Total Uber: ₹13,667, Cash: ₹13,210, CNG: ₹4,825, Expenses: ₹826, Refund: ₹415"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Load Test Example (₹13,667)</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* ================= RESULTS SCREEN MODAL (Section 5) ================= */}
      {submittedResult && (
        <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white rounded-3xl shadow-2xl border border-emerald-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Submission Confirmed & Calculated</span>
            </div>
            <button
              onClick={() => setSubmittedResult(null)}
              className="text-xs text-slate-400 hover:text-white font-bold"
            >
              ✕ Dismiss
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-black">
            50% Calculation Summary — {submittedResult.date}
          </h3>
          <p className="text-emerald-200/80 text-xs mt-1">
            Vehicle: <span className="font-bold text-white">{submittedResult.vehicle_reg}</span> | Driver: <span className="font-bold text-white">{submittedResult.driver_name || user?.username}</span>
          </p>

          {/* Prominent GPay Amount */}
          <div className="my-6 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Final GPay Amount
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white mt-1 tracking-tight">
              {formatINR(submittedResult.final_gpay_amount || submittedResult.J)}
            </div>
            <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30">
              <span>Status: {submittedResult.status === 'PAID' ? 'Paid' : 'Pending'}</span>
            </div>
          </div>

          {/* Detailed 8-Step Breakdown Table */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Total Uber Earnings</div>
              <div className="font-bold text-white text-sm mt-0.5">{formatINR(submittedResult.total_uber_earnings)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Passenger Cash</div>
              <div className="font-bold text-white text-sm mt-0.5">{formatINR(submittedResult.passenger_cash_collected)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Wallet Difference</div>
              <div className="font-bold text-blue-300 text-sm mt-0.5">{formatINR(submittedResult.wallet_difference)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">CNG Expense</div>
              <div className="font-bold text-white text-sm mt-0.5">{formatINR(submittedResult.cng_expense)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Expenses</div>
              <div className="font-bold text-white text-sm mt-0.5">{formatINR(submittedResult.expenses)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Refund</div>
              <div className="font-bold text-white text-sm mt-0.5">{formatINR(submittedResult.refund)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Profit Amount</div>
              <div className="font-bold text-teal-300 text-sm mt-0.5">{formatINR(submittedResult.profit_amount)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Driver Salary (50%)</div>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">{formatINR(submittedResult.driver_salary)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">TourBee Share (50%)</div>
              <div className="font-bold text-teal-400 text-sm mt-0.5">{formatINR(submittedResult.tourbee_share)}</div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="text-slate-400">Payment Status</div>
              <div className="font-black text-amber-300 text-sm mt-0.5">{submittedResult.status}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Submission Form & Real-Time Calculation Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Enter Daily Shift Details</h2>
          <p className="text-xs text-slate-500 mb-5">
            Fill in the 7 input fields and upload the 2 mandatory verification documents.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If Admin, allow selecting driver */}
            {isAdmin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Driver <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.driver}
                  onChange={(e) => handleInputChange('driver', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name || d.username} ({d.driver_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Row 1: Date & Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2. Vehicle Number <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.vehicle}
                  onChange={(e) => handleInputChange('vehicle', e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} ({v.make} {v.model})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Total Uber Earnings & Passenger Cash Collected */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  3. Total Uber Earnings (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Before commission (e.g. 13667)"
                  value={formData.total_uber_earnings}
                  onChange={(e) => handleInputChange('total_uber_earnings', e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Amount before Uber commission deduction</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  4. Passenger Cash Collected (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Cash directly received (e.g. 13210)"
                  value={formData.passenger_cash_collected}
                  onChange={(e) => handleInputChange('passenger_cash_collected', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Cash received in hand from passengers</span>
              </div>
            </div>

            {/* Row 3: CNG Expense, Expenses, Refund */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  5. CNG Expense (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 4825"
                  value={formData.cng_expense}
                  onChange={(e) => handleInputChange('cng_expense', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  6. Expenses (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 826"
                  value={formData.expenses}
                  onChange={(e) => handleInputChange('expenses', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Separate other expenses</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  7. Refund (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 415"
                  value={formData.refund}
                  onChange={(e) => handleInputChange('refund', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Trip adjustment refund</span>
              </div>
            </div>

            {/* Row 4: File Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1.5">
                  <Fuel className="w-4 h-4 text-emerald-600" />
                  <span>8. Upload CNG Bill</span>
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCngBillFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
                {cngBillFile && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">✓ {cngBillFile.name}</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>9. Upload Uber Screenshot</span>
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setUberScreenshotFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {uberScreenshotFile && (
                  <p className="text-[11px] text-blue-700 font-bold mt-1">✓ {uberScreenshotFile.name}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting & Calculating...' : 'Submit Daily Uber Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation Preview Card (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Live Formula Preview
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-semibold">
                Confirmed 50% Specs
              </span>
            </div>

            {/* Prominent GPay Preview */}
            <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/30 text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Final GPay Amount
              </span>
              <div className={`text-3xl sm:text-4xl font-black mt-1 ${liveBreakdown.final_gpay_amount < 0 ? 'text-red-400' : 'text-white'}`}>
                {liveBreakdown.final_gpay_amount < 0 ? '-' : ''}{formatINR(Math.abs(liveBreakdown.final_gpay_amount))}
              </div>
              <p className="text-[11px] text-emerald-300/80 mt-1 font-medium">
                {liveBreakdown.final_gpay_amount >= 0 ? 'Amount driver pays TourBee via GPay' : 'Company owes driver this amount'}
              </p>
            </div>

            {/* Calculation Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Wallet Difference (A − B)</span>
                <span className={`font-bold ${liveBreakdown.wallet_difference < 0 ? 'text-red-400' : 'text-white'}`}>{formatINR(liveBreakdown.wallet_difference)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Net Profit (A − CNG − Expenses)</span>
                <span className={`font-bold ${liveBreakdown.profit_amount < 0 ? 'text-red-400' : 'text-white'}`}>{formatINR(liveBreakdown.profit_amount)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Driver Share (50%)</span>
                <span className="font-bold text-emerald-400">{formatINR(liveBreakdown.driver_salary)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">TourBee Share (50%)</span>
                <span className="font-bold text-teal-400">{formatINR(liveBreakdown.tourbee_share)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">After Wallet Adjustment</span>
                <span className="font-bold text-white">{formatINR(liveBreakdown.amount_after_wallet)}</span>
              </div>
              <div className="flex justify-between items-center py-1 font-black text-emerald-300">
                <span>Final GPay Amount</span>
                <span className="text-sm">{formatINR(liveBreakdown.final_gpay_amount)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-800/60 rounded-xl text-[11px] text-slate-400 border border-slate-700/60">
            <strong>Formula:</strong> Final GPay = TourBee Share (50%) − Wallet Difference − Refund
          </div>
        </div>
      </div>

      {/* Calculation History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Previous Daily 50% Calculations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review previous submissions, calculations, and payment statuses.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Date</th>
                {isAdmin && <th className="py-3 px-4">Driver</th>}
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4 text-right">Uber Gross</th>
                <th className="py-3 px-4 text-right">Cash</th>
                <th className="py-3 px-4 text-right">Wallet Diff</th>
                <th className="py-3 px-4 text-right">Profit Amount</th>
                <th className="py-3 px-4 text-right">Driver (50%)</th>
                <th className="py-3 px-4 text-right">TourBee (50%)</th>
                <th className="py-3 px-4 text-right">Final GPay</th>
                <th className="py-3 px-4 text-center">Docs</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculations.length > 0 ? (
                calculations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{c.date}</td>
                    {isAdmin && (
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        {c.driver_name || `Driver #${c.driver}`}
                      </td>
                    )}
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">{c.vehicle_reg || '—'}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(c.total_uber_earnings)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatINR(c.passenger_cash_collected)}</td>
                    <td className="py-3 px-4 text-right text-blue-700 font-semibold">{formatINR(c.wallet_difference)}</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatINR(c.profit_amount)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-bold">{formatINR(c.driver_salary)}</td>
                    <td className="py-3 px-4 text-right text-teal-700 font-bold">{formatINR(c.tourbee_share)}</td>
                    <td className="py-3 px-4 text-right font-black text-sm text-slate-900">{formatINR(c.final_gpay_amount || c.J)}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        {(c.cng_bill_url || c.cng_bill_file) ? (
                          <button
                            onClick={() => setPreviewDoc({ title: 'CNG Bill', url: c.cng_bill_url || c.cng_bill_file })}
                            className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200"
                            title="View CNG Bill"
                          >
                            CNG
                          </button>
                        ) : null}
                        {(c.uber_screenshot_url || c.uber_screenshot_file) ? (
                          <button
                            onClick={() => setPreviewDoc({ title: 'Uber Screenshot', url: c.uber_screenshot_url || c.uber_screenshot_file })}
                            className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200"
                            title="View Uber Screenshot"
                          >
                            Proof
                          </button>
                        ) : null}
                        {!c.cng_bill_url && !c.cng_bill_file && !c.uber_screenshot_url && !c.uber_screenshot_file && <span className="text-slate-300">—</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          c.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {c.status === 'PAID' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleMarkStatus(c.id, c.status)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            c.status === 'PAID'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {c.status === 'PAID' ? 'Mark Pending' : 'Mark Paid'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 13 : 11} className="py-8 text-center text-slate-400">
                    No calculations found.
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
