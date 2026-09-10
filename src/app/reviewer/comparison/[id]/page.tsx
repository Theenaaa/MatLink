'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, GitCompare, Loader2, AlertTriangle, Database } from 'lucide-react';
import { getMaterial } from '@/lib/api/reviewApi';
import { ComparisonView } from '@/components/reviewer/ComparisonView';

export default function ComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', id],
    queryFn: () => getMaterial(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm font-body">Loading comparison data...</span>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-10 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <div className="text-slate-600 text-sm font-medium">Material not found: {id}</div>
        <Link href="/reviewer/review-queue" className="text-blue-700 font-bold hover:underline text-sm">
          ← Return to Review Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/reviewer/match-review/${id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Review
        </Link>
        <span className="text-slate-300">/</span>
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-blue-900" />
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Technical Attribute Comparison
          </h1>
        </div>
      </div>

      {/* Material Context Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap font-body">
        <div className="flex items-center gap-5 flex-wrap">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">Material ID</div>
            <div className="text-xs font-mono font-bold text-blue-800 mt-0.5">{material.id}</div>
          </div>
          <div className="max-w-md">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">Original Description</div>
            <div className="text-xs sm:text-sm text-slate-900 font-bold font-heading truncate mt-0.5" title={material.originalDescription}>
              {material.originalDescription}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">Source CPSE</div>
            <div className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 mt-0.5">
              {material.sourceCPSE}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">AI Confidence</div>
            <div className="text-sm font-black font-heading text-emerald-700 mt-0.5">
              {material.aiRecommendation.confidence}%
            </div>
          </div>
        </div>

        <div>
          <Link
            href={`/reviewer/match-review/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#10203a] via-[#1a3866] to-[#254b8c] text-white text-xs font-heading font-bold shadow-xs hover:shadow-sm transition"
          >
            <span>Review Decision</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>

      {/* Purpose note */}
      <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 font-body">
        <GitCompare className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <div>
          This comparison table is for <strong className="text-slate-800">technical cross-catalog validation only</strong>.
          Color indicators designate exact attribute matches (green), parameter conflicts (rose), and missing catalog data (slate).
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <ComparisonView
          material={material}
          candidates={material.candidateMatches}
        />
      </div>

      {/* Back CTA */}
      <div className="flex justify-end pt-2">
        <Link
          href={`/reviewer/match-review/${id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10203a] hover:bg-[#1a3866] text-xs font-heading font-bold text-white shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Review Workspace
        </Link>
      </div>
    </div>
  );
}
