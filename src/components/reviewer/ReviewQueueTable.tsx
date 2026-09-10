'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle2, Clock, XCircle, Sparkles, Minus, ExternalLink } from 'lucide-react';
import type { Material, ReviewStatus, MatchType, ConfidenceBand } from '@/types';
import { getConfidenceBand, REVIEW_STATUS_LABELS, MATCH_TYPE_LABELS } from '@/types';

// ── Badge helpers with Light Theme matching FlowMail & Landing Page ───────────

function ConfidenceBadge({ score }: { score: number }) {
  const band = getConfidenceBand(score);
  if (band === 'HIGH') {
    return (
      <div className="text-right">
        <div className="text-sm font-black font-heading text-emerald-700">{score}%</div>
        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">High Confidence</div>
      </div>
    );
  }
  if (band === 'MEDIUM') {
    return (
      <div className="text-right">
        <div className="text-sm font-black font-heading text-amber-700">{score}%</div>
        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Medium Match</div>
      </div>
    );
  }
  return (
    <div className="text-right">
      <div className="text-sm font-black font-heading text-rose-700">{score}%</div>
      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Manual Review</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const configs: Record<ReviewStatus, { color: string; icon: React.ElementType }> = {
    PENDING_REVIEW: { color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
    IN_REVIEW: { color: 'bg-blue-50 text-blue-800 border-blue-200', icon: Sparkles },
    APPROVED: { color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
    REJECTED: { color: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle },
    MODIFIED: { color: 'bg-purple-50 text-purple-800 border-purple-200', icon: AlertTriangle },
    NEW_MASTER_REQUIRED: { color: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: Minus },
  };
  const { color, icon: Icon } = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
      <Icon className="w-3 h-3" />
      {REVIEW_STATUS_LABELS[status]}
    </span>
  );
}

function MatchTypeBadge({ type }: { type: MatchType }) {
  const configs: Record<MatchType, string> = {
    EXACT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NEAR_DUPLICATE: 'bg-blue-50 text-blue-700 border-blue-200',
    FUNCTIONALLY_EQUIVALENT: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${configs[type]}`}>
      {MATCH_TYPE_LABELS[type]}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-slate-100/60 rounded-xl animate-pulse">
          <div className="h-5 w-28 bg-slate-200 rounded" />
          <div className="h-5 flex-1 bg-slate-200 rounded" />
          <div className="h-5 w-20 bg-slate-200 rounded" />
          <div className="h-5 w-16 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '05 Sept 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '05 Sept 2026';
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return '05 Sept 2026';
  }
}

export function ReviewQueueTable({
  materials,
  isLoading,
}: {
  materials: Material[];
  isLoading: boolean;
}) {
  if (isLoading) return <TableSkeleton />;

  if (materials.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 font-body">
        <p className="text-sm font-medium">No material records found matching current filter criteria.</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting the filters or searching with a different term.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-700">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-heading font-bold uppercase tracking-wider text-[11px]">
            <th className="px-3.5 py-3">MATERIAL ID</th>
            <th className="px-3.5 py-3">ORIGINAL DESCRIPTION</th>
            <th className="px-3.5 py-3">SOURCE CPSE</th>
            <th className="px-3.5 py-3">AI CONFIDENCE</th>
            <th className="px-3.5 py-3">MATCH TYPE</th>
            <th className="px-3.5 py-3">REVIEW STATUS</th>
            <th className="px-3.5 py-3">LAST UPDATED</th>
            <th className="px-3.5 py-3 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {materials.map((mat) => (
            <tr
              key={mat.id}
              className="hover:bg-slate-50/80 transition group"
            >
              {/* Material ID */}
              <td className="px-3.5 py-3 whitespace-nowrap">
                <Link
                  href={`/reviewer/match-review/${mat.id}`}
                  className="font-mono font-bold text-xs text-blue-700 hover:text-blue-900 hover:underline"
                >
                  {mat.id}
                </Link>
              </td>

              {/* Original Description */}
              <td className="px-3.5 py-3 max-w-xs md:max-w-sm">
                <div className="font-heading font-bold text-slate-900 text-xs tracking-tight truncate" title={mat.originalDescription}>
                  {mat.originalDescription}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  {mat.aiRecommendation?.masterCode || mat.originalCode}
                </div>
              </td>

              {/* Source CPSE */}
              <td className="px-3.5 py-3 whitespace-nowrap">
                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {mat.sourceCPSE}
                </span>
              </td>

              {/* AI Confidence */}
              <td className="px-3.5 py-3 whitespace-nowrap">
                <ConfidenceBadge score={mat.aiRecommendation.confidence} />
              </td>

              {/* Match type */}
              <td className="px-3.5 py-3 whitespace-nowrap">
                <MatchTypeBadge type={mat.aiRecommendation.matchType} />
              </td>

              {/* Review status */}
              <td className="px-3.5 py-3 whitespace-nowrap">
                <StatusBadge status={mat.reviewStatus} />
              </td>

              {/* Last Updated */}
              <td className="px-3.5 py-3 whitespace-nowrap text-slate-500 font-body">
                {formatDate(mat.updatedAt)}
              </td>

              {/* Action */}
              <td className="px-3.5 py-3 text-right whitespace-nowrap">
                <Link
                  href={`/reviewer/match-review/${mat.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10203a] hover:bg-[#1a3866] text-white text-xs font-heading font-bold shadow-xs hover:shadow-sm transition"
                >
                  <span>{mat.reviewStatus === 'APPROVED' ? 'View' : 'Review Match'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
