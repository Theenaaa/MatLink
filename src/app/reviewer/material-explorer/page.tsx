'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search,
  SearchCode,
  X,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Minus,
  Sparkles,
  Layers,
  Database,
  Tag
} from 'lucide-react';
import { getReviewQueue, getUniqueCPSEs } from '@/lib/api/reviewApi';
import { getConfidenceBand, REVIEW_STATUS_LABELS, MATCH_TYPE_LABELS } from '@/types';
import type { Material, ReviewStatus, MatchType } from '@/types';

const ITEMS_PER_PAGE = 10;

function ConfidenceChip({ score }: { score: number }) {
  const band = getConfidenceBand(score);
  const cls =
    band === 'HIGH'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : band === 'MEDIUM'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black font-heading border ${cls}`}>
      {score}%
    </span>
  );
}

function StatusChip({ status }: { status: ReviewStatus }) {
  const configs: Record<ReviewStatus, string> = {
    PENDING_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200',
    IN_REVIEW: 'bg-blue-50 text-blue-800 border-blue-200',
    APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
    MODIFIED: 'bg-purple-50 text-purple-800 border-purple-200',
    NEW_MASTER_REQUIRED: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${configs[status]}`}>
      {REVIEW_STATUS_LABELS[status]}
    </span>
  );
}

export default function MaterialExplorerPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [cpseFilter, setCpseFilter] = useState('ALL');
  const [matchFilter, setMatchFilter] = useState<'ALL' | MatchType>('ALL');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: allMaterials = [], isLoading } = useQuery({
    queryKey: ['review-queue', { search: '', confidenceBand: 'ALL', matchType: 'ALL', sourceCPSE: 'ALL', reviewStatus: 'ALL' }],
    queryFn: () => getReviewQueue({}),
  });

  const { data: cpses = [] } = useQuery({
    queryKey: ['cpse-list'],
    queryFn: getUniqueCPSEs,
  });

  // Client-side filtering for explorer (supports all fields)
  const filtered = allMaterials.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      [
        m.id,
        m.originalDescription,
        m.sourceCPSE,
        m.category,
        m.aiRecommendation.masterCode,
        m.aiRecommendation.standardizedDescription,
        Object.values(m.normalizedAttributes ?? {}).join(' '),
      ].some((v) => v.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || m.reviewStatus === statusFilter;
    const matchesCPSE = cpseFilter === 'ALL' || m.sourceCPSE === cpseFilter;
    const matchesMatch = matchFilter === 'ALL' || m.aiRecommendation.matchType === matchFilter;
    return matchesSearch && matchesStatus && matchesCPSE && matchesMatch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#10203a] shrink-0">
          <SearchCode className="w-6 h-6 text-[#10203a]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
            Material Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-body mt-0.5">
            Search and investigate materials across CPSE catalogs before making review decisions
          </p>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="explorer-search"
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by Material ID, description, CPSE, category, master code, attributes..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a] transition font-body"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <select
              value={cpseFilter}
              onChange={(e) => {
                setCpseFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a]"
            >
              <option value="ALL">All CPSEs</option>
              {cpses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | ReviewStatus);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a]"
            >
              <option value="ALL">All Statuses</option>
              {(Object.keys(REVIEW_STATUS_LABELS) as ReviewStatus[]).map((s) => (
                <option key={s} value={s}>
                  {REVIEW_STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            <select
              value={matchFilter}
              onChange={(e) => {
                setMatchFilter(e.target.value as 'ALL' | MatchType);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10203a]"
            >
              <option value="ALL">All Match Types</option>
              {(Object.keys(MATCH_TYPE_LABELS) as MatchType[]).map((t) => (
                <option key={t} value={t}>
                  {MATCH_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-bold text-slate-500 font-body">
            {isLoading ? 'Loading...' : `${filtered.length} record${filtered.length !== 1 ? 's' : ''} found`}
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#10203a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Search className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No materials match your current search criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((m) => {
              const isExpanded = expanded === m.id;
              return (
                <div key={m.id} className="group">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : m.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/80 transition text-left"
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                      <span className="font-mono text-xs text-blue-700 font-bold hover:underline">
                        {m.id}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-900 font-bold truncate sm:col-span-2 font-heading">
                        {m.originalDescription}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {m.sourceCPSE}
                        </span>
                        <ConfidenceChip score={m.aiRecommendation.confidence} />
                        <StatusChip status={m.reviewStatus} />
                      </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-slate-600 transition shrink-0 ml-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 py-5 border-t border-slate-100 bg-slate-50/70 grid grid-cols-1 md:grid-cols-2 gap-6 font-body">
                      {/* Original CPSE Data */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-slate-500" />
                          <span>Original CPSE Catalog Data</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 font-medium">Original Code: </span>
                            <span className="font-mono font-bold text-slate-800">{m.originalCode}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Category: </span>
                            <span className="text-slate-800 font-medium">{m.category}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Unit of Measure (UOM): </span>
                            <span className="text-slate-800 font-medium">{m.uom}</span>
                          </div>
                          {m.manufacturer && (
                            <div>
                              <span className="text-slate-400 font-medium">Manufacturer: </span>
                              <span className="text-slate-800 font-medium">{m.manufacturer}</span>
                            </div>
                          )}
                          {m.originalSpecifications && (
                            <div>
                              <span className="text-slate-400 font-medium">Specifications: </span>
                              <span className="text-slate-700">{m.originalSpecifications}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Recommended Harmonization */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider font-heading border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>AI Recommendation Master</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 font-medium">Harmonized Code: </span>
                            <span className="font-mono font-bold text-blue-800">{m.aiRecommendation.masterCode}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Standardized Description: </span>
                            <span className="text-slate-800 font-medium">{m.aiRecommendation.standardizedDescription}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">AI Confidence: </span>
                            <ConfidenceChip score={m.aiRecommendation.confidence} />
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Match Taxonomy: </span>
                            <span className="text-slate-800 font-bold">{MATCH_TYPE_LABELS[m.aiRecommendation.matchType]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="md:col-span-2 flex justify-end pt-1">
                        <Link
                          href={`/reviewer/match-review/${m.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#10203a] via-[#1a3866] to-[#254b8c] text-white text-xs font-heading font-bold shadow-xs hover:shadow-sm transition transform hover:-translate-y-0.5"
                        >
                          <span>Open Review Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs text-slate-500 font-body">
              Page {page} of {totalPages} ({filtered.length} total records)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-heading border transition ${
                    page === p
                      ? 'bg-[#10203a] border-[#10203a] text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
