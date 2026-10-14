import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fleetService, driverService } from '../services/api';
import {
  Calculator,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Save,
  Check,
  Calendar,
  DollarSign,
  Clock,
  Car,
  User,
  ExternalLink
} from 'lucide-react';

export default function DailyCalculation() {
  const { user, isAdmin } = useAuth();

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mode Selection: 'REVENUE_SHARING' (50% PROFIT-SHARING MODE) or 'FIXED_RENT' (FIXED DAILY RENT MODE)
  const [paymentMode, setPaymentMode] = useState('REVENUE_SHARING');
  // Fixed Rent Working Day: 'HALF_DAY' (₹650) or 'FULL_DAY' (₹1,200)
  const [workingDayType, setWorkingDayType] = useState('FULL_DAY');

  // Input fields
  const [formData, setFormData] = useState({
    driver: '',
    vehicle: '',
    date: new Date().toISOString().split('T')[0],
    total_uber_earnings: '',
    passenger_cash_collected: '',
    cng_expense: '',
    expenses: '',
    refund: '',
  });

  // Calculated breakdown
  const [breakdown, setBreakdown] = useState({
    payment_mode: 'REVENUE_SHARING',
    working_day_type: 'FULL_DAY',
    total_uber_earnings: '0.00',
    passenger_cash_collected: '0.00',
    wallet_difference: '0.00',
    cng_expense: '0.00',
    expenses: '0.00',
    refund: '0.00',
    profit_amount: '0.00',
    driver_salary: '0.00',
    tourbee_share: '0.00',
    amount_after_wallet_adjustment: '0.00',
    amount_after_refund: '0.00',
    final_gpay_amount: '0.00',
    rent_due: '0.00',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [drvRes, vehRes, calcRes] = await Promise.all([
        driverService.getAll(),
        fleetService.getFleetVehicles(),   // Use fleet.Vehicle IDs (correct for submissions)
        fleetService.getCalculations(),
      ]);
      const drvList = drvRes.data.results || drvRes.data;
      const vehList = vehRes.data.results || vehRes.data;
      setDrivers(drvList);
      setVehicles(vehList);
      setCalculations(calcRes.data.results || calcRes.data);

      if (drvList.length > 0 && !formData.driver) {
        setFormData((prev) => ({
          ...prev,
          driver: drvList[0].id,
          vehicle: drvList[0].assigned_vehicle || (vehList[0]?.id || ''),
        }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate immediately whenever inputs, mode, or working day changes
  useEffect(() => {
    runLiveCalculation();
  }, [
    formData.total_uber_earnings,
    formData.passenger_cash_collected,
    formData.cng_expense,
    formData.expenses,
    formData.refund,
    paymentMode,
    workingDayType,
  ]);

  const runLiveCalculation = async () => {
    try {
      const res = await fleetService.liveCalculate({
        payment_mode: paymentMode,
        working_day_type: workingDayType,
        total_uber_earnings: formData.total_uber_earnings || 0,
        passenger_cash_collected: formData.passenger_cash_collected || 0,
        cng_expense: formData.cng_expense || 0,
        expenses: formData.expenses || 0,
        refund: formData.refund || 0,
      });
      setBreakdown(res.data);
    } catch (err) {
      // Local fallback calculation matching exact formula
      if (paymentMode === 'FIXED_RENT') {
        const rent = workingDayType === 'HALF_DAY' ? '650.00' : '1200.00';
        setBreakdown({
          payment_mode: 'FIXED_RENT',
          working_day_type: workingDayType,
          rent_due: rent,
          driver_salary: '0.00',
          tourbee_share: '0.00',
          final_gpay_amount: '0.00',
        });
      } else {
        const uber = Number(formData.total_uber_earnings || 0);
        const cash = Number(formData.passenger_cash_collected || 0);
        const cng = Number(formData.cng_expense || 0);
        const exp = Number(formData.expenses || 0);
        const ref = Number(formData.refund || 0);

        const walletDiff = uber - cash;
        const profit = uber - cng - exp;
        const dSal = profit / 2;
        const tShare = profit / 2;
        const afterWallet = profit - walletDiff;
        const afterRef = afterWallet - ref;
        const finalGpay = afterRef + exp;

        setBreakdown({
          payment_mode: 'REVENUE_SHARING',
          total_uber_earnings: uber.toFixed(2),
          passenger_cash_collected: cash.toFixed(2),
          wallet_difference: walletDiff.toFixed(2),
          cng_expense: cng.toFixed(2),
          expenses: exp.toFixed(2),
          refund: ref.toFixed(2),
          profit_amount: profit.toFixed(2),
          driver_salary: dSal.toFixed(2),
          tourbee_share: tShare.toFixed(2),
          amount_after_wallet_adjustment: afterWallet.toFixed(2),
          amount_after_refund: afterRef.toFixed(2),
          final_gpay_amount: finalGpay.toFixed(2),
          rent_due: '0.00',
        });
      }
    }
  };

  const handleDriverChange = (driverId) => {
    const drv = drivers.find((d) => d.id === Number(driverId));
    setFormData((prev) => ({
      ...prev,
      driver: Number(driverId),
      vehicle: drv?.assigned_vehicle || prev.vehicle,
    }));
    if (drv) {
      if (drv.driver_type === 'DAILY_RENT') {
        setPaymentMode('FIXED_RENT');
      } else {
        setPaymentMode('REVENUE_SHARING');
      }
    }
  };

  const handleSaveCalculation = async (e) => {
    e.preventDefault();
    if (!formData.driver) {
      setError('Please select a driver.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await fleetService.createCalculation({
        driver: formData.driver,
        vehicle: formData.vehicle,
        date: formData.date,
        payment_mode: paymentMode,
        working_day: workingDayType,
        total_uber_earnings: formData.total_uber_earnings || 0,
        passenger_cash_collected: formData.passenger_cash_collected || 0,
        cng_expense: formData.cng_expense || 0,
        expenses: formData.expenses || 0,
        refund: formData.refund || 0,
      });
      setSuccess('Daily calculation saved successfully!');
      const res = await fleetService.getCalculations();
      setCalculations(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      const resData = err.response?.data;
      let msg = 'Failed to save daily calculation.';
      if (resData) {
        if (typeof resData === 'string') msg = resData;
        else if (resData.error) msg = resData.error;
        else if (resData.detail) msg = resData.detail;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (calcId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
      await fleetService.markStatus(calcId, nextStatus);
      setCalculations((prev) =>
        prev.map((c) => (c.id === calcId ? { ...c, status: nextStatus } : c))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  const formatINR = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Daily Fleet Calculation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Calculate driver earnings, TourBee share, and Google Pay settlements using the confirmed formulas.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Driver Payment Mode Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
          Driver Payment Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMode('REVENUE_SHARING')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              paymentMode === 'REVENUE_SHARING'
                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900">A. 50% PROFIT-SHARING MODE</span>
              {paymentMode === 'REVENUE_SHARING' && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Uber earnings, CNG, and expenses split 50/50. Wallet adjustments applied to final GPay amount.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('FIXED_RENT')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              paymentMode === 'FIXED_RENT'
                ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900">B. FIXED DAILY RENT MODE</span>
              {paymentMode === 'FIXED_RENT' && <Check className="w-4 h-4 text-amber-600 font-bold" />}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Driver pays fixed daily rent (Half Day ₹650 / Full Day ₹1,200). No 50% salary calculation.
            </p>
          </button>
        </div>

        {/* If Fixed Rent Mode: Choose Half Day or Full Day */}
        {paymentMode === 'FIXED_RENT' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Rent Type
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setWorkingDayType('HALF_DAY')}
                className={`py-3 px-4 rounded-xl border text-center transition-all ${
                  workingDayType === 'HALF_DAY'
                    ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="text-xs uppercase font-extrabold">Half Day</div>
                <div className="text-base font-black mt-0.5">₹650</div>
              </button>

              <button
                type="button"
                onClick={() => setWorkingDayType('FULL_DAY')}
                className={`py-3 px-4 rounded-xl border text-center transition-all ${
                  workingDayType === 'FULL_DAY'
                    ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="text-xs uppercase font-extrabold">Full Day</div>
                <div className="text-base font-black mt-0.5">₹1,200</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Daily Details</span>
            <span className="text-[11px] font-normal text-slate-400">Live Auto-Calculation</span>
          </h2>

          <form onSubmit={handleSaveCalculation} className="space-y-4 text-xs">
            {/* Driver & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver</label>
                <select
                  required
                  value={formData.driver}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name || d.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>

            {/* Vehicle */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Vehicle</label>
              <select
                required
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>

            {paymentMode === 'REVENUE_SHARING' ? (
              <>
                {/* Total Uber Earnings */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Total Uber Earnings (₹) (Before commission)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.total_uber_earnings}
                    onChange={(e) => setFormData({ ...formData, total_uber_earnings: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                    placeholder="e.g. 13667"
                  />
                </div>

                {/* Passenger Cash Collected */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Passenger Cash Collected (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.passenger_cash_collected}
                    onChange={(e) => setFormData({ ...formData, passenger_cash_collected: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                    placeholder="e.g. 13210"
                  />
                </div>

                {/* CNG Expense */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    CNG Expense (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cng_expense}
                    onChange={(e) => setFormData({ ...formData, cng_expense: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                    placeholder="e.g. 4825"
                  />
                </div>

                {/* Expenses */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Expenses (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.expenses}
                    onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                    placeholder="e.g. 826"
                  />
                </div>

                {/* Refund */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Refund (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.refund}
                    onChange={(e) => setFormData({ ...formData, refund: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                    placeholder="e.g. 415"
                  />
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <p className="font-bold">Fixed Rent Mode Active:</p>
                <p className="mt-0.5 text-slate-600">
                  Driver pays fixed rent directly ({workingDayType === 'HALF_DAY' ? '₹650' : '₹1,200'}). Driver pays all fuel and other expenses. No 50% salary calculation.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Calculation'}</span>
            </button>
          </form>
        </div>

        {/* Right: Exact Breakdown */}
        <div className="lg:col-span-7 bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white tracking-tight">
                Confirmed Calculation Breakdown
              </h2>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                {paymentMode === 'FIXED_RENT' ? 'Fixed Daily Rent Mode' : '50% Profit-Sharing Mode'}
              </span>
            </div>

            {paymentMode === 'FIXED_RENT' ? (
              /* Fixed Rent Breakdown Display */
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Rent Type</span>
                  <span className="font-bold text-slate-200">
                    {workingDayType === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Rent Due Automatically</span>
                  <span className="font-mono font-bold text-amber-300 text-base">
                    {workingDayType === 'HALF_DAY' ? '₹650.00' : '₹1,200.00'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-xs">
                  Under Fixed Daily Rent Mode, the driver pays fixed rent. No 50% salary, no TourBee share, and no expense deductions.
                </div>
              </div>
            ) : (
              /* 50% Profit Sharing Breakdown Display */
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Total Uber Earnings</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.total_uber_earnings)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Passenger Cash Collected</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.passenger_cash_collected)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80 bg-slate-800/40 px-3 rounded-lg">
                  <span className="text-slate-300 font-semibold">Wallet Difference</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.wallet_difference)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">CNG Expense</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.cng_expense)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Expenses</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.expenses)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Refund</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.refund)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80 bg-slate-800/40 px-3 rounded-lg">
                  <span className="text-emerald-400 font-bold">Profit Amount</span>
                  <span className="font-mono font-bold text-emerald-300">{formatINR(breakdown.profit_amount)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 uppercase block">Driver Salary (50%)</span>
                    <span className="text-base font-mono font-extrabold text-amber-400">{formatINR(breakdown.driver_salary)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-teal-300 uppercase block">TourBee Share (50%)</span>
                    <span className="text-base font-mono font-extrabold text-teal-400">{formatINR(breakdown.tourbee_share)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Amount After Wallet Adjustment</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.amount_after_wallet_adjustment)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Amount After Refund</span>
                  <span className="font-mono font-bold text-slate-200">{formatINR(breakdown.amount_after_refund)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Prominent Summary Box */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-600/40 space-y-3">
            {paymentMode === 'FIXED_RENT' ? (
              <div>
                <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                  RENT DUE
                </p>
                <p className="text-2xl font-mono font-black text-amber-300">
                  {workingDayType === 'HALF_DAY' ? '₹650.00' : '₹1,200.00'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Fixed rent mode (No 50% salary)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                    DRIVER SALARY (50%)
                  </p>
                  <p className="text-xl sm:text-2xl font-mono font-black text-amber-300">
                    {formatINR(breakdown.driver_salary)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
                    FINAL GPAY AMOUNT
                  </p>
                  <p className="text-xl sm:text-2xl font-mono font-black text-white">
                    {formatINR(breakdown.final_gpay_amount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Calculations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Daily Calculations History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Payment Mode</th>
                <th className="px-4 py-3">Uber Earnings</th>
                <th className="px-4 py-3">Driver Salary</th>
                <th className="px-4 py-3">Final GPay / Rent</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {calculations.map((c) => {
                const isPaid = c.status === 'PAID';
                const isFixed = c.payment_mode === 'FIXED_RENT';
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{c.date}</td>
                    <td className="px-4 py-3.5 text-slate-800">{c.driver_name || 'Driver'}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">{c.vehicle_reg || 'N/A'}</td>
                    <td className="px-4 py-3.5">
                      {isFixed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Fixed Rent ({c.working_day === 'HALF_DAY' ? 'Half Day' : 'Full Day'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          50% Profit Share
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {isFixed ? '—' : formatINR(c.total_uber_earnings || c.A)}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-amber-600">
                      {isFixed ? '—' : formatINR(c.driver_salary)}
                    </td>
                    <td className="px-4 py-3.5 font-black text-slate-900">
                      {isFixed ? formatINR(c.rent_due) : formatINR(c.final_gpay_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      {isPaid ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAID</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isAdmin && (
                        <button
                          onClick={() => handleStatusToggle(c.id, c.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            isPaid
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          }`}
                        >
                          {isPaid ? 'Mark Pending' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {calculations.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                    No calculations recorded yet.
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
