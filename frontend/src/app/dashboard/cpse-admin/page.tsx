"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  FileSpreadsheet,
  Cpu,
  AlertTriangle,
  Layers,
  UploadCloud,
  CheckCircle2,
  Clock,
  Database,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  XCircle,
  RefreshCw,
  ArrowDownToLine,
  Eye,
  FileCheck2,
} from "lucide-react";
import {
  getDashboardMetrics,
  uploadDatasetApi,
  importDatasetApi,
  listDatasetsApi,
  listMaterialsApi,
  getMaterialDetailApi,
  batchNormalizeMaterialsApi,
  type DashboardMetrics,
  type UploadValidationResponse,
  type UploadedFileListItem,
  type PaginatedMaterials,
  type MaterialDetailItem,
} from "@/lib/api";
import MaterialDetailModal from "@/components/MaterialDetailModal";
import MaterialMatchModal from "@/components/MaterialMatchModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

type UploadPhase = "idle" | "uploading" | "validated" | "importing" | "done" | "error";

export default function CPSEAdminDashboard() {
  const { user, token } = useAuth();
  const cpseCode = user?.cpse?.code || "CPSE";
  const cpseName = user?.cpse?.name || "Enterprise";

  // ── State ────────────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [datasets, setDatasets] = useState<UploadedFileListItem[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);

  const [materials, setMaterials] = useState<PaginatedMaterials | null>(null);
  const [matsLoading, setMatsLoading] = useState(true);
  const [matsPage, setMatsPage] = useState(1);
  const [matsSearch, setMatsSearch] = useState("");
  const [matsSearchInput, setMatsSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Normalization inspection modal state
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetailItem | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [batchNormalizing, setBatchNormalizing] = useState(false);
  const [batchNormMsg, setBatchNormMsg] = useState<string | null>(null);

  // Match candidate modal state
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchMaterialId, setMatchMaterialId] = useState<number | null>(null);
  const [matchMaterialCode, setMatchMaterialCode] = useState<string>("");

  const handleOpenMatches = (materialId: number, code?: string | null) => {
    setMatchMaterialId(materialId);
    setMatchMaterialCode(code || "");
    setMatchModalOpen(true);
  };

  // Upload state
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadValidationResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data Loading ──────────────────────────────────────────────────────────────

  const loadMetrics = useCallback(async () => {
    if (!token) return;
    setMetricsLoading(true);
    try {
      const m = await getDashboardMetrics(token);
      setMetrics(m);
    } catch { /* silent */ }
    finally { setMetricsLoading(false); }
  }, [token]);

  const loadDatasets = useCallback(async () => {
    if (!token) return;
    setDatasetsLoading(true);
    try {
      const d = await listDatasetsApi(token);
      setDatasets(d);
    } catch { /* silent */ }
    finally { setDatasetsLoading(false); }
  }, [token]);

  const loadMaterials = useCallback(async (page = 1, q = "", status = "", matType = "") => {
    if (!token) return;
    setMatsLoading(true);
    try {
      const m = await listMaterialsApi(token, {
        page,
        page_size: 15,
        q: q || undefined,
        normalization_status: status || undefined,
        material_type: matType || undefined,
      });
      setMaterials(m);
    } catch { /* silent */ }
    finally { setMatsLoading(false); }
  }, [token]);

  useEffect(() => {
    loadMetrics();
    loadDatasets();
    loadMaterials(1, "", statusFilter, typeFilter);
  }, [loadMetrics, loadDatasets, loadMaterials, statusFilter, typeFilter]);

  const handleInspectMaterial = async (materialId: number) => {
    if (!token) return;
    setInspectLoading(true);
    try {
      const detail = await getMaterialDetailApi(token, materialId);
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
    setBatchNormMsg(null);
    try {
      const res = await batchNormalizeMaterialsApi(token);
      setBatchNormMsg(res.message);
      await Promise.all([
        loadMetrics(),
        loadMaterials(matsPage, matsSearch, statusFilter, typeFilter),
      ]);
    } catch (err: any) {
      alert(err.message || "Batch normalization failed");
    } finally {
      setBatchNormalizing(false);
    }
  };

  // ── File Upload ────────────────────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    if (!token) return;
    setUploadPhase("uploading");
    setUploadError(null);
    setUploadResult(null);
    setImportMessage(null);
    try {
      const result = await uploadDatasetApi(token, file);
      setUploadResult(result);
      setUploadPhase("validated");
    } catch (e: any) {
      setUploadError(e.message || "Upload failed");
      setUploadPhase("error");
    }
  };

  const handleImport = async () => {
    if (!token || !uploadResult) return;
    setUploadPhase("importing");
    try {
      const res = await importDatasetApi(token, uploadResult.file_id);
      setImportMessage(res.message);
      setUploadPhase("done");
      // Refresh all panels
      await Promise.all([loadMetrics(), loadDatasets(), loadMaterials(1, matsSearch)]);
    } catch (e: any) {
      setUploadError(e.message || "Import failed");
      setUploadPhase("error");
    }
  };

  const resetUpload = () => {
    setUploadPhase("idle");
    setUploadResult(null);
    setUploadError(null);
    setImportMessage(null);
  };

  // Drag & drop
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileUpload(f);
  };

  // Search debounce
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (v: string) => {
    setMatsSearchInput(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setMatsSearch(v);
      setMatsPage(1);
      loadMaterials(1, v);
    }, 400);
  };

  const handlePageChange = (p: number) => {
    setMatsPage(p);
    loadMaterials(p, matsSearch);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const statCard = (label: string, value: string | number, sub: string, color: string, Icon: React.ElementType) => (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-black mt-2 font-mono ${color}`}>
        {metricsLoading ? <span className="inline-block w-16 h-6 bg-slate-800 rounded animate-pulse" /> : value}
      </p>
      <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enterprise Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-slate-900 border border-blue-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-semibold mb-2 border border-blue-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>Enterprise Catalog Administration</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {cpseName} ({cpseCode})
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> ({user?.email}). Authorized administrator for {cpseCode} material catalog ingestion, job management, and data sanitation.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tenant Isolation</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center justify-end gap-1 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Strictly {cpseCode} Bound</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCard("Enterprise Catalog Size", (metrics?.total_materials ?? 0).toLocaleString(), "Raw material records ingested", "text-white", Layers)}
        {statCard("Uploaded Datasets", (metrics?.total_datasets ?? 0).toLocaleString(), "CSV / XLSX files processed", "text-indigo-300", FileSpreadsheet)}
        {statCard("Validation Errors", (metrics?.total_validation_errors ?? 0).toLocaleString(), "Row-level errors across datasets", "text-amber-300", AlertTriangle)}
        {statCard("Processing Jobs", (metrics?.total_processing_jobs ?? 0).toLocaleString(), "Ingestion pipeline executions", "text-sky-300", Cpu)}
      </div>

      {/* ── Upload Portal ── */}
      <div id="ingestion" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Batch Ingestion Portal (CSV / XLSX)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Tenant: <span className="text-amber-400 font-semibold">{cpseCode}</span> · Deterministic CPSE binding — no CPSE column required in file
            </p>
          </div>
          {uploadPhase !== "idle" && (
            <button
              onClick={resetUpload}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> New Upload
            </button>
          )}
        </div>

        {/* Drop Zone */}
        {uploadPhase === "idle" && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              dragOver ? "border-blue-400/70 bg-blue-500/5" : "border-slate-800 hover:border-blue-500/40 bg-slate-950/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
            />
            <UploadCloud className="w-10 h-10 text-blue-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-white">Drag & drop or click to select dataset</h3>
            <p className="text-xs text-slate-400 mt-1">Supports .csv, .xlsx, .xls — Max 50 MB</p>
            <p className="text-[11px] text-slate-500 mt-2">Expected columns: Material Code, Description, UOM, Order Qty (flexible mapping)</p>
          </div>
        )}

        {/* Uploading Spinner */}
        {uploadPhase === "uploading" && (
          <div className="border border-slate-800 rounded-xl p-8 text-center bg-slate-950/60">
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-medium">Uploading & running 11-rule validation...</p>
          </div>
        )}

        {/* Validation Result */}
        {(uploadPhase === "validated" || uploadPhase === "importing") && uploadResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Rows", value: uploadResult.total_rows, color: "text-white" },
                { label: "Valid Rows", value: uploadResult.valid_rows, color: "text-emerald-400" },
                { label: "Invalid Rows", value: uploadResult.invalid_rows, color: "text-amber-400" },
                { label: "CPSE Bound", value: uploadResult.cpse_code, color: "text-sky-400" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <p className={`text-xl font-black font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Preview rows */}
            {uploadResult.preview_valid_rows.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Preview (first {uploadResult.preview_valid_rows.length} valid rows)</p>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="px-3 py-2 text-left">Row #</th>
                        <th className="px-3 py-2 text-left">Material Code</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-left">Qty</th>
                        <th className="px-3 py-2 text-left">UOM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {uploadResult.preview_valid_rows.map((r) => (
                        <tr key={r.source_row_number} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2 font-mono text-slate-400">{r.source_row_number}</td>
                          <td className="px-3 py-2 font-mono text-sky-300">{r.material_code || "—"}</td>
                          <td className="px-3 py-2 text-slate-200 max-w-xs truncate">{r.raw_description || "—"}</td>
                          <td className="px-3 py-2 font-mono text-slate-300">{r.order_qty ?? "—"}</td>
                          <td className="px-3 py-2 font-mono text-slate-300">{r.uom || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Validation Errors from Upload */}
            {uploadResult.errors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {uploadResult.errors.length} row-level errors detected
                </p>
                <div className="overflow-x-auto rounded-lg border border-amber-900/30 max-h-48">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Field</th>
                        <th className="px-3 py-2 text-left">Raw Value</th>
                        <th className="px-3 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {uploadResult.errors.map((e) => (
                        <tr key={e.id} className="hover:bg-amber-900/10">
                          <td className="px-3 py-2 font-mono text-amber-400">{e.row_number}</td>
                          <td className="px-3 py-2 font-mono text-slate-300">{e.field_name}</td>
                          <td className="px-3 py-2 font-mono text-red-400">{e.raw_value || "—"}</td>
                          <td className="px-3 py-2 text-slate-300">{e.error_message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import CTA */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleImport}
                disabled={uploadPhase === "importing" || uploadResult.valid_rows === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition shadow-lg shadow-emerald-900/30"
              >
                {uploadPhase === "importing" ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</>
                ) : (
                  <><ArrowDownToLine className="w-4 h-4" /> Import {uploadResult.valid_rows} Valid Rows</>
                )}
              </button>
              <span className="text-xs text-slate-400">
                {uploadResult.invalid_rows > 0 && `${uploadResult.invalid_rows} invalid rows will be skipped`}
              </span>
            </div>
          </div>
        )}

        {/* Done */}
        {uploadPhase === "done" && importMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Import Successful</p>
              <p className="text-xs text-slate-400 mt-0.5">{importMessage}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {uploadPhase === "error" && uploadError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/30">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Upload / Validation Error</p>
              <p className="text-xs text-slate-400 mt-0.5">{uploadError}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Datasets Table ── */}
      <div id="catalog" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Uploaded Datasets</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All datasets bound to <span className="text-amber-400 font-semibold">{cpseCode}</span> — real-time from database
            </p>
          </div>
          <button
            onClick={loadDatasets}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${datasetsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {datasetsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No datasets uploaded yet. Use the portal above to upload your first file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">File Name</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Size</th>
                  <th className="pb-3 font-semibold">Total Rows</th>
                  <th className="pb-3 font-semibold">Valid</th>
                  <th className="pb-3 font-semibold">Errors</th>
                  <th className="pb-3 font-semibold">Uploaded At</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono text-slate-200 max-w-xs truncate">{d.file_name}</td>
                    <td className="py-3 font-mono text-slate-400 uppercase">{d.file_type}</td>
                    <td className="py-3 font-mono text-slate-400">{fmtBytes(d.file_size)}</td>
                    <td className="py-3 font-mono text-slate-300">{(d.total_rows ?? 0).toLocaleString()}</td>
                    <td className="py-3 font-mono text-emerald-400">{(d.valid_rows ?? 0).toLocaleString()}</td>
                    <td className="py-3 font-mono text-amber-400">{(d.invalid_rows ?? 0).toLocaleString()}</td>
                    <td className="py-3 text-slate-400">{fmtDate(d.uploaded_at)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        d.status === "IMPORTED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : d.status === "VALIDATED"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : d.status === "PROCESSING"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Material Explorer & Material DNA Studio ── */}
      <div id="validation" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Enterprise Material Explorer &amp; Material DNA</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {materials ? `${materials.total.toLocaleString()} records · Page ${materials.page} of ${materials.total_pages}` : "Loading..."}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBatchNormalize}
              disabled={batchNormalizing || !materials || materials.total === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-sm"
              title="Run deterministic normalization on all catalog records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${batchNormalizing ? "animate-spin" : ""}`} />
              <span>{batchNormalizing ? "Normalizing..." : "Batch Normalize Catalog"}</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={matsSearchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search code, raw or canonical description..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMatsPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 transition"
            >
              <option value="">All Normalization Statuses</option>
              <option value="NORMALIZED">NORMALIZED</option>
              <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
              <option value="RAW">RAW (Unprocessed)</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setMatsPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-sky-500/50 transition"
            >
              <option value="">All Material Types</option>
              <option value="PIPE">PIPE</option>
              <option value="VALVE">VALVE</option>
              <option value="FLANGE">FLANGE</option>
              <option value="ELBOW">ELBOW</option>
              <option value="TEE">TEE</option>
              <option value="REDUCER">REDUCER</option>
              <option value="GASKET">GASKET</option>
              <option value="BOLT">BOLT / FASTENER</option>
              <option value="NUT">NUT</option>
              <option value="PUMP">PUMP</option>
              <option value="MOTOR">MOTOR</option>
              <option value="BEARING">BEARING</option>
              <option value="CABLE">CABLE</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </div>

        {batchNormMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <span>{batchNormMsg}</span>
            <button onClick={() => setBatchNormMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {matsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !materials || materials.items.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Database className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {matsSearch || statusFilter || typeFilter
                ? "No materials matching the selected filters."
                : "No materials in catalog yet. Upload and import a dataset first."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-left">Material Code</th>
                    <th className="px-3 py-2.5 text-left">Raw Description (Source Truth)</th>
                    <th className="px-3 py-2.5 text-left">Canonical Description</th>
                    <th className="px-3 py-2.5 text-left">DNA Status</th>
                    <th className="px-3 py-2.5 text-left">Type</th>
                    <th className="px-3 py-2.5 text-left">Qty / UOM</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {materials.items.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition group">
                      <td className="px-3 py-2.5 font-mono text-sky-300 font-bold whitespace-nowrap">
                        {m.material_code || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-200 max-w-xs truncate" title={m.raw_description || ""}>
                        {m.raw_description || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-emerald-300 font-mono text-[11px] max-w-xs truncate" title={m.canonical_description || ""}>
                        {m.canonical_description || <span className="text-slate-500 italic">Not normalized</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            m.normalization_status === "NORMALIZED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : m.normalization_status === "REVIEW_REQUIRED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : m.normalization_status === "FAILED"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {m.normalization_status || "RAW"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-indigo-300">
                          {m.material_type || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">
                        {m.order_qty} {m.uom}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectMaterial(m.id)}
                            disabled={inspectLoading}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 text-[11px] font-medium transition"
                          >
                            Inspect DNA
                          </button>
                          {m.normalization_status === "NORMALIZED" && (
                            <button
                              onClick={() => handleOpenMatches(m.id, m.material_code)}
                              className="px-2.5 py-1 rounded bg-violet-950/60 hover:bg-violet-900/80 text-violet-300 hover:text-white border border-violet-800/60 text-[11px] font-medium transition flex items-center gap-1"
                              title="Find AI Semantic Matches"
                            >
                              <Search className="w-3 h-3" />
                              Matches
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {materials.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => handlePageChange(matsPage - 1)}
                  disabled={matsPage <= 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page <span className="text-white font-semibold">{materials.page}</span> of{" "}
                  <span className="text-white font-semibold">{materials.total_pages}</span>
                  <span className="mx-2 text-slate-600">·</span>
                  {materials.total.toLocaleString()} total items
                </span>
                <button
                  onClick={() => handlePageChange(matsPage + 1)}
                  disabled={matsPage >= materials.total_pages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Material Details / DNA Inspection Modal */}
      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          token={token}
          onClose={() => setSelectedMaterial(null)}
          onMaterialUpdated={(updated) => {
            setSelectedMaterial(updated);
            loadMaterials(matsPage, matsSearch, statusFilter, typeFilter);
            loadMetrics();
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


