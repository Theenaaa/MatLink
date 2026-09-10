"use client";

import React, { useState } from "react";
import { useAuth, getRoleDashboardPath } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building2,
  Lock,
  Mail,
  Key,
  ArrowRight,
  Sparkles,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";

interface DemoAccount {
  label: string;
  role: string;
  cpse: string;
  email: string;
  badgeColor: string;
  desc: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Super Administrator",
    role: "SUPER_ADMIN",
    cpse: "National Master Hub",
    email: "superadmin@canonix.gov.in",
    badgeColor: "from-amber-500 to-orange-600",
    desc: "Universal cross-CPSE master visibility, taxonomies & platform control",
  },
  {
    label: "CPSE Administrator",
    role: "CPSE_ADMIN",
    cpse: "CPCL (Chennai)",
    email: "admin@cpcl.co.in",
    badgeColor: "from-blue-500 to-indigo-600",
    desc: "Batch material ingestion, job scheduling & organization catalog",
  },
  {
    label: "Material Expert",
    role: "MATERIAL_EXPERT",
    cpse: "CPCL (Chennai)",
    email: "expert@cpcl.co.in",
    badgeColor: "from-emerald-500 to-teal-600",
    desc: "Technical attribute extraction, DNA standardization & regex rules",
  },
  {
    label: "Procurement Analyst",
    role: "PROCUREMENT_ANALYST",
    cpse: "CPCL (Chennai)",
    email: "analyst@cpcl.co.in",
    badgeColor: "from-purple-500 to-violet-600",
    desc: "Spend rationalization, duplicate inventory & inter-CPSE transfer radar",
  },
  {
    label: "CPSE Admin (IOCL)",
    role: "CPSE_ADMIN",
    cpse: "IOCL (Refinery)",
    email: "admin@iocl.co.in",
    badgeColor: "from-rose-500 to-red-600",
    desc: "Second CPSE tenant to test strict data boundary & isolation",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("superadmin@canonix.gov.in");
  const [password, setPassword] = useState("Canonix@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectDemo = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword("Canonix@2026");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      const targetPath = getRoleDashboardPath(user.role.name);
      router.push(targetPath);
    } catch (err: any) {
      setError(err.message || "Invalid authentication credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500/30">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Banner */}
      <header className="p-6 border-b border-slate-900 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
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
            <p className="text-xs text-slate-400">
              National CPSE Technical Federation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-orange-400 flex items-center gap-1 transition"
          >
            <span>Platform Overview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Login Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Interactive Demo Credentials / Role Selector */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise Single Sign-On</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                Enterprise Single Sign-On & RBAC Portal
              </h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                CANONIX enforces enterprise data security and Role-Based Access Control.
                Select any verified role below to auto-fill credentials:
              </p>
            </div>

            {/* Demo Account Cards */}
            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-slate-900 border-orange-500/60 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/30"
                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${acc.badgeColor} flex items-center justify-center shrink-0 mt-0.5 shadow-md`}>
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {acc.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 border border-slate-700">
                          {acc.cpse}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {acc.desc}
                      </p>
                      <div className="text-[10px] font-mono text-orange-400/80 mt-1">
                        {acc.email}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Login Form Card */}
          <div className="lg:col-span-6">
            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure Authentication</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Log in to your Workstation
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your enterprise credentials to access your authorized CPSE workspace.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enterprise Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.gov.in"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/80 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Default: <code className="text-orange-400/90 font-mono">Canonix@2026</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/80 transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-600 to-indigo-600 text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Authenticating Credentials...
                      </span>
                    ) : (
                      <>
                        <span>Authenticate & Access Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-bit SSL Encrypted</span>
                </div>
                <div>Enterprise RBAC Protected</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-900 text-center text-xs text-slate-400 relative z-10">
        CANONIX Platform · Government of India · All Rights Reserved
      </footer>
    </div>
  );
}
