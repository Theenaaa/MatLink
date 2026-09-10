'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import type { ReviewQueueFilters, ConfidenceBand, MatchType, ReviewStatus } from '@/types';
import { REVIEW_STATUS_LABELS, MATCH_TYPE_LABELS } from '@/types';

interface ReviewFiltersProps {
  filters: ReviewQueueFilters;
  onChange: (filters: ReviewQueueFilters) => void;
  cpseOptions: string[];
}

const CONFIDENCE_TABS: { value: 'ALL' | ConfidenceBand; label: string }[] = [
  { value: 'ALL', label: 'All Records' },
  { value: 'HIGH', label: '90–100% High' },
  { value: 'MEDIUM', label: '75–89% Medium' },
  { value: 'REQUIRES_REVIEW', label: '<75% Low' },
];

const MATCH_TYPE_OPTIONS: { value: 'ALL' | MatchType; label: string }[] = [
  { value: 'ALL', label: 'All Match Types' },
  { value: 'EXACT', label: 'Exact' },
  { value: 'NEAR_DUPLICATE', label: 'Near-Duplicate' },
  { value: 'FUNCTIONALLY_EQUIVALENT', label: 'Functionally Equivalent' },
];

const STATUS_OPTIONS: { value: 'ALL' | ReviewStatus; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'MODIFIED', label: 'Modified' },
  { value: 'NEW_MASTER_REQUIRED', label: 'New Master Required' },
];

export function ReviewFilters({ filters, onChange, cpseOptions }: ReviewFiltersProps) {
  const update = (patch: Partial<ReviewQueueFilters>) =>
    onChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.search ||
    filters.matchType !== 'ALL' ||
    filters.sourceCPSE !== 'ALL' ||
    filters.reviewStatus !== 'ALL';

  const clearAll = () =>
    onChange({ search: '', confidenceBand: 'ALL', matchType: 'ALL', sourceCPSE: 'ALL', reviewStatus: 'ALL' });

  return (
    <div className="space-y-3 font-body">
      {/* Confidence band tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CONFIDENCE_TABS.map(({ value, label }) => (
          <button
            key={value}
            id={`filter-confidence-${value.toLowerCase()}`}
            onClick={() => update({ confidenceBand: value })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition font-heading ${
              filters.confidenceBand === value
                ? 'bg-[#10203a] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + Dropdowns row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="review-queue-search"
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search by ID, description, CPSE..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a] transition"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Match Type */}
        <select
          id="filter-match-type"
          value={filters.matchType}
          onChange={(e) => update({ matchType: e.target.value as 'ALL' | MatchType })}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a]"
        >
          {MATCH_TYPE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Source CPSE */}
        <select
          id="filter-source-cpse"
          value={filters.sourceCPSE}
          onChange={(e) => update({ sourceCPSE: e.target.value })}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a]"
        >
          <option value="ALL">All CPSEs</option>
          {cpseOptions.map((cpse) => (
            <option key={cpse} value={cpse}>{cpse}</option>
          ))}
        </select>

        {/* Review Status */}
        <select
          id="filter-review-status"
          value={filters.reviewStatus}
          onChange={(e) => update({ reviewStatus: e.target.value as 'ALL' | ReviewStatus })}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a]"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
