import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fleetService } from '../services/api';
import { useDrivers } from '../hooks/useDrivers';
import { useFleetVehicles } from '../hooks/useFleetVehicles';
import { useCalculations, CALCULATIONS_QUERY_KEY } from '../hooks/useCalculations';
import { queryClient } from '../queryClient';
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Car,
  Clock,
  RotateCcw,
  Sparkles,
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';

export default function DailyRent() {
  const { user, isAdmin } = useAuth();
  const { data: vehiclesRaw, isLoading: vehiclesLoading } = useFleetVehicles();
  const { data: driversRaw, isLoading: driversLoading } = useDrivers();
  const { data: rentRaw, isLoading: rentLoading } = useCalculations();

  const vehicles = useMemo(() => {
    const list = vehiclesRaw?.results ?? vehiclesRaw ?? [];
    return Array.isArray(list) ? list : [];
  }, [vehiclesRaw]);

  const drivers = useMemo(() => {
    const list = driversRaw?.results ?? driversRaw ?? [];
    return Array.isArray(list) ? list : [];
  }, [driversRaw]);

  const rentRecords = useMemo(() => {
    const list = rentRaw?.results ?? rentRaw ?? [];
    const arr = Array.isArray(list) ? list : [];
    return arr.filter((c) => c.payment_mode === 'FIXED_RENT');
  }, [rentRaw]);

  const loading = vehiclesLoading || rentLoading || (isAdmin && driversLoading);

  // Mutation feedback state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  // Exactly the 3 required fields for Fixed Daily Rent Mode
  const [formData, setFormData] = useState({
    driver: '',
    vehicle: '',
    date: todayStr,
    working_day_type: 'FULL_DAY', // 'HALF_DAY' (₹650) or 'FULL_DAY' (₹1,200)
  });

  // Pre-fill form defaults when data loads
  useEffect(() => {
    const assignedId = user?.driver_profile?.assigned_vehicle_id;
    if (assignedId) {
      setFormData((prev) => ({ ...prev, vehicle: assignedId }));
    } else if (vehicles.length > 0 && !formData.vehicle) {
      setFormData((prev) => ({ ...prev, vehicle: vehicles[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles.length]);

  useEffect(() => {
    if (isAdmin && drivers.length > 0 && !formData.driver) {
      setFormData((prev) => ({ ...prev, driver: drivers[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers.length]);

  const rentDueAmount = formData.working_day_type === 'HALF_DAY' ? 650 : 1200;

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

    try {
      setSubmitting(true);
      const payload = {
        date: formData.date,
        vehicle: formData.vehicle,
        payment_mode: 'FIXED_RENT',
        working_day_type: formData.working_day_type,
      };

      if (isAdmin && formData.driver) {
        payload.driver = formData.driver;
      }

      await fleetService.createCalculation(payload);
      setSuccessMsg(`Daily Rent record for ${formData.working_day_type === 'HALF_DAY' ? 'Half Day (₹650)' : 'Full Day (₹1,200)'} submitted successfully!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      // Invalidate shared cache so all pages and financial reports see the new entry
      queryClient.invalidateQueries({ queryKey: CALCULATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0];
      setError(detail || 'Failed to submit daily rent record. A submission for this date may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkStatus = async (calcId, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await fleetService.markStatus(calcId, newStatus);
      setSuccessMsg(`Rent record #${calcId} updated to ${newStatus === 'PAID' ? 'Paid' : 'Pending'}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      queryClient.invalidateQueries({ queryKey: CALCULATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mb-2 border border-indigo-200">
          <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
          <span>Fixed Daily Rent Mode</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Fixed Daily Rent Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Simplified fixed-rate daily rent recording (Half Day: ₹650 • Full Day: ₹1,200).
        </p>
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

      {/* Two Column Section: Form (Left) & Rate Summary (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form: Exactly 3 fields */}
        <div className="md:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Submit Daily Rent Record</h2>
          <p className="text-xs text-slate-500 mb-5">
            Select the shift date, vehicle, and rent duration. The rent due is calculated automatically.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isAdmin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Driver <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name || d.username} ({d.driver_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Field 1: Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                1. Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            {/* Field 2: Vehicle Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                2. Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                required
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Rent Type Options */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                3. Rent Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, working_day_type: 'HALF_DAY' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.working_day_type === 'HALF_DAY'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900">Half Day</div>
                  <div className="text-xs text-indigo-700 font-black mt-1">₹650</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Single shift operation</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, working_day_type: 'FULL_DAY' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.working_day_type === 'FULL_DAY'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold text-sm text-slate-900">Full Day</div>
                  <div className="text-xs text-indigo-700 font-black mt-1">₹1,200</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Full 24-hr day operation</div>
                </button>
              </div>
            </div>

            {/* Automatically Calculated Rent Due Display */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Rent Due Automatically Calculated
                </span>
                <p className="text-[11px] text-indigo-700">Initial status: Pending</p>
              </div>
              <div className="text-3xl font-black text-indigo-950">
                {formatINR(rentDueAmount)}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-900/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Daily Rent Record'}
            </button>
          </form>
        </div>

        {/* Program Rules Card (Right 5 Cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col justify-between border border-indigo-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
              <Info className="w-3.5 h-3.5" />
              <span>Fixed-Rent Driver Agreement</span>
            </div>

            <h3 className="text-xl font-black tracking-tight mb-3">
              Fixed Rent Terms & Conditions
            </h3>

            <div className="space-y-3 text-xs text-indigo-100/90 leading-relaxed">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-0.5">• Half Day Rate:</span>
                <span>Fixed at ₹650 per shift.</span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-0.5">• Full Day Rate:</span>
                <span>Fixed at ₹1,200 per 24 hours.</span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-0.5">• Operating Expenses:</span>
                <span>The driver pays all fuel (CNG) and running expenses under this mode. No deductions are made from rent.</span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-0.5">• Maintenance:</span>
                <span>Vehicle routine maintenance remains TourBee fleet owner's responsibility.</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-indigo-800/60 text-[11px] text-indigo-300 font-medium">
            No 50% profit-sharing or Uber screenshots required for fixed-rent drivers.
          </div>
        </div>
      </div>

      {/* Rent Records Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Fixed Daily Rent Records</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review daily rent due, payment statuses, and confirmation history.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3 px-4">Date</th>
                {isAdmin && <th className="py-3 px-4">Driver</th>}
                <th className="py-3 px-4">Vehicle Number</th>
                <th className="py-3 px-4">Selected Rent Type</th>
                <th className="py-3 px-4 text-right">Rent Due</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                {isAdmin && <th className="py-3 px-4 text-center">Admin Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentRecords.length > 0 ? (
                rentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">{r.date}</td>
                    {isAdmin && (
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {r.driver_name || `Driver #${r.driver}`}
                      </td>
                    )}
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {r.vehicle_reg || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-indigo-900">
                        {r.working_day_type === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-slate-900 whitespace-nowrap">
                      {formatINR(r.final_gpay_amount || r.J)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          r.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {r.status === 'PAID' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleMarkStatus(r.id, r.status)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            r.status === 'PAID'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {r.status === 'PAID' ? 'Mark Pending' : 'Mark Paid'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="py-8 text-center text-slate-400 font-medium">
                    No fixed rent records found.
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
