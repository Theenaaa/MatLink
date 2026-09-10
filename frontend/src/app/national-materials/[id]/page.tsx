"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Database,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  getNationalMaterialDetailApi,
  approveNationalMaterialApi,
  rejectNationalMaterialApi,
  approveMaterialMappingApi,
  type NationalMaterialDetail,
} from "@/lib/api";

export default function NationalMaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const id = Number(params?.id);

  const [detail, setDetail] = useState<NationalMaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"DNA" | "MAPPINGS" | "EVIDENCE">("MAPPINGS");

  const canApprove =
    user?.role?.name === "SUPER_ADMIN" || user?.role?.name === "MATERIAL_EXPERT";

  const loadDetail = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getNationalMaterialDetailApi(token, id);
      setDetail(res);
    } catch (err: any) {
      setError(err.message || "Failed to load National Material details.");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleApproveNational = async () => {
    if (!token || !detail) return;
    setActionLoading(true);
    try {
      const updated = await approveNationalMaterialApi(token, detail.id);
      setDetail(updated);
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectNational = async () => {
    if (!token || !detail) return;
    const reason = prompt("Enter rejection reason:");
    if (!reason || !reason.trim()) return;

    setActionLoading(true);
    try {
      const updated = await rejectNationalMaterialApi(token, detail.id, reason.trim());
      setDetail(updated);
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMapping = async (mappingId: number) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await approveMaterialMappingApi(token, mappingId);
      await loadDetail();
    } catch (err: any) {
      alert(err.message || "Mapping approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-mono uppercase">Loading National Material Master...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 rounded-2xl bg-red-950/30 border border-red-500/30 text-center space-y-3">
        <XCircle className="w-10 h-10 mx-auto text-red-400" />
        <p className="text-sm font-semibold text-red-200">{error || "National Material Not Found"}</p>
        <button
          onClick={() => router.push("/national-materials")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-white transition"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/national-materials")}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-mono font-black text-white tracking-wider">
                {detail.national_material_code}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  detail.status === "APPROVED"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : detail.status === "PENDING_APPROVAL"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {detail.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{detail.canonical_description}</p>
          </div>
        </div>

        {canApprove && detail.status !== "APPROVED" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRejectNational}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-bold transition disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={handleApproveNational}
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Authorize National Identity</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("MAPPINGS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "MAPPINGS"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mapped Legacy CPSE Materials ({detail.mappings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("EVIDENCE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "EVIDENCE"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Evidence &amp; Lineage</span>
        </button>

        <button
          onClick={() => setActiveTab("DNA")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "DNA"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Canonical Specifications &amp; DNA</span>
        </button>
      </div>

      {/* TAB 1: MAPPED LEGACY MATERIALS */}
      {activeTab === "MAPPINGS" && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Legacy CPSE Material Mappings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Legacy materials preserve immutable raw descriptions and codes, mapped under this National Identity.
            </p>
          </div>

          {detail.mappings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-sm font-semibold text-slate-300">No Legacy Materials Mapped</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">CPSE</th>
                    <th className="py-3 px-4">Legacy Material Code</th>
                    <th className="py-3 px-4">Raw Source Description</th>
                    <th className="py-3 px-4">Mapping Type</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Status</th>
                    {canApprove && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {detail.mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold text-[10px]">
                          {m.cpse_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {m.material_code}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-sm truncate font-mono text-[11px]">
                        {m.material_raw_description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {m.mapping_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-white">
                        {(m.confidence_score * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            m.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : m.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="py-3 px-4 text-right">
                          {m.status === "PENDING" ? (
                            <button
                              onClick={() => handleApproveMapping(m.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition disabled:opacity-50"
                            >
                              Approve Mapping
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Authorized</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI EVIDENCE & LINEAGE */}
      {activeTab === "EVIDENCE" && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Traceable AI Decision Lineage</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preserves the exact AI scores, technical rules, human reviewer, and timestamps that created this Identity.
            </p>
          </div>

          {!detail.ai_evidence || Object.keys(detail.ai_evidence).length === 0 ? (
            <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-xs text-slate-400">Directly catalogued National Material without originating AI match pair.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Final Score</span>
                  <span className="text-lg font-mono font-black text-emerald-400">
                    {((detail.ai_evidence.final_score ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Semantic Score</span>
                  <span className="text-lg font-mono font-bold text-violet-400">
                    {((detail.ai_evidence.semantic_score ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Attribute Score</span>
                  <span className="text-lg font-mono font-bold text-sky-400">
                    {((detail.ai_evidence.attribute_score ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rule Score</span>
                  <span className="text-lg font-mono font-bold text-amber-400">
                    {((detail.ai_evidence.rule_score ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Class Score</span>
                  <span className="text-lg font-mono font-bold text-teal-400">
                    {((detail.ai_evidence.classification_score ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Recommendation Narrative */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AI Proposed Relationship:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {detail.ai_evidence.ai_relationship}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Originating Match ID:</span>
                  <span className="font-mono text-slate-300">#{detail.ai_evidence.match_id}</span>
                </div>
                {detail.ai_evidence.ai_explanation && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block mb-1">AI Reasoning Explanation:</span>
                    <p className="text-slate-200 italic bg-slate-900 p-2.5 rounded-lg border border-slate-850">
                      &quot;{detail.ai_evidence.ai_explanation}&quot;
                    </p>
                  </div>
                )}
                {detail.ai_evidence.reviewed_at && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                    Review completed at: {new Date(detail.ai_evidence.reviewed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CANONICAL SPECIFICATIONS & DNA */}
      {activeTab === "DNA" && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Canonical Specifications &amp; Material DNA</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized engineering attributes defining this National Material Identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Canonical Description</span>
                <p className="text-emerald-300 font-mono text-sm font-semibold">{detail.canonical_description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Type</span>
                  <span className="text-white font-mono font-bold">{detail.material_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Group</span>
                  <span className="text-white font-mono">{detail.material_group}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Structured DNA Payload</span>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-850">
                {JSON.stringify(detail.material_dna, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
