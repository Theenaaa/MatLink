"use client";

import React, { useState, useEffect } from "react";
import { MatchDetailItem, getMatchDetailApi } from "@/lib/api";

interface SideBySideComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  matchId: number | null;
}

export default function SideBySideComparisonModal({
  isOpen,
  onClose,
  token,
  matchId,
}: SideBySideComparisonModalProps) {
  const [detail, setDetail] = useState<MatchDetailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && matchId) {
      loadDetail(matchId);
    } else {
      setDetail(null);
      setError(null);
    }
  }, [isOpen, matchId]);

  const loadDetail = async (mId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMatchDetailApi(token, mId);
      setDetail(res);
    } catch (err: any) {
      setError(err.message || "Failed to load comparison details.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MATCH":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">MATCH</span>;
      case "MISMATCH":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">MISMATCH</span>;
      case "UNKNOWN":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">UNKNOWN</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-50 text-gray-600 border border-gray-200">N/A</span>;
    }
  };

  const getRelationshipBadge = (rel: string, hardBlocked: boolean) => {
    if (hardBlocked) {
      return <span className="px-3 py-1 text-xs font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-300">BLOCKED (HARD CONFLICT)</span>;
    }
    switch (rel) {
      case "SAME":
        return <span className="px-3 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">SAME CANDIDATE</span>;
      case "NEAR_DUPLICATE":
        return <span className="px-3 py-1 text-xs font-bold rounded-md bg-teal-100 text-teal-800 border border-teal-300">NEAR DUPLICATE</span>;
      case "FUNCTIONALLY_EQUIVALENT":
        return <span className="px-3 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-300">FUNCTIONALLY EQUIVALENT</span>;
      case "RELATED":
        return <span className="px-3 py-1 text-xs font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-300">RELATED</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-md bg-gray-100 text-gray-700 border border-gray-300">DIFFERENT</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Side-by-Side Material Comparison</h2>
              <p className="text-xs text-slate-300">AI-Assisted Technical Harmonization & Constraint Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm font-medium text-gray-500">Synthesizing comparison matrix...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Score & Recommendation Banner */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Classification:</span>
                    {getRelationshipBadge(detail.relationship_type, detail.hard_blocked)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Pair Analysis: <span className="font-semibold text-gray-800">{detail.material_a.material_code}</span> ({detail.material_a.cpse_code}) vs{" "}
                    <span className="font-semibold text-gray-800">{detail.material_b.material_code}</span> ({detail.material_b.cpse_code})
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-indigo-600">
                      {Math.round(detail.final_score * 100)}%
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hybrid Score</div>
                  </div>
                </div>
              </div>

              {/* Score Breakdown Bars */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Scoring Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium">Semantic (40%)</div>
                    <div className="text-lg font-bold text-gray-800">{Math.round(detail.semantic_score * 100)}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium">Attributes (30%)</div>
                    <div className="text-lg font-bold text-gray-800">{Math.round(detail.attribute_score * 100)}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium">Rules (20%)</div>
                    <div className="text-lg font-bold text-gray-800">{Math.round(detail.rule_score * 100)}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium">Class (10%)</div>
                    <div className="text-lg font-bold text-gray-800">{Math.round(detail.classification_score * 100)}%</div>
                  </div>
                </div>
              </div>

              {/* "Why This Match?" Explanation Narrative */}
              <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Why This Match? — Engineering Explanation</span>
                </div>
                <p className="text-sm text-indigo-950 leading-relaxed">
                  {detail.explanation}
                </p>
              </div>

              {/* Side-by-Side Comparison Matrix Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50/80 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Technical Attribute Comparison Matrix
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100/75 text-gray-600 font-semibold text-xs uppercase border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4">Attribute</th>
                        <th className="py-3 px-4">Material A ({detail.material_a.cpse_code})</th>
                        <th className="py-3 px-4">Material B ({detail.material_b.cpse_code})</th>
                        <th className="py-3 px-4 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {/* Overview Rows */}
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-4 text-gray-500 font-semibold">Material Code</td>
                        <td className="py-3 px-4 text-gray-900">{detail.material_a.material_code}</td>
                        <td className="py-3 px-4 text-gray-900">{detail.material_b.material_code}</td>
                        <td className="py-3 px-4 text-center text-xs text-gray-400">ID</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-4 text-gray-500 font-semibold">Raw Description</td>
                        <td className="py-3 px-4 text-gray-700 text-xs font-mono">{detail.material_a.raw_description}</td>
                        <td className="py-3 px-4 text-gray-700 text-xs font-mono">{detail.material_b.raw_description}</td>
                        <td className="py-3 px-4 text-center text-xs text-gray-400">SOURCE</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-4 text-gray-500 font-semibold">Canonical Description</td>
                        <td className="py-3 px-4 text-indigo-900 font-semibold text-xs">{detail.material_a.canonical_description || "—"}</td>
                        <td className="py-3 px-4 text-indigo-900 font-semibold text-xs">{detail.material_b.canonical_description || "—"}</td>
                        <td className="py-3 px-4 text-center text-xs text-gray-400">CANONICAL</td>
                      </tr>

                      {/* Dynamic Technical Attribute Rows */}
                      {Object.entries(detail.comparison_details || {}).map(([attr, entry]) => (
                        <tr key={attr} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-700 capitalize">
                            {attr.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-4 text-gray-800">
                            {entry.val_a || <span className="text-gray-400 italic">Not Specified</span>}
                          </td>
                          <td className="py-3 px-4 text-gray-800">
                            {entry.val_b || <span className="text-gray-400 italic">Not Specified</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getStatusBadge(entry.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-800 hover:bg-gray-900 text-white transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
