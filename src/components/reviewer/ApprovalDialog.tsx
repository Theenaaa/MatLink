'use client';

import React from 'react';
import { CheckCircle2, X, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Material } from '@/types';

interface ApprovalDialogProps {
  material: Material;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ApprovalDialog({
  material,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: ApprovalDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden font-body animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-emerald-50/60">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black font-heading text-slate-900">Approve AI Recommendation?</h2>
            <p className="text-[11px] text-slate-500 font-body">Authorize single golden master catalog record</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            You are verifying and approving this material as an authoritative master in the National CPSE registry:
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-heading">Master Code</div>
              <div className="font-mono text-sm font-bold text-[#10203a]">
                {material.aiRecommendation.masterCode}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-heading">Standardized Description</div>
              <div className="text-xs font-semibold text-slate-800 leading-snug">{material.aiRecommendation.standardizedDescription}</div>
            </div>
            <div className="flex items-center gap-4 pt-2 border-t border-slate-200/60">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-heading">Source CPSE</div>
                <div className="text-xs font-bold text-slate-800">{material.sourceCPSE}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-heading">Item Code</div>
                <div className="text-xs font-mono text-slate-600">{material.id}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-heading">Confidence</div>
                <div className="text-xs font-bold text-emerald-700">{material.aiRecommendation.confidence}%</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Audit Ledger Notice:</strong> This decision will be logged with your Domain Expert credentials and timestamp into the tamper-proof governance audit trail.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            id="approve-cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold font-heading text-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="approve-confirm-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black font-heading text-white shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Authorizing...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Confirm Approval</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
