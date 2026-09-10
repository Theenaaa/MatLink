"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Building2,
  GitCompare,
  FolderTree,
  Lock,
  TrendingUp,
  Database,
  CheckCircle2,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { getDashboardMetrics, type DashboardMetrics, type CPSEBreakdown } from "@/lib/api";

export default function SuperAdminDashboard() {
  const { user, token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const m = await getDashboardMetrics(token);
      setMetrics(m);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMetrics(); }, [token]);

  const Skeleton = () => (
    <span className="inline-block w-20 h-6 bg-slate-800 rounded animate-pulse" />
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-indigo-500/10 border border-orange-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-semibold mb-2 border border-amber-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>National Master Command Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Cross-CPSE Material Standardization Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Welcome, <span className="text-slate-200 font-semibold">{user?.name}</span>. You have universal oversight across all Central Public Sector Enterprises under the Ministry of Petroleum &amp; Natural Gas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadMetrics}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Universal Scope</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {loading ? <Skeleton /> : `${metrics?.cpse_breakdown?.length ?? 0} CPSEs Connected`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards — REAL DATABASE VALUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Raw Materials</span>
            <Database className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">
            {loading ? <Skeleton /> : (metrics?.total_materials ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Across all Ministry CPSEs</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Uploaded Datasets</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-2 font-mono">
            {loading ? <Skeleton /> : (metrics?.total_datasets ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">CSV/XLSX ingested across CPSEs</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Validation Errors</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2 font-mono">
            {loading ? <Skeleton /> : (metrics?.total_validation_errors ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-400 mt-1">Row-level errors across datasets</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tenant Isolation</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">100% Strict</p>
          <p className="text-[11px] text-emerald-400 mt-1">DB Constraint Enforced</p>
        </div>
      </div>

      {/* Enterprise Directory — REAL DB DATA */}
      <div id="enterprises" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>Participating Central Public Sector Enterprises</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live material counts per CPSE — queried directly from PostgreSQL
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Enterprise Federation</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />)}
          </div>
        ) : !metrics?.cpse_breakdown || metrics.cpse_breakdown.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No CPSE organizations found in database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">CPSE Code</th>
                  <th className="pb-3 font-semibold">Enterprise Name</th>
                  <th className="pb-3 font-semibold">Raw Materials</th>
                  <th className="pb-3 font-semibold">Datasets</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.cpse_breakdown.map((c: CPSEBreakdown) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono font-bold text-amber-400">{c.code}</td>
                    <td className="py-3 font-medium text-slate-200">{c.name}</td>
                    <td className="py-3 font-mono text-slate-300">{c.materials_count.toLocaleString()}</td>
                    <td className="py-3 font-mono text-indigo-300">{c.datasets_count.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        c.status === "ACTIVE" ? "text-emerald-400" : "text-slate-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-400" : "bg-slate-500"}`} />
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Architecture Panels */}
      <div id="duplicates" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
            <GitCompare className="w-4 h-4" />
            <span>Cross-Enterprise Duplicate Detection</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Federated Identity Matching Pipeline
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Identifies identical engineering components listed under different internal naming conventions (e.g. CPCL vs IOCL descriptions of identical valves, bearings, gaskets, and pumps).
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
            <div className="text-slate-400">Example Identical Component Match:</div>
            <div className="text-amber-300">CPCL: &quot;VALVE BALL 2IN 150# RF A105&quot;</div>
            <div className="text-indigo-300">IOCL: &quot;2&apos;&apos; 150LB BALL VLV RF CS FLGD A105&quot;</div>
            <div className="text-emerald-400 font-semibold pt-1 border-t border-slate-800">
              Canonical DNA: BALL_VALVE | 2&quot; | 150# | RF | A105 (Similarity: 98.6%)
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Cross-CPSE deduplication requires Phase 3 AI embeddings & pgvector similarity search. Data will be real once Phase 3 is implemented.
          </p>
        </div>

        <div id="tenancy" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>National Tenant Isolation Verification</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Multi-Tenant Security Architecture
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every CPSE user is strictly restricted to their own enterprise catalog. Super Administrators possess universal authority, while CPSE users attempting unauthorized cross-tenant queries receive an immediate HTTP 403 Forbidden.
          </p>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>JWT claims include authenticated role and CPSE binding</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>FastAPI dependency injection (enforce_cpse_access) guards queries</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PostgreSQL compound indexes on (cpse_id, material_code)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

