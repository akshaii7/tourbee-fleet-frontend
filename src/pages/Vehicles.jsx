import React, { useState } from 'react';
import { vehicleService } from '../services/api';
import { useVehicles } from '../hooks/useVehicles';
import { queryClient } from '../queryClient';
import {
  Car,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wrench,
  Fuel,
  Calendar,
  Edit2,
  AlertCircle
} from 'lucide-react';

export default function Vehicles() {
  const { data: vehiclesData, isLoading: loading, error: queryError } = useVehicles();
  const vehicles = vehiclesData ? (vehiclesData.results || vehiclesData) : [];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    registration_number: '',
    make: 'Maruti Suzuki',
    model: 'WagonR CNG',
    year: 2023,
    fuel_type: 'CNG',
    status: 'ACTIVE',
    rc_number: '',
    insurance_policy_no: '',
    insurance_expiry: '',
    fitness_expiry: '',
    current_odometer: 0,
    daily_rent_rate: '850.00',
    notes: '',
  });

  const openCreateModal = () => {
    setEditVehicle(null);
    setFormData({
      registration_number: '',
      make: 'Maruti Suzuki',
      model: 'WagonR CNG',
      year: 2023,
      fuel_type: 'CNG',
      status: 'ACTIVE',
      rc_number: '',
      insurance_policy_no: '',
      insurance_expiry: '',
      fitness_expiry: '',
      current_odometer: 0,
      daily_rent_rate: '850.00',
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (v) => {
    setEditVehicle(v);
    setFormData({
      registration_number: v.registration_number,
      make: v.make,
      model: v.model,
      year: v.year,
      fuel_type: v.fuel_type,
      status: v.status,
      rc_number: v.rc_number || '',
      insurance_policy_no: v.insurance_policy_no || '',
      insurance_expiry: v.insurance_expiry || '',
      fitness_expiry: v.fitness_expiry || '',
      current_odometer: v.current_odometer,
      daily_rent_rate: v.daily_rent_rate,
      notes: v.notes || '',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = { ...formData };
      if (!payload.insurance_expiry) payload.insurance_expiry = null;
      if (!payload.fitness_expiry) payload.fitness_expiry = null;
      if (!payload.pollution_expiry) payload.pollution_expiry = null;
      if (!payload.rc_number) payload.rc_number = null;
      if (!payload.insurance_policy_no) payload.insurance_policy_no = null;

      if (editVehicle) {
        await vehicleService.update(editVehicle.id, payload);
      } else {
        await vehicleService.create(payload);
      }
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error(err);
      const resData = err.response?.data;
      let msg = 'Failed to save vehicle details.';
      if (resData) {
        if (typeof resData === 'string') {
          msg = resData;
        } else if (resData.registration_number) {
          msg = Array.isArray(resData.registration_number) ? resData.registration_number[0] : resData.registration_number;
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

  const filtered = vehicles.filter((v) => {
    const term = search.toLowerCase();
    const matchesSearch =
      v.registration_number?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.make?.toLowerCase().includes(term);
    const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Fleet Vehicle Directory</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Monitor registration, fuel types, compliance, and maintenance readiness across Ernakulam fleet.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search registration e.g. KL-07..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All ({vehicles.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            On Road (Active)
          </button>
          <button
            onClick={() => setFilterStatus('MAINTENANCE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filterStatus === 'MAINTENANCE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            In Garage
          </button>
        </div>
      </div>

      {/* Vehicle Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((v) => {
          const isInsAlert = v.insurance_status !== 'VALID';
          const isFitAlert = v.fitness_status !== 'VALID';

          return (
            <div
              key={v.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Registration & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-900 font-mono tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Car className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{v.registration_number}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2">
                      {v.make} {v.model}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{v.year} Model • {v.fuel_type}</p>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      v.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'MAINTENANCE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {v.status === 'ACTIVE' ? 'On Road' : v.status === 'MAINTENANCE' ? 'In Garage' : 'Grounded'}
                  </span>
                </div>

                {/* Assigned Driver Pill */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Assigned Driver:</span>
                  <span className="font-bold text-slate-800">
                    {v.assigned_driver_name || <span className="text-slate-400 italic">Unassigned</span>}
                  </span>
                </div>

                {/* Expiry Status Badges */}
                <div className="mt-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Insurance:</span>
                    <span className={`font-bold ${isInsAlert ? (v.insurance_status === 'EXPIRED' ? 'text-rose-600' : 'text-amber-600') : 'text-slate-700'}`}>
                      {v.insurance_expiry ? `${v.insurance_expiry} (${v.insurance_status})` : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kerala Fitness:</span>
                    <span className={`font-bold ${isFitAlert ? (v.fitness_status === 'EXPIRED' ? 'text-rose-600' : 'text-amber-600') : 'text-slate-700'}`}>
                      {v.fitness_expiry ? `${v.fitness_expiry} (${v.fitness_status})` : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Odometer:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {Number(v.current_odometer).toLocaleString('en-IN')} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  Daily Rent: ₹{v.daily_rent_rate}/day
                </span>
                <button
                  onClick={() => openEditModal(v)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Vehicle</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editVehicle ? `Edit ${editVehicle.registration_number}` : 'Register New Fleet Vehicle'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Enter vehicle registration details, fuel specifications and compliance dates.
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
                  <label className="font-bold text-slate-700 block mb-1">Registration (Kerala)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KL-07-CJ-4521"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="ACTIVE">Active (On Road)</option>
                    <option value="MAINTENANCE">Maintenance (In Garage)</option>
                    <option value="INACTIVE">Inactive (Grounded)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Make</label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fuel Type</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="CNG">CNG</option>
                    <option value="PETROL">Petrol</option>
                    <option value="EV">Electric (EV)</option>
                    <option value="DIESEL">Diesel</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Rent Rate (₹)</label>
                  <input
                    type="number"
                    step="50"
                    value={formData.daily_rent_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rent_rate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={formData.insurance_expiry || ''}
                    onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fitness Certificate Expiry</label>
                  <input
                    type="date"
                    value={formData.fitness_expiry || ''}
                    onChange={(e) => setFormData({ ...formData, fitness_expiry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Odometer (km)</label>
                  <input
                    type="number"
                    value={formData.current_odometer}
                    onChange={(e) => setFormData({ ...formData, current_odometer: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">RC / Registration Number</label>
                  <input
                    type="text"
                    value={formData.rc_number || ''}
                    onChange={(e) => setFormData({ ...formData, rc_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editVehicle ? 'Update Vehicle' : 'Register Vehicle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
