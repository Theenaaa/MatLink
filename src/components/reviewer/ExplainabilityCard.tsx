'use client';

import React from 'react';
import { HelpCircle, CheckCircle2, AlertTriangle, MinusCircle, Info } from 'lucide-react';
import type { ExplainabilityFactor } from '@/types';

interface ExplainabilityCardProps {
  factors: ExplainabilityFactor[];
}

function FactorRow({ factor }: { factor: ExplainabilityFactor }) {
  if (factor.status === 'MATCH') {
    return (
      <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 font-body">
        <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold font-heading text-slate-800">{factor.attribute}</span>
            {factor.sourceValue && factor.recommendedValue && factor.sourceValue !== factor.recommendedValue && (
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {factor.sourceValue} → {factor.recommendedValue}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{factor.description}</p>
        </div>
      </div>
    );
  }

  if (factor.status === 'CONFLICT') {
    return (
      <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 bg-rose-50/50 -mx-5 px-5 font-body">
        <div className="p-1 rounded-full bg-rose-100 text-rose-600 shrink-0 mt-0.5">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold font-heading text-rose-900">{factor.attribute}</span>
            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-heading">
              CONFLICT
            </span>
          </div>
          {factor.sourceValue && (
            <div className="mt-1 space-y-0.5 text-xs">
              <div className="text-[11px] text-slate-500">
                Source: <span className="text-slate-800 font-mono font-medium">{factor.sourceValue}</span>
              </div>
              {factor.recommendedValue && (
                <div className="text-[11px] text-slate-500">
                  Recommended: <span className="text-blue-900 font-mono font-medium">{factor.recommendedValue}</span>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">{factor.description}</p>
        </div>
      </div>
    );
  }

  // MISSING
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 font-body">
      <div className="p-1 rounded-full bg-slate-100 text-slate-400 shrink-0 mt-0.5">
        <MinusCircle className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold font-heading text-slate-700">{factor.attribute}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-heading">NOT IN SOURCE</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{factor.description}</p>
      </div>
    </div>
  );
}

export function ExplainabilityCard({ factors }: ExplainabilityCardProps) {
  const matches = factors.filter((f) => f.status === 'MATCH').length;
  const conflicts = factors.filter((f) => f.status === 'CONFLICT').length;
  const missing = factors.filter((f) => f.status === 'MISSING').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-fit">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
            AI Explainability
          </span>
          <p className="text-[10px] text-slate-500 font-body">Attribute-by-attribute audit</p>
        </div>
      </div>

      {/* Summary stats pill row */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 flex-wrap text-[11px] font-heading font-bold">
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✓ {matches} Matched
        </span>
        {conflicts > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            ⚠ {conflicts} Conflict{conflicts !== 1 ? 's' : ''}
          </span>
        )}
        {missing > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            — {missing} Inferred
          </span>
        )}
      </div>

      {/* Factor list */}
      <div className="px-5 py-2 divide-y divide-slate-100">
        {factors.map((factor, i) => (
          <FactorRow key={i} factor={factor} />
        ))}
      </div>
    </div>
  );
}
