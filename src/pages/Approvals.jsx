import React, { useState, useEffect } from 'react';
import { submissionService } from '../services/api';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Car,
  DollarSign,
  Fuel,
  Paperclip,
  Check,
  History,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

import { useApprovals } from '../hooks/useApprovals';
import { queryClient } from '../queryClient';
import { queryKeys } from '../queryKeys';

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('PENDING_EARNINGS'); // 'PENDING_EARNINGS' or 'PENDING_EXPENSES' or 'ALL_AUDIT'
  const { data: approvalsData, isLoading: loading, error: queryError } = useApprovals();

  const pendingEarnings = approvalsData?.pendingEarnings || [];
  const pendingExpenses = approvalsData?.pendingExpenses || [];
  const allEarnings = approvalsData?.allEarnings || [];

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Action Dialog State
  const [actionItem, setActionItem] = useState(null); // { type: 'EARNINGS'|'EXPENSE', item, action: 'APPROVE'|'REJECT'|'CORRECTION' }
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [viewAttachment, setViewAttachment] = useState(null);

  const handleActionConfirm = async () => {
    if (!actionItem) return;
    setSubmittingAction(true);
    setError('');
    setSuccessMsg('');

    try {
      const { type, item, action } = actionItem;
      if (type === 'EARNINGS') {
        if (action === 'APPROVE') {
          await submissionService.approveEarnings(item.id, actionNotes || 'Approved by fleet manager');
          setSuccessMsg(`Approved earnings for ${item.driver_name} (₹${item.gross_earnings}).`);
        } else if (action === 'REJECT') {
          if (!actionNotes) throw new Error('Rejection reason is required.');
          await submissionService.rejectEarnings(item.id, actionNotes);
          setSuccessMsg(`Rejected earnings submission. Reason recorded.`);
        } else if (action === 'CORRECTION') {
          if (!actionNotes) throw new Error('Correction instructions are required.');
          await submissionService.requestCorrectionEarnings(item.id, actionNotes);
          setSuccessMsg(`Correction requested from ${item.driver_name}.`);
        }
      } else {
        // EXPENSE
        if (action === 'APPROVE') {
          await submissionService.approveExpense(item.id, actionNotes || 'Approved by fleet manager');
          setSuccessMsg(`Approved ${item.category_name} expense for ${item.driver_name} (₹${item.amount}).`);
        } else if (action === 'REJECT') {
          if (!actionNotes) throw new Error('Rejection reason is required.');
          await submissionService.rejectExpense(item.id, actionNotes);
          setSuccessMsg(`Rejected expense submission.`);
        } else if (action === 'CORRECTION') {
          if (!actionNotes) throw new Error('Correction notes are required.');
          await submissionService.requestCorrectionExpense(item.id, actionNotes);
          setSuccessMsg(`Correction requested for expense.`);
        }
      }

      setActionItem(null);
      setActionNotes('');
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals });
    } catch (err) {
      console.error(err);
      setError(err.message || err.response?.data?.error || 'Action failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Verification & Approval Queue
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review driver submissions with receipts. Only approved items enter financial profit-sharing calculations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Queue Total:</span>
          <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-sm">
            {pendingEarnings.length + pendingExpenses.length} Pending
          </span>
        </div>
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

      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('PENDING_EARNINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'PENDING_EARNINGS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Pending Uber Earnings ({pendingEarnings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING_EXPENSES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'PENDING_EXPENSES'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Pending Fuel / Expenses ({pendingExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ALL_AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'ALL_AUDIT'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail Logs</span>
        </button>
      </div>

      {/* Tab 1: Pending Earnings */}
      {activeTab === 'PENDING_EARNINGS' && (
        <div className="space-y-4">
          {pendingEarnings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base">All Caught Up!</h4>
              <p className="text-xs text-slate-500 mt-1">There are no pending earnings submissions awaiting review.</p>
            </div>
          ) : (
            pendingEarnings.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">
                      {new Date(item.date).toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded">
                      {item.driver_name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.vehicle_reg}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Fares</span>
                      <span className="font-extrabold text-slate-900 text-sm">{formatINR(item.gross_earnings)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Uber Commission</span>
                      <span className="font-bold text-slate-700 text-sm">{formatINR(item.uber_commission)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Passenger Cash</span>
                      <span className="font-bold text-amber-700 text-sm">{formatINR(item.cash_collected)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Trips / Shift</span>
                      <span className="font-bold text-slate-700 text-sm">{item.trips_count} rides ({item.online_hours} hrs)</span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl italic">
                      Driver notes: "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {item.attachments?.length > 0 && (
                    <button
                      onClick={() => setViewAttachment(item.attachments[0])}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>View Screenshot</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActionItem({ type: 'EARNINGS', item, action: 'APPROVE' })}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => setActionItem({ type: 'EARNINGS', item, action: 'CORRECTION' })}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center space-x-1"
                  >
                    <span>Request Correction</span>
                  </button>

                  <button
                    onClick={() => setActionItem({ type: 'EARNINGS', item, action: 'REJECT' })}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center space-x-1"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Pending Expenses */}
      {activeTab === 'PENDING_EXPENSES' && (
        <div className="space-y-4">
          {pendingExpenses.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base">All Expenses Verified!</h4>
              <p className="text-xs text-slate-500 mt-1">No pending CNG or operating bills awaiting approval.</p>
            </div>
          ) : (
            pendingExpenses.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">
                      {new Date(item.date).toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="font-bold text-emerald-800 text-xs bg-emerald-50 px-2 py-0.5 rounded">
                      {item.driver_name}
                    </span>
                    <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {item.category_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount</span>
                      <span className="font-extrabold text-slate-900 text-sm">{formatINR(item.amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Fuel Pump / Station</span>
                      <span className="font-bold text-slate-700">{item.vendor_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">CNG Qty / Odometer</span>
                      <span className="font-bold text-slate-700">
                        {item.fuel_quantity_kg_or_l ? `${item.fuel_quantity_kg_or_l} kg` : '-'}
                        {item.odometer_reading ? ` • ${item.odometer_reading} km` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle</span>
                      <span className="font-mono text-slate-700">{item.vehicle_reg}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {item.attachments?.length > 0 && (
                    <button
                      onClick={() => setViewAttachment(item.attachments[0])}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActionItem({ type: 'EXPENSE', item, action: 'APPROVE' })}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => setActionItem({ type: 'EXPENSE', item, action: 'CORRECTION' })}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center space-x-1"
                  >
                    <span>Request Correction</span>
                  </button>

                  <button
                    onClick={() => setActionItem({ type: 'EXPENSE', item, action: 'REJECT' })}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center space-x-1"
                  >
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Complete Audit Trail */}
      {activeTab === 'ALL_AUDIT' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Submission Approval Audit History</h3>
          <div className="space-y-3">
            {allEarnings.slice(0, 15).map((e) => (
              <div key={e.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{e.driver_name} • {new Date(e.date).toLocaleDateString('en-GB')} (₹{e.gross_earnings})</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    e.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    e.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    e.status === 'CORRECTION_REQUESTED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {e.status}
                  </span>
                </div>
                {e.audit_logs?.length > 0 && (
                  <div className="mt-2 space-y-1 pl-3 border-l-2 border-slate-200 text-[11px] text-slate-600">
                    {e.audit_logs.map((log) => (
                      <div key={log.id} className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-700">{log.action}:</span>
                        <span>{log.notes || 'No extra notes'}</span>
                        <span className="text-slate-400">by {log.actor_name} on {log.created_at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Dialog Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {actionItem.action === 'APPROVE' && 'Approve Submission'}
              {actionItem.action === 'REJECT' && 'Reject Submission'}
              {actionItem.action === 'CORRECTION' && 'Request Driver Correction'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Driver: <strong className="text-slate-800">{actionItem.item.driver_name}</strong> •{' '}
              {new Date(actionItem.item.date).toLocaleDateString('en-GB')}
            </p>

            <div className="space-y-3">
              {actionItem.action === 'APPROVE' ? (
                <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  This record will be officially marked <strong>APPROVED</strong> and included in driver profit-sharing calculations and company financial reports.
                </p>
              ) : actionItem.action === 'REJECT' ? (
                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-1">Rejection Reason (Required)</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Enter reason e.g. Illegible bill photo, duplicate shift..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500"
                  ></textarea>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-1">Correction Instructions for Driver (Required)</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="e.g. Please check Uber commission amount on statement page 2 and re-upload."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              )}
            </div>

            <div className="pt-5 flex items-center justify-end space-x-3 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setActionItem(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleActionConfirm}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md disabled:opacity-50 ${
                  actionItem.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : actionItem.action === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {submittingAction ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer */}
      {viewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">{viewAttachment.file_name}</h3>
              <button onClick={() => setViewAttachment(null)} className="text-slate-400 hover:text-slate-900 p-1">
                ✕
              </button>
            </div>
            <div className="bg-slate-100 rounded-2xl p-2 max-h-[70vh] overflow-auto flex items-center justify-center">
              {viewAttachment.file_url ? (
                <img
                  src={viewAttachment.file_url}
                  alt="Receipt Preview"
                  className="max-h-[60vh] object-contain rounded-xl"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <div style={{ display: 'none' }} className="p-8 text-center text-slate-500">
                <Paperclip className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="text-xs">{viewAttachment.file_name}</p>
                <a
                  href={viewAttachment.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-bold text-emerald-700 underline"
                >
                  Download Receipt
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
