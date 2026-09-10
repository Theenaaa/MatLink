'use client';

import React from 'react';
import { Sparkles, AlertTriangle, Tag, Hash, ShieldAlert } from 'lucide-react';
import type { AIRecommendation, MatchType } from '@/types';
import { MATCH_TYPE_LABELS, getConfidenceBand } from '@/types';

interface AIRecommendationPanelProps {
  recommendation: AIRecommendation;
}

function MatchTypeBadge({ type }: { type: MatchType }) {
  const cfg: Record<MatchType, string> = {
    EXACT: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    NEAR_DUPLICATE: 'bg-blue-50 text-blue-800 border-blue-200',
    FUNCTIONALLY_EQUIVALENT: 'bg-purple-50 text-purple-800 border-purple-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cfg[type]}`}>
      {MATCH_TYPE_LABELS[type]}
    </span>
  );
}

export function AIRecommendationPanel({ recommendation }: AIRecommendationPanelProps) {
  const band = getConfidenceBand(recommendation.confidence);
  const confColor =
    band === 'HIGH' ? 'text-emerald-700' : band === 'MEDIUM' ? 'text-amber-700' : 'text-rose-700';
  const confBg =
    band === 'HIGH' ? 'bg-emerald-50 border-emerald-200' :
    band === 'MEDIUM' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-fit">
      {/* Panel header */}
      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
            AI Recommendation
          </span>
          <p className="text-[10px] text-slate-500 font-body">Harmonized proposal</p>
        </div>
        <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 font-heading">
          Requires Validation
        </span>
      </div>

      <div className="p-5 space-y-4 font-body">
        {/* Master Code */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
            Recommended Master Code
          </div>
          <div className="font-mono text-base font-bold text-[#10203a] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
            {recommendation.masterCode}
          </div>
        </div>

        {/* Standardized Description */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
            Standardized Noun-Modifier Description
          </div>
          <div className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
            {recommendation.standardizedDescription}
          </div>
        </div>

        {/* Confidence & Match Type */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl border p-3 ${confBg}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 font-heading">
              Confidence Score
            </div>
            <div className={`text-2xl font-black font-heading ${confColor}`}>
              {recommendation.confidence}%
            </div>
            <div className="text-[10px] font-semibold text-slate-500 capitalize">
              {band.toLowerCase().replace('_', ' ')} Match
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-heading">
              Match Classification
            </div>
            <div>
              <MatchTypeBadge type={recommendation.matchType} />
            </div>
          </div>
        </div>

        {/* Key Matched Attributes */}
        {recommendation.attributes && Object.keys(recommendation.attributes).length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/40 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-heading">
              Standard Attributes & Mappings
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(recommendation.attributes).slice(0, 4).map(([k, v]) => (
                <div key={k} className="p-1.5 rounded-lg bg-white border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 block font-heading uppercase truncate">{k}</span>
                  <span className="font-mono font-bold text-slate-800 text-xs truncate block">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mandatory Governance Warning */}
        <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>⚠ Requires Domain Expert Validation:</strong> This AI recommendation is non-binding until certified and approved by you.
          </p>
        </div>
      </div>
    </div>
  );
}
