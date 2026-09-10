'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ListChecks,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { getReviewQueue, getReviewQueueKPIs, getUniqueCPSEs } from '@/lib/api/reviewApi';
import { KPICards } from '@/components/reviewer/KPICards';
import { ReviewFilters } from '@/components/reviewer/ReviewFilters';
import { ReviewQueueTable } from '@/components/reviewer/ReviewQueueTable';
import type { ReviewQueueFilters } from '@/types';

const DEFAULT_FILTERS: ReviewQueueFilters = {
  search: '',
  confidenceBand: 'ALL',
  matchType: 'ALL',
  sourceCPSE: 'ALL',
  reviewStatus: 'ALL',
};

export default function ReviewQueuePage() {
  const [filters, setFilters] = useState<ReviewQueueFilters>(DEFAULT_FILTERS);

  const kpisQuery = useQuery({
    queryKey: ['review-kpis'],
    queryFn: getReviewQueueKPIs,
  });

  const queueQuery = useQuery({
    queryKey: ['review-queue', filters],
    queryFn: () => getReviewQueue(filters),
  });

  const cpseQuery = useQuery({
    queryKey: ['cpse-list'],
    queryFn: getUniqueCPSEs,
  });

  const materials = queueQuery.data ?? [];
  const cpses = cpseQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header (Matching Image 1: Title + Subtitle + Refresh Button) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#10203a] shrink-0">
            <ListChecks className="w-6 h-6 text-[#10203a]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
              Review Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-body mt-0.5">
              Validate AI-generated material harmonization recommendations
            </p>
          </div>
        </div>

        {/* Refresh Action Button */}
        <div>
          <button
            id="review-queue-refresh-btn"
            onClick={() => {
              queueQuery.refetch();
              kpisQuery.refetch();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-bold shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${queueQuery.isFetching ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. 5 KPI Cards (Matching Image 1: Pending Review, High, Medium, Requires Review, Approved Today) ── */}
      <KPICards kpis={kpisQuery.data!} isLoading={kpisQuery.isLoading} />

      {/* ── 3. Filters Section (Confidence Tabs + Search & Dropdowns) ── */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <ReviewFilters
          filters={filters}
          onChange={setFilters}
          cpseOptions={cpses}
        />
      </div>

      {/* ── 4. Full-Width Material Records Table Card (Matching Image 1) ── */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        {/* Table Title Bar */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-heading">
            MATERIAL RECORDS
          </h2>
          <span className="text-xs font-medium text-slate-400 font-body">
            {materials.length} records
          </span>
        </div>

        {/* 8-Column Data Table */}
        <div className="rounded-xl border border-slate-200/80 overflow-hidden">
          <ReviewQueueTable
            materials={materials}
            isLoading={queueQuery.isLoading}
          />
        </div>
      </div>

      {/* ── 5. Human-in-the-Loop Governance Notice ── */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 font-body">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Human-in-the-Loop Governance Notice: </span>
          AI match confidence scores are decision-support recommendations only. As certified Domain Expert, your human validation is authoritative and will be immutably recorded in the central audit ledger.
        </div>
      </div>
    </div>
  );
}

