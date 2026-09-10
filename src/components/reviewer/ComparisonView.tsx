'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, MinusCircle } from 'lucide-react';
import type { Material, CandidateMatch } from '@/types';

interface ComparisonViewProps {
  material: Material;
  candidates: CandidateMatch[];
}

type CellStatus = 'MATCH' | 'CONFLICT' | 'MISSING';

interface ComparisonRow {
  attribute: string;
  source: string | undefined;
  recommended: string | undefined;
  candidates: (string | undefined)[];
}

function cellBg(status: CellStatus) {
  if (status === 'MATCH') return 'bg-emerald-50/80 text-emerald-900';
  if (status === 'CONFLICT') return 'bg-rose-50/80 text-rose-900';
  return 'bg-slate-50/40 text-slate-500';
}

function CellIcon({ status }: { status: CellStatus }) {
  if (status === 'MATCH') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  if (status === 'CONFLICT') return <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  return <MinusCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

function cellStatus(source: string | undefined, compare: string | undefined): CellStatus {
  if (!compare) return 'MISSING';
  if (!source) return 'MISSING';
  return source.toLowerCase().trim() === compare.toLowerCase().trim() ? 'MATCH' : 'CONFLICT';
}

export function ComparisonView({ material, candidates }: ComparisonViewProps) {
  const rec = material.aiRecommendation;

  const allAttributeKeys = Array.from(
    new Set([
      'Material',
      'Form',
      'Grade',
      'Thickness',
      'Standard',
      'UOM',
      'Manufacturer',
      'Category',
      ...Object.keys(material.normalizedAttributes ?? {}),
      ...Object.keys(rec.attributes),
      ...candidates.flatMap((c) => Object.keys(c.attributes)),
    ])
  );

  const rows: ComparisonRow[] = allAttributeKeys.map((attr) => ({
    attribute: attr,
    source:
      attr === 'Category'
        ? material.category
        : attr === 'UOM'
        ? material.uom
        : attr === 'Manufacturer'
        ? material.manufacturer
        : material.normalizedAttributes?.[attr],
    recommended: attr === 'Category' ? material.category : attr === 'UOM' ? material.uom : rec.attributes[attr],
    candidates: candidates.map((c) =>
      attr === 'Category' ? material.category : attr === 'UOM' ? material.uom : c.attributes[attr]
    ),
  }));

  // Only show rows where at least one column has a value
  const filteredRows = rows.filter(
    (r) => r.source || r.recommended || r.candidates.some(Boolean)
  );

  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 font-heading">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 bg-slate-100/70">
                Attribute
              </th>
              <th className="px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                <div className="text-[10px] text-slate-400 font-semibold mb-0.5">SOURCE CPSE</div>
                {material.sourceCPSE}
              </th>
              <th className="px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50/80 border-x border-blue-100">
                <div className="text-[10px] text-blue-600 font-semibold mb-0.5">AI RECOMMENDED</div>
                {rec.masterCode}
              </th>
              {candidates.map((c) => (
                <th
                  key={c.materialId}
                  className="px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50"
                >
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">CANDIDATE ({c.cpse})</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{c.materialId}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-body">
            {filteredRows.map((row) => {
              const recStatus = cellStatus(row.source, row.recommended);

              return (
                <tr key={row.attribute} className="hover:bg-slate-50/60 transition">
                  {/* Attribute name */}
                  <td className="px-4 py-3 bg-slate-50/50 font-heading font-bold text-slate-700 text-xs">
                    {row.attribute}
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3">
                    {row.source ? (
                      <span className="font-medium text-slate-800">{row.source}</span>
                    ) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>

                  {/* Recommended */}
                  <td className={`px-4 py-3 border-x border-slate-100 ${cellBg(recStatus)}`}>
                    <div className="flex items-center gap-1.5">
                      <CellIcon status={recStatus} />
                      {row.recommended ? (
                        <span
                          className={`font-semibold ${
                            recStatus === 'MATCH'
                              ? 'text-emerald-900'
                              : recStatus === 'CONFLICT'
                              ? 'text-rose-900'
                              : 'text-slate-500 italic'
                          }`}
                        >
                          {row.recommended}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Missing</span>
                      )}
                    </div>
                  </td>

                  {/* Candidate columns */}
                  {row.candidates.map((cv, ci) => {
                    const cs = cellStatus(row.source, cv);
                    return (
                      <td key={ci} className={`px-4 py-3 ${cellBg(cs)}`}>
                        <div className="flex items-center gap-1.5">
                          <CellIcon status={cs} />
                          {cv ? (
                            <span
                              className={`${
                                cs === 'MATCH'
                                  ? 'text-emerald-900 font-medium'
                                  : cs === 'CONFLICT'
                                  ? 'text-rose-900 font-medium'
                                  : 'text-slate-600'
                              }`}
                            >
                              {cv}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Missing</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-5 flex-wrap bg-slate-50/50 text-xs font-body font-medium">
        <div className="flex items-center gap-1.5 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Match with Source</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-800">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Conflict / Discrepancy</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Missing / Not Specified</span>
        </div>
      </div>
    </div>
  );
}
