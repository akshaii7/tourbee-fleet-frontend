import React, { useState } from 'react';
import { driverService, vehicleService, fleetService } from '../services/api';
import { useDrivers } from '../hooks/useDrivers';
import { useVehicles } from '../hooks/useVehicles';
import { queryClient } from '../queryClient';
import {
  Users,
  Search,
  Plus,
  Car,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit2,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  History,
  Eye,
  FileText,
  Clock,
  Power,
  X,
  ExternalLink
} from 'lucide-react';

export default function Drivers() {
  const { data: driversData, isLoading: driversLoading } = useDrivers();
  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles();

  const driversList = driversData ? (driversData.results || driversData) : [];
  const vehicles = vehiclesData ? (vehiclesData.results || vehiclesData) : [];
  const loading = driversLoading || vehiclesLoading;

  const [drivers, setDrivers] = useState([]);
  
  // Keep local drivers state in sync with query cache when not overridden by optimistic updates
  React.useEffect(() => {
    if (driversList) {
      setDrivers(driversList);
    }
  }, [driversList]);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Driver History Modal state
  const [historyDriver, setHistoryDriver] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    driver_type: 'PROFIT_SHARING', // 'PROFIT_SHARING' (50% PROFIT-SHARING MODE) or 'DAILY_RENT' (FIXED DAILY RENT MODE)
    license_number: '',
    license_expiry: '',
    daily_rent_amount: '1200.00',
    assigned_vehicle: '',
    upi_id: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    is_active: true,
  });

  const openCreateModal = () => {
    setEditDriver(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: 'Driver@2026',
      phone_number: '',
      driver_type: 'PROFIT_SHARING',
      license_number: '',
      license_expiry: '',
      daily_rent_amount: '1200.00',
      assigned_vehicle: '',
      upi_id: '',
      bank_account_number: '',
      bank_ifsc_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      is_active: true,
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (d) => {
    setEditDriver(d);
    // Ensure license_expiry is always in YYYY-MM-DD format for the date input
    let licenseExpiry = d.license_expiry || '';
    if (licenseExpiry && licenseExpiry.includes('/')) {
      // Convert DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD
      const parts = licenseExpiry.split('/');
      if (parts.length === 3) {
        licenseExpiry = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    setFormData({
      username: d.username || '',
      first_name: d.first_name || d.full_name?.split(' ')[0] || '',
      last_name: d.last_name || d.full_name?.split(' ').slice(1).join(' ') || '',
      email: d.email || '',
      phone_number: d.phone_number || '',
      driver_type: d.driver_type,
      license_number: d.license_number || '',
      license_expiry: licenseExpiry,
      daily_rent_amount: d.daily_rent_amount || '1200.00',
      assigned_vehicle: d.assigned_vehicle || '',
      upi_id: d.upi_id || '',
      bank_account_number: d.bank_account_number || '',
      bank_ifsc_code: d.bank_ifsc_code || '',
      emergency_contact_name: d.emergency_contact_name || '',
      emergency_contact_phone: d.emergency_contact_phone || '',
      is_active: d.is_active,
    });
    setError('');
    setShowModal(true);
  };

  const handleToggleActive = async (d) => {
    try {
      const nextStatus = !d.is_active;
      await driverService.update(d.id, { is_active: nextStatus });
      setDrivers((prev) =>
        prev.map((item) => (item.id === d.id ? { ...item, is_active: nextStatus } : item))
      );
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salaryOverview'] });
    } catch (err) {
      console.error(err);
      alert('Failed to update driver status.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = { ...formData };
      if (!payload.email || payload.email.trim() === '') {
        const cleanUser = (payload.username || 'driver').replace(/[^a-zA-Z0-9]/g, '');
        payload.email = `${cleanUser || 'driver'}_${Date.now()}@tourbee.in`;
      }
      if (!payload.assigned_vehicle) payload.assigned_vehicle = null;
      if (!payload.license_expiry) payload.license_expiry = null;
      if (!payload.emergency_contact_phone) payload.emergency_contact_phone = null;
      if (!payload.emergency_contact_name) payload.emergency_contact_name = null;
      if (!payload.bank_account_number) payload.bank_account_number = null;
      if (!payload.bank_ifsc_code) payload.bank_ifsc_code = null;
      if (!payload.upi_id) payload.upi_id = null;

      if (editDriver) {
        await driverService.update(editDriver.id, payload);
      } else {
        await driverService.create(payload);
      }
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salaryOverview'] });
    } catch (err) {
      console.error(err);
      const resData = err.response?.data;
      let msg = 'Failed to save driver.';
      if (resData) {
        if (typeof resData === 'string') {
          msg = resData;
        } else if (resData.error) {
          msg = resData.error;
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

  // View Driver History & Submissions
  const openHistoryModal = async (driver) => {
    setHistoryDriver(driver);
    setHistoryLoading(true);
    setHistoryRecords([]);
    try {
      const res = await fleetService.getCalculations({
        driver: driver.user_id,
      });
      const data = res.data?.results || res.data || [];
      setHistoryRecords(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load driver submissions history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleMarkPaymentStatus = async (recordId, newStatus) => {
    try {
      setUpdatingStatusId(recordId);
      await fleetService.markStatus(recordId, newStatus);
      setHistoryRecords((prev) =>
        prev.map((rec) => (rec.id === recordId ? { ...rec, status: newStatus } : rec))
      );
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['salaryOverview'] });
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filtered = drivers.filter((d) => {
    const term = search.toLowerCase();
    const matchesSearch =
      d.full_name?.toLowerCase().includes(term) ||
      d.license_number?.toLowerCase().includes(term) ||
      d.assigned_vehicle_reg?.toLowerCase().includes(term) ||
      d.phone_number?.includes(term);
    const matchesFilter = filterType === 'ALL' || d.driver_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Driver Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage drivers, payment modes (50% Profit-Sharing Mode & Fixed Daily Rent Mode), vehicle assignments, and payment histories.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Driver</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, license, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All Drivers ({drivers.length})
          </button>
          <button
            onClick={() => setFilterType('PROFIT_SHARING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filterType === 'PROFIT_SHARING' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            50% Profit-Sharing Mode
          </button>
          <button
            onClick={() => setFilterType('DAILY_RENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filterType === 'DAILY_RENT' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Fixed Daily Rent Mode
          </button>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Driver Name</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5">Assigned Vehicle</th>
                <th className="px-5 py-3.5">Payment Mode</th>
                <th className="px-5 py-3.5">Driving License</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {d.full_name?.[0] || 'D'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{d.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{d.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.phone_number || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {d.assigned_vehicle_reg ? (
                      <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                        <Car className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{d.assigned_vehicle_reg}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {d.driver_type === 'PROFIT_SHARING' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>50% Profit-Sharing</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 shadow-sm whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span>Fixed Daily Rent</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-700">
                    {d.license_number}
                  </td>
                  <td className="px-5 py-4">
                    {d.is_active ? (
                      <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span>Deactivated</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* View Submissions & Payment History */}
                      <button
                        onClick={() => openHistoryModal(d)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="View Submissions & Payment History"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Edit Driver */}
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit Driver Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Deactivate / Activate Button */}
                      <button
                        onClick={() => handleToggleActive(d)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          d.is_active
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={d.is_active ? 'Deactivate Driver' : 'Activate Driver'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-400">
                    No drivers match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editDriver ? `Edit Driver: ${editDriver.full_name}` : 'Register New Fleet Driver'}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign payment mode, contact information, and fleet vehicle.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number (Kerala) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driving License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="KL-07-20220001234"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono uppercase text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {!editDriver && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Login Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* PAYMENT MODE - EXACT TWO CHOICES */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, driver_type: 'PROFIT_SHARING' })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formData.driver_type === 'PROFIT_SHARING'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-emerald-950">
                      A. 50% PROFIT-SHARING MODE
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-1">
                      Daily Uber earnings, CNG, expenses, refund & 50/50 profit split.
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, driver_type: 'DAILY_RENT' })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      formData.driver_type === 'DAILY_RENT'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-amber-950">
                      B. FIXED DAILY RENT MODE
                    </div>
                    <div className="text-[10px] text-amber-700 mt-1">
                      Fixed daily rent (Half Day ₹650 / Full Day ₹1,200). No 50% split.
                    </div>
                  </div>
                </div>
              </div>

              {/* License Expiry & Daily Rent Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    value={formData.license_expiry || ''}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {formData.driver_type === 'DAILY_RENT' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Daily Rent Amount (₹)</label>
                    <input
                      type="number"
                      step="50"
                      placeholder="1200"
                      value={formData.daily_rent_amount}
                      onChange={(e) => setFormData({ ...formData, daily_rent_amount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Assigned Vehicle */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Vehicle</label>
                <select
                  value={formData.assigned_vehicle || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_vehicle: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="">-- No Vehicle Assigned --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} ({v.make} {v.model}) - {v.fuel_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* UPI ID & Bank Details */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">UPI ID for Payouts</label>
                <input
                  type="text"
                  placeholder="e.g. driver@oksbi"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Account No.</label>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={formData.bank_ifsc_code}
                    onChange={(e) => setFormData({ ...formData, bank_ifsc_code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono uppercase"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Driver Active & Eligible */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Driver Active (Deactivate to suspend driver access & dispatch)
                </label>
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
                  {submitting ? 'Saving...' : (editDriver ? 'Save Changes' : 'Create Driver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Submissions & Payment History Modal */}
      {historyDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center">
                  {historyDriver.full_name?.[0] || 'D'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{historyDriver.full_name}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span>Phone: {historyDriver.phone_number || 'N/A'}</span>
                    <span>•</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      historyDriver.driver_type === 'PROFIT_SHARING'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        historyDriver.driver_type === 'PROFIT_SHARING' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></span>
                      {historyDriver.driver_type === 'PROFIT_SHARING' ? '50% Profit-Sharing' : 'Fixed Daily Rent'}
                    </span>
                    <span>•</span>
                    <span>Vehicle: {historyDriver.assigned_vehicle_reg || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setHistoryDriver(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submissions & Payment History */}
            {historyLoading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs font-semibold">Loading daily submissions and payment history...</p>
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No daily submissions recorded yet for this driver.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Vehicle</th>
                      {historyDriver.driver_type === 'PROFIT_SHARING' ? (
                        <>
                          <th className="px-4 py-3">Total Uber</th>
                          <th className="px-4 py-3">CNG / Exp</th>
                          <th className="px-4 py-3">Driver Salary (50%)</th>
                          <th className="px-4 py-3">Final GPay</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3">Rent Type</th>
                          <th className="px-4 py-3">Rent Due</th>
                        </>
                      )}
                      <th className="px-4 py-3">Documents</th>
                      <th className="px-4 py-3">Payment Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {historyRecords.map((rec) => {
                      const is50 = rec.payment_mode === 'REVENUE_SHARING';
                      const isPaid = rec.status === 'PAID';
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3.5 font-bold text-slate-900">{rec.date}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-700">{rec.vehicle_reg || 'N/A'}</td>

                          {is50 ? (
                            <>
                              <td className="px-4 py-3.5 font-semibold text-slate-900">
                                ₹{Number(rec.total_uber_earnings || rec.A || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500">
                                ₹{Number(rec.cng_expense || rec.E || 0).toLocaleString('en-IN')} / ₹{Number(rec.expenses || rec.D || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3.5 font-extrabold text-emerald-700">
                                ₹{Number(rec.driver_salary || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3.5 font-black text-emerald-900 text-sm">
                                ₹{Number(rec.final_gpay_amount || 0).toLocaleString('en-IN')}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3.5 font-semibold text-amber-900">
                                {rec.working_day === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
                              </td>
                              <td className="px-4 py-3.5 font-black text-amber-800 text-sm">
                                ₹{Number(rec.rent_due || 0).toLocaleString('en-IN')}
                              </td>
                            </>
                          )}

                          {/* Documents */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-1.5">
                              {rec.cng_bill_file && (
                                <a
                                  href={rec.cng_bill_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] hover:bg-blue-100 flex items-center space-x-1"
                                >
                                  <span>CNG</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              {rec.uber_screenshot_file && (
                                <a
                                  href={rec.uber_screenshot_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] hover:bg-purple-100 flex items-center space-x-1"
                                >
                                  <span>Proof</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              {!rec.cng_bill_file && !rec.uber_screenshot_file && (
                                <span className="text-slate-400 italic text-[11px]">None</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {isPaid ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>PAID</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>PENDING</span>
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3.5 text-right">
                            <button
                              disabled={updatingStatusId === rec.id}
                              onClick={() => handleMarkPaymentStatus(rec.id, isPaid ? 'PENDING' : 'PAID')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                isPaid
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                              }`}
                            >
                              {updatingStatusId === rec.id
                                ? 'Updating...'
                                : isPaid
                                ? 'Mark Pending'
                                : 'Mark Paid'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
