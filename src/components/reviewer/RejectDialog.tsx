'use client';

import React, { useState } from 'react';
import { XCircle, X, Loader2, AlertTriangle } from 'lucide-react';

const REJECT_REASONS = [
  'Incorrect Material',
  'Technical Specification Conflict',
  'Wrong Category',
  'Wrong Standard',
  'Wrong Grade',
  'Duplicate Recommendation',
  'Insufficient Technical Information',
  'Other',
];

interface RejectDialogProps {
  materialId: string;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (reason: string, comment?: string) => void;
  onCancel: () => void;
}

export function RejectDialog({
  materialId,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);

  const handleConfirm = () => {
    setTouched(true);
    if (!reason) return;
    onConfirm(reason, comment || undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-[#0a1628] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-red-950/20">
          <XCircle className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-bold text-slate-100">Reject AI Recommendation</h2>
          <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-400">
            <span className="font-mono text-slate-500 text-xs">{materialId}</span>
          </p>

          {/* Reason — required */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <div className="space-y-1.5">
              {REJECT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                    reason === r
                      ? 'border-red-600/60 bg-red-950/30 text-red-300'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reject-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-red-500"
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
            {touched && !reason && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-2">
                <AlertTriangle className="w-3 h-3" />
                Please select a rejection reason
              </p>
            )}
          </div>

          {/* Optional comment */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Additional Comments <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="reject-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Provide technical details to support your rejection..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/30">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="reject-confirm-btn"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><XCircle className="w-4 h-4" /> Confirm Rejection</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
