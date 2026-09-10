"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Cpu,
  Layers,
  Sparkles,
  Database,
  CheckCircle2,
  Code,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ClipboardCheck,
  Check,
  X,
  Edit3,
  ExternalLink,
  History,
} from "lucide-react";
import {
  getDashboardMetrics,
  listMaterialsApi,
  getMaterialDetailApi,
  batchNormalizeMaterialsApi,
  getMatchingMetricsApi,
  batchMatchMaterialsApi,
  getExpertReviewQueueApi,
  getExpertDashboardMetricsApi,
  type DashboardMetrics,
  type PaginatedMaterials,
  type MaterialDetailItem,
  type MatchingMetrics,
  type ReviewQueueItem,
  type ExpertDashboardMetrics,
} from "@/lib/api";
import MaterialDetailModal from "@/components/MaterialDetailModal";
import MaterialMatchModal from "@/components/MaterialMatchModal";
import SideBySideComparisonModal from "@/components/SideBySideComparisonModal";
import ReviewDecisionModal from "@/components/ReviewDecisionModal";

export default function MaterialExpertDashboard() {
  const { user, token } = useAuth();
  const cpseCode = user?.cpse?.code || "UNIVERSAL";

  // Active view tab: "QUEUE" | "DNA" | "HISTORY"
  const [activeTab, setActiveTab] = useState<"QUEUE" | "DNA" | "HISTORY">("QUEUE");

  // Phase 5: Expert Review Queue State
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queuePage, setQueuePage] = useState(1);
  const [queueTotalPages, setQueueTotalPages] = useState(1);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueStatusFilter, setQueueStatusFilter] = useState("PENDING");
  const [queueRelFilter, setQueueRelFilter] = useState("");

  // Phase 5: Expert Dashboard Metrics
  const [expertMetrics, setExpertMetrics] = useState<ExpertDashboardMetrics | null>(null);
  const [expertMetricsLoading, setExpertMetricsLoading] = useState(true);

  // Review Decision Modal State
  const [selectedQueueItem, setSelectedQueueItem] = useState<ReviewQueueItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Side-by-side comparison modal state
  const [comparisonMatchId, setComparisonMatchId] = useState<number | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  // Phase 3 & 4 Catalog browser state
  const [materials, setMaterials] = useState<PaginatedMaterials | null>(null);
  const [matsLoading, setMatsLoading] = useState(true);
  const [matsPage, setMatsPage] = useState(1);
  const [matsSearch, setMatsSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("NORMALIZED");

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetailItem | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [batchNormalizing, setBatchNormalizing] = useState(false);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  const [matchingMetrics, setMatchingMetrics] = useState<MatchingMetrics | null>(null);
  const [batchMatching, setBatchMatching] = useState(false);
  const [matchMsg, setMatchMsg] = useState<string | null>(null);

  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchMaterialId, setMatchMaterialId] = useState<number | null>(null);
  const [matchMaterialCode, setMatchMaterialCode] = useState<string>("");

  const handleOpenMatches = (id: number, code?: string | null) => {
    setMatchMaterialId(id);
    setMatchMaterialCode(code || "");
    setMatchModalOpen(true);
  };

  const loadExpertMetrics = useCallback(async () => {
    if (!token) return;
    setExpertMetricsLoading(true);
    try {
      const em = await getExpertDashboardMetricsApi(token);
      setExpertMetrics(em);
    } catch {
      /* silent */
    } finally {
      setExpertMetricsLoading(false);
    }
  }, [token]);

  const loadReviewQueue = useCallback(
    async (page = 1, status = "PENDING", rel = "") => {
      if (!token) return;
      setQueueLoading(true);
      try {
        const res = await getExpertReviewQueueApi(token, {
          page,
          page_size: 10,
          status: status || undefined,
          relationship_type: rel || undefined,
        });
        setQueueItems(res.items);
        setQueueTotal(res.total);
        setQueuePage(res.page);
        setQueueTotalPages(res.total_pages);
      } catch {
        /* silent */
      } finally {
        setQueueLoading(false);
      }
    },
    [token]
  );

  const loadMaterials = useCallback(
    async (page = 1, q = "", status = "") => {
      if (!token) return;
      setMatsLoading(true);
      try {
        const m = await listMaterialsApi(token, {
          page,
          page_size: 10,
          q: q || undefined,
          normalization_status: status || undefined,
        });
        setMaterials(m);
      } catch {
        /* silent */
      } finally {
        setMatsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadExpertMetrics();
    loadReviewQueue(1, queueStatusFilter, queueRelFilter);
    loadMaterials(1, "", statusFilter);
  }, [loadExpertMetrics, loadReviewQueue, loadMaterials, queueStatusFilter, queueRelFilter, statusFilter]);

  const handleInspect = async (id: number) => {
    if (!token) return;
    setInspectLoading(true);
    try {
      const detail = await getMaterialDetailApi(token, id);
      setSelectedMaterial(detail);
    } catch (err: any) {
      alert(err.message || "Failed to inspect material");
    } finally {
      setInspectLoading(false);
    }
  };

  const handleBatchNormalize = async () => {
    if (!token) return;
    setBatchNormalizing(true);
    setBatchMsg(null);
    try {
      const res = await batchNormalizeMaterialsApi(token);
      setBatchMsg(res.message);
      await Promise.all([loadMaterials(matsPage, matsSearch, statusFilter), loadExpertMetrics()]);
    } catch (err: any) {
      alert(err.message || "Normalization failed");
    } finally {
      setBatchNormalizing(false);
    }
  };

  const handleBatchMatch = async () => {
    if (!token) return;
    setBatchMatching(true);
    setMatchMsg(null);
    try {
      const res = await batchMatchMaterialsApi(token);
      setMatchMsg(res.message);
      await Promise.all([
        loadReviewQueue(queuePage, queueStatusFilter, queueRelFilter),
        loadExpertMetrics(),
      ]);
    } catch (err: any) {
      alert(err.message || "Batch matching failed");
    } finally {
      setBatchMatching(false);
    }
  };

  const openReviewModal = (item: ReviewQueueItem) => {
    setSelectedQueueItem(item);
    setReviewModalOpen(true);
  };

  const openComparisonModal = (matchId: number) => {
    setComparisonMatchId(matchId);
    setComparisonModalOpen(true);
  };

  const Skeleton = () => <span className="inline-block w-16 h-6 bg-slate-800 rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-slate-900 border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2 border border-emerald-500/30">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Phase 5 Human-in-the-Loop Expert Validation &amp; National Material Harmonization</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Material Expert Workstation
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> · Scope:{" "}
              <span className="text-emerald-400 font-semibold">National / Universal Material Standardization</span>.
              Validate AI candidate matches, resolve engineering discrepancies, assign trusted National Material Codes, and approve legacy CPSE mappings.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handleBatchMatch}
              disabled={batchMatching}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition shadow-sm"
            >
              <Sparkles className={`w-3.5 h-3.5 ${batchMatching ? "animate-spin" : ""}`} />
              <span>{batchMatching ? "Refreshing Matches..." : "Run AI Matching"}</span>
            </button>
            <a
              href="/national-materials"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>National Materials Directory</span>
            </a>
          </div>
        </div>
      </div>

      {batchMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <span>{batchMsg}</span>
          <button onClick={() => setBatchMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {matchMsg && (
        <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-xs text-violet-300 flex items-center justify-between">
          <span>{matchMsg}</span>
          <button onClick={() => setMatchMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* REAL Database Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pending Expert Reviews</span>
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2 font-mono">
            {expertMetricsLoading ? <Skeleton /> : (expertMetrics?.pending_reviews ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Priority-ranked candidates</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Decisions Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">
            {expertMetricsLoading ? (
              <Skeleton />
            ) : (
              ((expertMetrics?.approved_today ?? 0) + (expertMetrics?.modified_today ?? 0)).toLocaleString()
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {expertMetrics?.approved_today ?? 0} approved · {expertMetrics?.rejected_today ?? 0} rejected
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">National Materials</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-300 mt-2 font-mono">
            {expertMetricsLoading ? (
              <Skeleton />
            ) : (
              (expertMetrics?.national_materials_approved ?? 0).toLocaleString()
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {expertMetrics?.national_materials_awaiting_approval ?? 0} pending authorization
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Legacy Mappings</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 mt-2 font-mono">
            {expertMetricsLoading ? (
              <Skeleton />
            ) : (
              (expertMetrics?.total_legacy_mappings ?? 0).toLocaleString()
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cross-CPSE linked materials</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("QUEUE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "QUEUE"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Expert Review Queue ({queueTotal})</span>
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
          <span>Material DNA Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "HISTORY"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Recent Decision History</span>
        </button>
      </div>

      {/* TAB 1: EXPERT REVIEW QUEUE */}
      {activeTab === "QUEUE" && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                <span>Priority-Ranked Review Queue</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Matches are automatically ordered by priority (Engineering hard-blocks and borderline scores first)
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={queueStatusFilter}
                onChange={(e) => {
                  setQueueStatusFilter(e.target.value);
                  setQueuePage(1);
                  loadReviewQueue(1, e.target.value, queueRelFilter);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="PENDING">Status: PENDING</option>
                <option value="APPROVED">Status: APPROVED</option>
                <option value="REJECTED">Status: REJECTED</option>
              </select>

              <select
                value={queueRelFilter}
                onChange={(e) => {
                  setQueueRelFilter(e.target.value);
                  setQueuePage(1);
                  loadReviewQueue(1, queueStatusFilter, e.target.value);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">All Relationships</option>
                <option value="SAME">SAME</option>
                <option value="NEAR_DUPLICATE">NEAR_DUPLICATE</option>
                <option value="FUNCTIONALLY_EQUIVALENT">FUNCTIONALLY_EQUIVALENT</option>
                <option value="APPROVED_SUBSTITUTE">APPROVED_SUBSTITUTE</option>
                <option value="RELATED">RELATED</option>
                <option value="DIFFERENT">DIFFERENT</option>
              </select>
            </div>
          </div>

          {queueLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-800/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : queueItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-300">Queue is Clear</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No candidate matches currently requiring review under &quot;{queueStatusFilter}&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueItems.map((item) => (
                <div
                  key={item.match_id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.priority === "HIGH"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : item.priority === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        Priority: {item.priority}
                      </span>
                      <span className="font-mono text-xs text-slate-400">Match #{item.match_id}</span>
                      {item.hard_blocked && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" /> Hard Blocked
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openComparisonModal(item.match_id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Side-by-Side
                      </button>
                      <button
                        onClick={() => openReviewModal(item)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                      >
                        <ClipboardCheck className="w-3 h-3" /> Expert Action
                      </button>
                    </div>
                  </div>

                  {/* Materials A and B */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-amber-400">{item.material_a.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {item.material_a.cpse_code}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] line-clamp-2">{item.material_a.description}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-amber-400">{item.material_b.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {item.material_b.cpse_code}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] line-clamp-2">{item.material_b.description}</p>
                    </div>
                  </div>

                  {/* AI Scores and Explanation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">
                        AI Proposal:{" "}
                        <strong className="text-emerald-400 font-semibold">{item.relationship_type}</strong>
                      </span>
                      <span className="text-slate-400">
                        Confidence:{" "}
                        <strong className="text-white font-mono">{(item.final_score * 100).toFixed(1)}%</strong>
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] truncate max-w-md italic">{item.explanation}</span>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {queueTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      const p = queuePage - 1;
                      setQueuePage(p);
                      loadReviewQueue(p, queueStatusFilter, queueRelFilter);
                    }}
                    disabled={queuePage <= 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <span className="text-xs text-slate-400">
                    Page <span className="text-white font-semibold">{queuePage}</span> of{" "}
                    <span className="text-white font-semibold">{queueTotalPages}</span>
                  </span>
                  <button
                    onClick={() => {
                      const p = queuePage + 1;
                      setQueuePage(p);
                      loadReviewQueue(p, queueStatusFilter, queueRelFilter);
                    }}
                    disabled={queuePage >= queueTotalPages}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs disabled:opacity-40 transition"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATERIAL DNA STUDIO */}
      {activeTab === "DNA" && (
        <div id="dna" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Material DNA Extraction Studio</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Decomposed technical attributes, physical units, and canonical engineering strings
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchNormalize}
                disabled={batchNormalizing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <RefreshCw className={`w-3 h-3 ${batchNormalizing ? "animate-spin" : ""}`} />
                <span>Normalize Catalog</span>
              </button>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setMatsPage(1);
                  loadMaterials(1, "", e.target.value);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">All Statuses</option>
                <option value="NORMALIZED">NORMALIZED</option>
                <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
                <option value="RAW">RAW</option>
              </select>
            </div>
          </div>

          {matsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-slate-800/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !materials || materials.items.length === 0 ? (
            <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <Cpu className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-300">No materials found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400">{item.material_code}</span>
                      <span className="text-[11px] font-semibold text-sky-400">[{item.material_type || "OTHER"}]</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.cpse_code || "CPSE"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInspect(item.id)}
                        disabled={inspectLoading}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-slate-700 text-xs font-medium transition"
                      >
                        Inspect DNA
                      </button>
                      {item.normalization_status === "NORMALIZED" && (
                        <button
                          onClick={() => handleOpenMatches(item.id, item.material_code)}
                          className="px-2.5 py-1 rounded bg-violet-950/70 hover:bg-violet-900 text-violet-300 hover:text-white border border-violet-800/70 text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <Search className="w-3 h-3" /> Find Matches
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Raw CPSE Description:
                      </span>
                      <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-slate-300 text-[11px] border border-slate-800 truncate">
                        {item.raw_description}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Canonical Description:
                      </span>
                      <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-emerald-300 text-[11px] border border-slate-800 truncate">
                        {item.canonical_description || "Pending normalization"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECENT DECISION HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Decision Audit History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent log of expert decisions recorded in review_actions and audit_logs
            </p>
          </div>

          {!expertMetrics?.recent_reviews || expertMetrics.recent_reviews.length === 0 ? (
            <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-sm font-semibold text-slate-300">No Review Actions Recorded Yet</p>
              <p className="text-xs text-slate-500 mt-1">Actions taken on the review queue will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expertMetrics.recent_reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        rev.action === "APPROVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : rev.action === "REJECT"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {rev.action}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        Match #{rev.match_id}{" "}
                        {rev.new_relationship && (
                          <span className="text-slate-400 font-normal">→ {rev.new_relationship}</span>
                        )}
                      </p>
                      {rev.comment && <p className="text-[11px] text-slate-400 mt-0.5 italic">&quot;{rev.comment}&quot;</p>}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 font-mono">
                    <div>{rev.reviewer_email}</div>
                    <div>{new Date(rev.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Decision Modal */}
      <ReviewDecisionModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedQueueItem(null);
        }}
        token={token || ""}
        item={selectedQueueItem}
        onSuccess={() => {
          loadReviewQueue(queuePage, queueStatusFilter, queueRelFilter);
          loadExpertMetrics();
        }}
      />

      {/* Side by side comparison modal */}
      <SideBySideComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => {
          setComparisonModalOpen(false);
          setComparisonMatchId(null);
        }}
        token={token || ""}
        matchId={comparisonMatchId}
      />

      {/* Material Details Modal */}
      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          token={token}
          onClose={() => setSelectedMaterial(null)}
          onMaterialUpdated={(updated) => {
            setSelectedMaterial(updated);
            loadMaterials(matsPage, matsSearch, statusFilter);
          }}
        />
      )}

      {/* Material Match Modal */}
      <MaterialMatchModal
        isOpen={matchModalOpen}
        onClose={() => {
          setMatchModalOpen(false);
          setMatchMaterialId(null);
        }}
        token={token || ""}
        materialId={matchMaterialId}
        materialCode={matchMaterialCode}
      />
    </div>
  );
}
