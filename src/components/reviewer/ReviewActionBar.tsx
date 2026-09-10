'use client';

import React from 'react';
import { CheckCircle2, XCircle, Edit3, PlusCircle, GitCompare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReviewStatus } from '@/types';

interface ReviewActionBarProps {
  materialId: string;
  reviewStatus: ReviewStatus;
  onApprove: () => void;
  onReject: () => void;
  onModify: () => void;
  onCreateNew: () => void;
}

export function ReviewActionBar({
  materialId,
  reviewStatus,
  onApprove,
  onReject,
  onModify,
  onCreateNew,
}: ReviewActionBarProps) {
  const isDecided =
    reviewStatus === 'APPROVED' ||
    reviewStatus === 'REJECTED' ||
    reviewStatus === 'MODIFIED' ||
    reviewStatus === 'NEW_MASTER_REQUIRED';

  return (
    <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-xl font-body">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {isDecided ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {reviewStatus === 'APPROVED' && (
                <>
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black font-heading text-emerald-800">Approved — Decision Recorded</span>
                    <p className="text-[11px] text-slate-500 font-body">Material master record finalized and entered in central registry.</p>
                  </div>
                </>
              )}
              {reviewStatus === 'REJECTED' && (
                <>
                  <div className="p-1 rounded-full bg-rose-100 text-rose-700">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black font-heading text-rose-800">Rejected — Decision Recorded</span>
                    <p className="text-[11px] text-slate-500 font-body">AI recommendation rejected. Notification returned to Data Manager.</p>
                  </div>
                </>
              )}
              {reviewStatus === 'MODIFIED' && (
                <>
                  <div className="p-1 rounded-full bg-purple-100 text-purple-700">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black font-heading text-purple-800">Modified — Decision Recorded</span>
                    <p className="text-[11px] text-slate-500 font-body">Reviewer adjustments applied to standardized record.</p>
                  </div>
                </>
              )}
              {reviewStatus === 'NEW_MASTER_REQUIRED' && (
                <>
                  <div className="p-1 rounded-full bg-blue-100 text-blue-700">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black font-heading text-blue-800">New Master Created</span>
                    <p className="text-[11px] text-slate-500 font-body">Distinct material code registered without mapping to candidate.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/reviewer/harmonized-master"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading shadow-2xs transition"
              >
                View Harmonized Master
              </Link>
              <Link
                href="/reviewer/review-queue"
                className="px-4 py-2 rounded-xl bg-[#10203a] hover:bg-[#1a3866] text-xs font-bold text-white font-heading shadow-sm transition"
              >
                Return to Review Queue
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs font-heading font-bold text-slate-500 mr-2 hidden sm:block">
              Authoritative Human Decision:
            </div>

            {/* Compare */}
            <Link
              href={`/reviewer/comparison/${materialId}`}
              id="compare-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 font-heading shadow-2xs transition"
            >
              <GitCompare className="w-4 h-4 text-slate-500" />
              <span>Side-by-Side</span>
            </Link>

            <div className="flex-1" />

            {/* Reject */}
            <button
              id="action-reject-btn"
              onClick={onReject}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold font-heading text-rose-700 hover:bg-rose-100 transition shadow-2xs"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject</span>
            </button>

            {/* Modify */}
            <button
              id="action-modify-btn"
              onClick={onModify}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-xs font-bold font-heading text-purple-800 hover:bg-purple-100 transition shadow-2xs"
            >
              <Edit3 className="w-4 h-4 text-purple-600" />
              <span>Modify</span>
            </button>

            {/* Create New Master */}
            <button
              id="action-create-master-btn"
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold font-heading text-slate-800 hover:bg-slate-200 transition shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span>Create New Master</span>
            </button>

            {/* Approve — most prominent */}
            <button
              id="action-approve-btn"
              onClick={onApprove}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black font-heading text-white shadow-md shadow-emerald-700/20 transition transform hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Recommendation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
