"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Layers,
  Database,
  Building2,
  Cpu,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  GitCompare,
  TrendingDown,
  LogOut,
  UserCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  Search,
  ExternalLink,
  RefreshCw,
  FolderTree,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export default function RoleShell({ children }: { children: React.ReactNode }) {
  const { user, logout, token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [tenantCheckLoading, setTenantCheckLoading] = useState(false);
  const [tenantCheckResult, setTenantCheckResult] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const roleName = user.role.name;
  const cpseCode = user.cpse ? user.cpse.code : "UNIVERSAL";
  const cpseFullName = user.cpse ? user.cpse.name : "MoPNG National Command";

  // Navigation based on Role
  let navItems: NavItem[] = [];

  if (roleName === "SUPER_ADMIN") {
    navItems = [
      { name: "National Command Hub", href: "/dashboard/super-admin", icon: Shield },
      { name: "National Material Registry", href: "/national-materials", icon: Database, badge: "NM-XXXXXX" },
      { name: "CPSE Enterprise Directory", href: "/dashboard/super-admin#enterprises", icon: Building2, badge: "4 Active" },
      { name: "Global Duplication Matrix", href: "/dashboard/super-admin#duplicates", icon: GitCompare, badge: "Cross-CPSE" },
      { name: "UNSPSC & MESC Ontologies", href: "/dashboard/super-admin#taxonomies", icon: FolderTree },
      { name: "Tenant Isolation Audit", href: "/dashboard/super-admin#tenancy", icon: Lock },
    ];
  } else if (roleName === "CPSE_ADMIN") {
    navItems = [
      { name: "Enterprise Overview", href: "/dashboard/cpse-admin", icon: Building2 },
      { name: "National Material Registry", href: "/national-materials", icon: Database, badge: "Registry" },
      { name: "Batch Data Ingestion", href: "/dashboard/cpse-admin#ingestion", icon: FileSpreadsheet, badge: "CSV/Excel" },
      { name: "Async Processing Jobs", href: "/dashboard/cpse-admin#jobs", icon: Cpu, badge: "Pipeline" },
      { name: "Row Validation Errors", href: "/dashboard/cpse-admin#validation", icon: AlertTriangle },
      { name: "Catalog Organization", href: "/dashboard/cpse-admin#catalog", icon: Layers },
    ];
  } else if (roleName === "MATERIAL_EXPERT") {
    navItems = [
      { name: "Expert Workstation & Queue", href: "/dashboard/material-expert", icon: Cpu },
      { name: "National Material Registry", href: "/national-materials", icon: Database, badge: "NM-XXXXXX" },
      { name: "Material DNA Inspector", href: "/dashboard/material-expert#dna", icon: Layers },
      { name: "Engineering Rules & Regex", href: "/dashboard/material-expert#rules", icon: Database },
      { name: "Canonical Review & Sign-Off", href: "/dashboard/material-expert#review", icon: CheckCircle2 },
    ];
  } else if (roleName === "PROCUREMENT_ANALYST") {
    navItems = [
      { name: "Spend & Sourcing Intelligence", href: "/dashboard/procurement-analyst", icon: BarChart3 },
      { name: "National Material Registry", href: "/national-materials", icon: Database, badge: "NM-XXXXXX" },
      { name: "Cross-Enterprise Duplicates", href: "/dashboard/procurement-analyst#duplicates", icon: GitCompare, badge: "High Impact" },
      { name: "Inter-CPSE Transfer Radar", href: "/dashboard/procurement-analyst#transfers", icon: RefreshCw },
      { name: "Procurement Rationalization", href: "/dashboard/procurement-analyst#spend", icon: TrendingDown },
    ];
  }

  // Tenant Boundary Test
  const testTenantBoundary = async (targetCpse: string) => {
    setTenantCheckLoading(true);
    setTenantCheckResult(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/auth/verify/tenant-access/${targetCpse}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTenantCheckResult(`✅ Access Permitted to ${targetCpse} (${roleName})`);
      } else {
        setTenantCheckResult(`🛡️ Blocked: ${data.detail}`);
      }
    } catch (e: any) {
      setTenantCheckResult(`⚠️ Error: ${e.message}`);
    } finally {
      setTenantCheckLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Universal Enterprise Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-white to-indigo-300">
                  CANONIX
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Enterprise Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none">
                Ministry of Petroleum & Natural Gas · CPCL
              </p>
            </div>
          </div>

          <div className="hidden lg:block h-6 w-px bg-slate-800" />

          {/* Active Tenant Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-slate-300 font-medium">Tenant Context:</span>
            <span className="text-xs font-bold text-amber-400">{cpseCode}</span>
            <span className="text-[11px] text-slate-400">({cpseFullName})</span>
          </div>
        </div>

        {/* Right Session Controls & User Profile */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Tenant Isolation Guard Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Tenant Isolated</span>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {roleName}
                </span>
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Role-Specific Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-slate-900/50 flex flex-col shrink-0 hidden md:flex">
          {/* Role Header Banner */}
          <div className="p-4 border-b border-slate-800/70">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Active Role Workspace
            </div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-orange-400" />
              {roleName.replace("_", " ")}
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {user.role.description || "Authorized enterprise workstation"}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300 px-3 py-1">
              Main Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href.split("#")[0];
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500/20 to-indigo-500/20 text-white border border-orange-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-slate-300"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Multi-Tenant Boundary Tester Widget */}
          <div className="p-3.5 m-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>RBAC Isolation Test</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-2.5">
              Verify backend tenant enforcement against another CPSE:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => testTenantBoundary("CPCL")}
                disabled={tenantCheckLoading}
                className="text-[11px] py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700 transition"
              >
                Test CPCL
              </button>
              <button
                onClick={() => testTenantBoundary("IOCL")}
                disabled={tenantCheckLoading}
                className="text-[11px] py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono border border-slate-700 transition"
              >
                Test IOCL
              </button>
            </div>
            {tenantCheckResult && (
              <div className="mt-2 text-[11px] p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono break-words leading-tight">
                {tenantCheckResult}
              </div>
            )}
          </div>

          {/* Footer build tag */}
          <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>CANONIX v1.0.0</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Online
            </span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
