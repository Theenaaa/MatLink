"use client";

import React, { useState, useEffect } from "react";
import { MatchCandidateItem, getMaterialMatchesApi, matchMaterialApi } from "@/lib/api";
import SideBySideComparisonModal from "@/components/SideBySideComparisonModal";

interface MaterialMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  materialId: number | null;
  materialCode: string | null;
}

export default function MaterialMatchModal({
  isOpen,
  onClose,
  token,
  materialId,
  materialCode,
}: MaterialMatchModalProps) {
  const [candidates, setCandidates] = useState<MatchCandidateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Side-by-side modal state
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  useEffect(() => {
    if (isOpen && materialId) {
      loadMatches(materialId);
    } else {
      setCandidates([]);
      setError(null);
    }
  }, [isOpen, materialId]);

  const loadMatches = async (mId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMaterialMatchesApi(token, mId);
      setCandidates(res);
    } catch (err: any) {
      setError(err.message || "Failed to load candidate matches.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatching = async () => {
    if (!materialId) return;
    setMatchingInProgress(true);
    setError(null);
    try {
      const res = await matchMaterialApi(token, materialId);
      setCandidates(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute candidate matching.");
    } finally {
      setMatchingInProgress(false);
    }
  };

  const handleOpenComparison = (matchId: number) => {
    setSelectedMatchId(matchId);
    setIsComparisonOpen(true);
  };

  if (!isOpen) return null;

  const getRelationshipBadge = (rel: string, hardBlocked: boolean) => {
    if (hardBlocked) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
          BLOCKED (CONFLICT)
        </span>
      );
    }
    switch (rel) {
      case "SAME":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            SAME CANDIDATE
          </span>
        );
      case "NEAR_DUPLICATE":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-50 text-teal-700 border border-teal-200">
            NEAR DUPLICATE
          </span>
        );
      case "FUNCTIONALLY_EQUIVALENT":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            FUNCTIONALLY EQUIVALENT
          </span>
        );
      case "RELATED":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            RELATED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-gray-50 text-gray-700 border border-gray-200">
            DIFFERENT
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">AI Semantic Match Discovery</h2>
                <p className="text-xs text-slate-300">
                  Candidate harmonization for <span className="font-semibold text-white font-mono">{materialCode}</span>
                </p>
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

          {/* Action Bar */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Discovered <span className="font-bold text-gray-900">{candidates.length}</span> potential match candidates across CPSE masters.
            </div>
            <button
              onClick={handleRunMatching}
              disabled={matchingInProgress}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {matchingInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  Analyzing Vector Neighbors...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Re-run Candidate Discovery
                </>
              )}
            </button>
          </div>

          {/* Content List */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
            {loading && (
              <div className="py-16 text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm font-medium text-gray-500">Retrieving candidate matches...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
                {error}
              </div>
            )}

            {!loading && candidates.length === 0 && (
              <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">No Candidate Matches Analyzed Yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Click "Discover Candidate Matches" to generate Sentence Transformer embeddings and compare technical attributes against existing CPSE records.
                  </p>
                </div>
                <button
                  onClick={handleRunMatching}
                  disabled={matchingInProgress}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                >
                  Discover Candidate Matches
                </button>
              </div>
            )}

            {!loading && candidates.map((cand) => (
              <div
                key={cand.match_id}
                className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {cand.candidate_cpse_code}
                    </span>
                    <span className="font-mono font-bold text-sm text-gray-900">
                      {cand.candidate_material_code}
                    </span>
                    {getRelationshipBadge(cand.relationship_type, cand.hard_blocked)}
                  </div>

                  <p className="text-sm font-semibold text-indigo-950">
                    {cand.candidate_canonical_description || cand.candidate_raw_description}
                  </p>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {cand.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-indigo-600">
                      {Math.round(cand.final_score * 100)}%
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Match Score</div>
                  </div>

                  <button
                    onClick={() => handleOpenComparison(cand.match_id)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-900 hover:bg-black text-white transition-colors"
                  >
                    View Comparison
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Nested Side-by-Side Comparison Modal */}
      <SideBySideComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        token={token}
        matchId={selectedMatchId}
      />
    </>
  );
}
