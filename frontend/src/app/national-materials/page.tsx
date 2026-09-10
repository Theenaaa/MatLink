"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Database,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import {
  listNationalMaterialsApi,
  createNationalMaterialDirectApi,
  type NationalMaterialListItem,
} from "@/lib/api";

export default function NationalMaterialsDirectoryPage() {
  const { user, token } = useAuth();

  const [items, setItems] = useState<NationalMaterialListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("VALVE");
  const [newGroup, setNewGroup] = useState("VALVES");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canCreateDirect =
    user?.role?.name === "SUPER_ADMIN" || user?.role?.name === "MATERIAL_EXPERT";

  const loadData = useCallback(
    async (p = 1, q = "", st = "", tp = "") => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await listNationalMaterialsApi(token, {
          page: p,
          page_size: 15,
          q: q || undefined,
          status: st || undefined,
          material_type: tp || undefined,
        });
        setItems(res.items);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.total_pages);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadData(1, search, statusFilter, typeFilter);
  }, [loadData, search, statusFilter, typeFilter]);

  const handleCreateDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newDesc.trim()) {
      setCreateError("Canonical standard description is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createNationalMaterialDirectApi(token, {
        canonical_description: newDesc.trim(),
        material_type: newType,
        material_group: newGroup,
        material_dna: { type: newType },
      });
      setCreateModalOpen(false);
      setNewDesc("");
      loadData(1, search, statusFilter, typeFilter);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create National Material.");
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" /> PENDING
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-slate-900 border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-2 border border-emerald-500/30">
              <Database className="w-3.5 h-3.5" />
              <span>National Material Standardization Registry (SIH 26099)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              National Material Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Official catalog of canonical National Material Identities (<span className="font-mono text-emerald-400">NM-XXXXXX</span>).
              Provides unified cross-CPSE procurement visibility, technical DNA, and complete audit lineage to legacy materials.
            </p>
          </div>

          {canCreateDirect && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New National Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by NM Code, canonical description, type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Material Types</option>
            <option value="VALVE">VALVE</option>
            <option value="PIPE">PIPE</option>
            <option value="PUMP">PUMP</option>
            <option value="FLANGE">FLANGE</option>
            <option value="GASKET">GASKET</option>
            <option value="FITTING">FITTING</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
            <p className="text-base font-bold text-slate-300">No National Materials Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              National Materials are created by Material Experts after validating AI candidate matches.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">National Code</th>
                  <th className="py-3.5 px-4">Canonical Description</th>
                  <th className="py-3.5 px-4">Type / Group</th>
                  <th className="py-3.5 px-4">Mapped Legacy Items</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850/40 transition group">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {item.national_material_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200 max-w-md truncate">
                      {item.canonical_description}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {item.material_type}
                        </span>
                        <span className="text-slate-500 text-[10px]">{item.material_group}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-white">{item.mapped_count}</span> CPSE items
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`/national-materials/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white border border-slate-700 font-medium transition"
                      >
                        <span>View Master</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
            <button
              onClick={() => {
                const p = page - 1;
                setPage(p);
                loadData(p, search, statusFilter, typeFilter);
              }}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs text-slate-400">
              Page <span className="text-white font-semibold">{page}</span> of{" "}
              <span className="text-white font-semibold">{totalPages}</span> ({total} total)
            </span>
            <button
              onClick={() => {
                const p = page + 1;
                setPage(p);
                loadData(p, search, statusFilter, typeFilter);
              }}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs disabled:opacity-40 transition"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Direct Creation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create National Material Identity</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirect} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Canonical Standard Description *
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. CARBON STEEL BALL VALVE 2 INCH CLASS 150 FLANGED"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Material Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="VALVE">VALVE</option>
                    <option value="PIPE">PIPE</option>
                    <option value="PUMP">PUMP</option>
                    <option value="FLANGE">FLANGE</option>
                    <option value="GASKET">GASKET</option>
                    <option value="FITTING">FITTING</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Material Group</label>
                  <input
                    type="text"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="VALVES, PIPING, etc."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {createError && (
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-300">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create Identity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
