'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, ChevronDown, ChevronUp, ArrowRight, AlertTriangle } from 'lucide-react';
import type { CandidateMatch } from '@/types';

interface SimilarMaterialsProps {
  candidates: CandidateMatch[];
  materialId: string;
}

function SimilarityBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-amber-500' : 'bg-rose-500';
  const textColor = value >= 90 ? 'text-emerald-700' : value >= 75 ? 'text-amber-700' : 'text-rose-700';

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-black font-heading tabular-nums ${textColor}`}>
        {value}%
      </span>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: CandidateMatch }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs font-body">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-[#10203a] text-white flex items-center justify-center shrink-0 font-heading font-black text-xs">
          {candidate.cpse.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 font-heading">{candidate.cpse}</span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{candidate.materialId}</span>
          </div>
          <SimilarityBar value={candidate.similarity} />
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-slate-100 space-y-3 bg-white">
          {/* Description */}
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5 font-heading font-bold">Description</div>
            <div className="text-xs text-slate-800 font-medium">{candidate.description}</div>
          </div>

          {/* Key Attributes */}
          {candidate.attributes && Object.keys(candidate.attributes).length > 0 && (
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1 font-heading font-bold">Matched Attributes</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(candidate.attributes).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-heading">{k}</span>
                    <span className="font-mono text-slate-800 font-bold text-xs">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Risk Warning */}
          {candidate.similarity >= 85 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>High duplicate probability with this enterprise catalog item.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SimilarMaterials({
  candidates,
  materialId,
}: SimilarMaterialsProps) {
  if (candidates.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
              Cross-CPSE Candidate Matches ({candidates.length})
            </h3>
            <p className="text-[10px] text-slate-500 font-body">Potential identical items found across other oil enterprises</p>
          </div>
        </div>

        <Link
          href={`/reviewer/comparison/${materialId}`}
          className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-blue-800 hover:text-blue-950 transition"
        >
          <span>Side-by-Side Comparison</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {candidates.map((c) => (
          <CandidateCard key={c.materialId} candidate={c} />
        ))}
      </div>
    </div>
  );
}
