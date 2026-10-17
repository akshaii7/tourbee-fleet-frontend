import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { maintenanceService } from '../services/api';
import { useMaintenance } from '../hooks/useMaintenance';
import { useVehicles } from '../hooks/useVehicles';
import { queryClient } from '../queryClient';
import {
  Wrench,
  Plus,
  Car,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Paperclip
} from 'lucide-react';

export default function Maintenance() {
  const { user, isAdmin } = useAuth();
  const { data: maintData, isLoading: maintLoading } = useMaintenance();
  const { data: vehData, isLoading: vehLoading } = useVehicles();

  const records = maintData ? (maintData.results || maintData) : [];
  const vehicles = vehData ? (vehData.results || vehData) : [];
  const loading = maintLoading || (isAdmin && vehLoading);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicle: '',
    date: new Date().toISOString().split('T')[0],
    maintenance_type: 'SCHEDULED_SERVICE',
    cost: '',
    vendor_garage: 'Popular Maruti Service Edappally',
    odometer_reading: '',
    invoice_number: '',
    notes: '',
  });

  const openCreateModal = () => {
    setFormData({
      vehicle: vehicles[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      maintenance_type: 'SCHEDULED_SERVICE',
      cost: '',
      vendor_garage: 'Popular Maruti Service Edappally',
      odometer_reading: '',
      invoice_number: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle) {
      setError('Please select or add a fleet vehicle first.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = { ...formData };
      if (!payload.odometer_reading) payload.odometer_reading = null;
      if (!payload.invoice_number) payload.invoice_number = null;
      if (!payload.notes) payload.notes = null;

      await maintenanceService.create(payload);
      setSuccessMsg('Vehicle maintenance log recorded successfully!');
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error(err);
      const resData = err.response?.data;
      let msg = 'Failed to record maintenance.';
      if (resData) {
        if (typeof resData === 'string') {
          msg = resData;
        } else if (resData.detail) {
          msg = resData.detail;
        } else {
          const firstKey = Object.keys(resData)[0];
          if (firstKey) {
            const val = resData[firstKey];
            msg = `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
          }
        }
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const maintenanceTypes = [
    { code: 'SCHEDULED_SERVICE', label: 'Periodic Scheduled Service' },
    { code: 'OIL_CHANGE', label: 'Engine Oil & Filter Change' },
    { code: 'BRAKE_CLUTCH', label: 'Brake Pads / Clutch Overhaul' },
    { code: 'TYRE_REPLACEMENT', label: 'Tyre Replacement & Alignment' },
    { code: 'CNG_KIT_INSPECTION', label: 'CNG Kit Hydro-Test & Filter' },
    { code: 'AC_SERVICE', label: 'AC Cooling Coil / Gas Refill' },
    { code: 'ACCIDENT_BODYWORK', label: 'Accident Repair & Tinkering' },
    { code: 'OTHER', label: 'General Repairs & Spares' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Vehicle Fleet Maintenance & Repairs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Company-borne vehicle overhead. Excluded from driver profit sharing calculations.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Garage Repair</span>
          </button>
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

      {/* Maintenance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Service Date</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Service Type</th>
                <th className="px-5 py-3.5">Invoice Amount (Company)</th>
                <th className="px-5 py-3.5">Workshop / Garage</th>
                <th className="px-5 py-3.5">Invoice No</th>
                <th className="px-5 py-3.5">Odometer</th>
                <th className="px-5 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    {new Date(r.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 font-mono">{r.vehicle_reg}</div>
                    <div className="text-[11px] text-slate-400">{r.vehicle_name}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {r.maintenance_type.replace('_', ' ')}
                  </td>
                  <td className="px-5 py-4 font-extrabold text-slate-900">
                    {formatINR(r.cost)}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {r.vendor_garage}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-500">
                    {r.invoice_number || '-'}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-600">
                    {r.odometer_reading ? `${r.odometer_reading} km` : '-'}
                  </td>
                  <td className="px-5 py-4 text-slate-500 italic max-w-xs truncate">
                    {r.notes || '-'}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-400">
                    No maintenance records logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Log Vehicle Maintenance</h3>
            <p className="text-xs text-slate-500 mb-4">
              Recorded strictly as company fleet operational overhead.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Vehicle</label>
                  <select
                    required
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} ({v.model})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maintenance Type</label>
                  <select
                    value={formData.maintenance_type}
                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    {maintenanceTypes.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Bill Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 4850.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Workshop / Garage Name</label>
                  <input
                    type="text"
                    required
                    value={formData.vendor_garage}
                    onChange={(e) => setFormData({ ...formData, vendor_garage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PMS-2026-99"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Odometer Reading (km)</label>
                <input
                  type="number"
                  placeholder="e.g. 36500"
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Description & Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  placeholder="e.g. Oil change synthetic, front brake pads, wiper blades replaced"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
