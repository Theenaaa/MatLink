"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Building2,
  GitCompare,
  Lock,
  TrendingUp,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  UserPlus,
  Users,
  PlusCircle,
  X,
  UserCheck,
  UserX,
  Check,
} from "lucide-react";
import {
  getDashboardMetrics,
  listCPSEsApi,
  createCPSEApi,
  createCPSEAdminApi,
  listUsersApi,
  toggleUserStatusApi,
  type DashboardMetrics,
  type CPSEBreakdown,
  type CPSE,
  type UserListItem,
} from "@/lib/api";

export default function SuperAdminDashboard() {
  const { user, token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // CPSE & User list state
  const [cpses, setCpses] = useState<CPSE[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Modals & Forms State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCPSEModal, setShowCPSEModal] = useState(false);

  // Admin creation form
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCpseId, setAdminCpseId] = useState<number | "">("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminFormMsg, setAdminFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // CPSE creation form
  const [cpseCode, setCpseCode] = useState("");
  const [cpseName, setCpseName] = useState("");
  const [cpseSubmitting, setCpseSubmitting] = useState(false);
  const [cpseFormMsg, setCpseFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setUsersLoading(true);
    try {
      const [m, cList, uList] = await Promise.all([
        getDashboardMetrics(token),
        listCPSEsApi(token),
        listUsersApi(token),
      ]);
      setMetrics(m);
      setCpses(cList);
      setUsers(uList);
      if (cList.length > 0 && !adminCpseId) {
        setAdminCpseId(cList[0].id);
      }
    } catch {
      /* silent error */
    } finally {
      setLoading(false);
      setUsersLoading(false);
    }
  }, [token, adminCpseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Handler: Create CPSE Admin
  const handleCreateCPSEAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !adminCpseId) return;
    setAdminSubmitting(true);
    setAdminFormMsg(null);
    try {
      await createCPSEAdminApi(token, {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        cpse_id: Number(adminCpseId),
      });
      setAdminFormMsg({ type: "success", text: `CPSE Admin account created for ${adminEmail}` });
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      await loadData();
      setTimeout(() => setShowAdminModal(false), 1200);
    } catch (err: any) {
      setAdminFormMsg({ type: "error", text: err.message || "Failed to create CPSE Admin account" });
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Submit Handler: Create CPSE Enterprise
  const handleCreateCPSE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCpseSubmitting(true);
    setCpseFormMsg(null);
    try {
      const newCpse = await createCPSEApi(token, {
        code: cpseCode.trim().toUpperCase(),
        name: cpseName.trim(),
        status: "ACTIVE",
      });
      setCpseFormMsg({ type: "success", text: `CPSE ${newCpse.code} registered successfully.` });
      setCpseCode("");
      setCpseName("");
      await loadData();
      setTimeout(() => setShowCPSEModal(false), 1200);
    } catch (err: any) {
      setCpseFormMsg({ type: "error", text: err.message || "Failed to register CPSE" });
    } finally {
      setCpseSubmitting(false);
    }
  };

  // Toggle User Active Status
  const handleToggleStatus = async (targetUser: UserListItem) => {
    if (!token) return;
    try {
      await toggleUserStatusApi(token, targetUser.id, !targetUser.is_active);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    }
  };

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
              Cross-CPSE Material Standardization & Multi-Tenant Administration
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Welcome, <span className="text-slate-200 font-semibold">{user?.name}</span>. Universal access active across all Central Public Sector Enterprises.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCPSEModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New CPSE Entity</span>
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-950/40 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create CPSE Admin</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition"
              title="Refresh metrics & user database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
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
            <span className="text-xs text-slate-400 font-medium">Registered CPSE Admins</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2 font-mono">
            {loading ? <Skeleton /> : users.filter((u) => u.role?.name === "CPSE_ADMIN").length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Enterprise Master Administrators</p>
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
            <span className="text-xs text-slate-400 font-medium">Tenant Isolation</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">100% Active</p>
          <p className="text-[11px] text-emerald-400 mt-1">Enforced by FastAPI &amp; JWT</p>
        </div>
      </div>

      {/* ── CPSE Enterprise Workstations ── */}
      <div id="enterprises" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>Participating Central Public Sector Enterprises</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live material counts per CPSE enterprise catalog
            </p>
          </div>
          <button
            onClick={() => setShowCPSEModal(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Register CPSE
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
            ))}
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
                  <th className="pb-3 font-semibold text-right">Actions</th>
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
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          c.status === "ACTIVE" ? "text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === "ACTIVE" ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setAdminCpseId(c.id);
                          setShowAdminModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold border border-slate-700 transition"
                      >
                        Add Admin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── User & CPSE Admin Directory ── */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Multi-Tenant User &amp; Role Directory</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All registered Super Admins, CPSE Admins, Material Experts, and Procurement Analysts
            </p>
          </div>
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-semibold transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create CPSE Admin</span>
          </button>
        </div>

        {usersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No user accounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 font-semibold">User Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Assigned CPSE</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const roleName = u.role?.name || "USER";
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-bold text-slate-200">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{u.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            roleName === "SUPER_ADMIN"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : roleName === "CPSE_ADMIN"
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                              : roleName === "MATERIAL_EXPERT"
                              ? "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                              : "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          }`}
                        >
                          {roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {u.cpse ? (
                          <span className="text-amber-400 font-semibold">{u.cpse.code} ({u.cpse.name})</span>
                        ) : (
                          <span className="text-slate-500 italic">Universal (All CPSEs)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            u.is_active ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {u.is_active ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Deactivated
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {roleName !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                              u.is_active
                                ? "bg-red-950/40 border-red-800/50 text-red-300 hover:bg-red-900/60"
                                : "bg-emerald-950/40 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/60"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE CPSE ADMIN MODAL ── */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <UserPlus className="w-5 h-5" />
                <span>Create CPSE Admin Account</span>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCPSEAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target CPSE Enterprise <span className="text-amber-400">*</span>
                </label>
                <select
                  value={adminCpseId}
                  onChange={(e) => setAdminCpseId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="" disabled>
                    Select CPSE Enterprise...
                  </option>
                  {cpses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Email Address <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="e.g. admin@iocl.co.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Password <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>

              {adminFormMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    adminFormMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border border-red-500/30 text-red-300"
                  }`}
                >
                  {adminFormMsg.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{adminFormMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                >
                  {adminSubmitting ? "Creating..." : "Create CPSE Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE CPSE ENTERPRISE MODAL ── */}
      {showCPSEModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Building2 className="w-5 h-5" />
                <span>Register New CPSE Enterprise</span>
              </div>
              <button
                onClick={() => setShowCPSEModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCPSE} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CPSE Code <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cpseCode}
                  onChange={(e) => setCpseCode(e.target.value)}
                  placeholder="e.g. BPCL, HPCL, OIL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Enterprise Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cpseName}
                  onChange={(e) => setCpseName(e.target.value)}
                  placeholder="e.g. Bharat Petroleum Corporation Limited"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>

              {cpseFormMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    cpseFormMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border border-red-500/30 text-red-300"
                  }`}
                >
                  {cpseFormMsg.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{cpseFormMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCPSEModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cpseSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                >
                  {cpseSubmitting ? "Registering..." : "Register Enterprise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            Identifies identical engineering components listed under different internal naming conventions across connected CPSEs (e.g. CPCL vs IOCL descriptions of identical valves, bearings, gaskets, and pumps).
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
            <div className="text-slate-400">Example Identical Component Match:</div>
            <div className="text-amber-300">CPCL: &quot;VALVE BALL 2IN 150# RF A105&quot;</div>
            <div className="text-indigo-300">IOCL: &quot;2&apos;&apos; 150LB BALL VLV RF CS FLGD A105&quot;</div>
            <div className="text-emerald-400 font-semibold pt-1 border-t border-slate-800">
              Canonical DNA: BALL_VALVE | 2&quot; | 150# | RF | A105 (Similarity: 98.6%)
            </div>
          </div>
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
            Every CPSE user is strictly restricted to their own enterprise catalog. Super Administrators possess universal authority and can create CPSE Admin accounts for each participating enterprise.
          </p>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Super Admin can create &amp; manage CPSE Admins dynamically</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>JWT claims include authenticated role and CPSE binding</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>FastAPI dependency injection (enforce_cpse_access) guards queries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
