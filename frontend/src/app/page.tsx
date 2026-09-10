"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  GitMerge,
  Building2,
  Boxes,
  UserCheck,
  Search,
  ChevronDown,
  BookOpen,
  BarChart3,
  Globe,
  ArrowUpRight,
  Award,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Zap,
  Tag
} from "lucide-react";

// ── Ashoka Chakra & Government Emblem ─────────────────────────────
const SPOKES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  return {
    x2: 20 + 12 * Math.cos(angle),
    y2: 20 + 12 * Math.sin(angle),
  };
});

function GovtEmblem({ size = 44 }: { size?: number }) {
  return (
    <div
      aria-label="Government of India Emblem"
      style={{ width: size, height: size }}
      className="rounded-full border border-amber-600/30 bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-0.5"
    >
      <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="17" stroke="#854d0e" strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="20" r="3" fill="#854d0e" />
        {SPOKES.map((spoke, i) => (
          <line
            key={i}
            x1="20"
            y1="20"
            x2={spoke.x2}
            y2={spoke.y2}
            stroke="#854d0e"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        ))}
        <rect x="9" y="33" width="22" height="2" rx="1" fill="#854d0e" />
        <text x="20" y="31" textAnchor="middle" fill="#854d0e" fontSize="5" fontWeight="bold">🦁</text>
      </svg>
    </div>
  );
}

// ── CPSE Logos (Custom SVG Components) ────────────────────────────
function CPCLSvg() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#cpcl-grad)" />
      <path d="M14 34L24 12L34 34H14Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="24" cy="25" r="4" fill="#fbbf24" />
      <path d="M20 34V38M28 34V38" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="cpcl-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d97706" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IOCLSvg() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#iocl-grad)" />
      <circle cx="24" cy="24" r="14" stroke="white" strokeWidth="2.5" />
      <path d="M24 14C24 14 18 22 18 26C18 29.3137 20.6863 32 24 32C27.3137 32 30 29.3137 30 26C30 22 24 14 24 14Z" fill="#ffedd5" stroke="#ea580c" strokeWidth="1.5" />
      <defs>
        <linearGradient id="iocl-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ea580c" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ONGCSvg() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#ongc-grad)" />
      <path d="M24 10V38M14 24H34M17 17L31 31M31 17L17 31" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="6" fill="#fecdd3" />
      <defs>
        <linearGradient id="ongc-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e11d48" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function GAILSvg() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#gail-grad)" />
      <path d="M12 30C18 20 30 20 36 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 22C20 14 28 14 34 22" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="32" r="3" fill="#a7f3d0" />
      <defs>
        <linearGradient id="gail-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BPCLSvg() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#bpcl-grad)" />
      <circle cx="24" cy="24" r="13" stroke="#fef08a" strokeWidth="2.5" />
      <path d="M24 16L27 22H21L24 16Z" fill="#fef08a" />
      <path d="M24 32L21 26H27L24 32Z" fill="#fef08a" />
      <circle cx="24" cy="24" r="3" fill="white" />
      <defs>
        <linearGradient id="bpcl-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HPCLSvg() {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#hpcl-grad)" />
      <path d="M16 14V34M32 14V34M16 24H32" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="4" fill="#e0e7ff" />
      <defs>
        <linearGradient id="hpcl-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#3730a3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function HomePage() {
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── CPSE Enterprise Cards Data ─────────────────────────────────────
  const cpseList = [
    {
      code: "CPCL",
      name: "Chennai Petroleum Corporation Ltd.",
      role: "Host CPSE & Pilot Refinery",
      location: "Chennai, Tamil Nadu",
      items: "45,000+",
      normRate: "98.4%",
      accentColor: "text-amber-700 bg-amber-50 border-amber-200",
      btnColor: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20",
      logo: <CPCLSvg />,
      loginEmail: "admin@cpcl.co.in",
      roleBadge: "CPSE Admin (CPCL)",
      roleDesc: "Primary CPSE Ingestion, User Oversight & Catalog Administration",
    },
    {
      code: "IOCL",
      name: "Indian Oil Corporation Limited",
      role: "Downstream & Refineries",
      location: "New Delhi / Multi-Plant",
      items: "120,000+",
      normRate: "96.2%",
      accentColor: "text-orange-700 bg-orange-50 border-orange-200",
      btnColor: "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20",
      logo: <IOCLSvg />,
      loginEmail: "admin@iocl.co.in",
      roleBadge: "CPSE Admin (IOCL)",
      roleDesc: "Refinery Inventory Integration & Spare Interchangeability",
    },
    {
      code: "ONGC",
      name: "Oil & Natural Gas Corporation",
      role: "Upstream Exploration",
      location: "Dehradun, Uttarakhand",
      items: "85,000+",
      normRate: "95.8%",
      accentColor: "text-rose-700 bg-rose-50 border-rose-200",
      btnColor: "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white shadow-md shadow-rose-500/20",
      logo: <ONGCSvg />,
      loginEmail: "superadmin@canonix.gov.in",
      roleBadge: "Super Admin (MoPNG)",
      roleDesc: "Universal Cross-CPSE National Master & Policy Governance",
    },
    {
      code: "GAIL",
      name: "GAIL (India) Limited",
      role: "Natural Gas Transmission",
      location: "New Delhi",
      items: "38,000+",
      normRate: "97.1%",
      accentColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
      btnColor: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20",
      logo: <GAILSvg />,
      loginEmail: "analyst@cpcl.co.in",
      roleBadge: "Procurement Analyst",
      roleDesc: "Cross-CPSE Demand Aggregation & Spend Analytics",
    },
    {
      code: "BPCL",
      name: "Bharat Petroleum Corporation Ltd.",
      role: "Refining & Marketing",
      location: "Mumbai, Maharashtra",
      items: "62,000+",
      normRate: "94.9%",
      accentColor: "text-sky-700 bg-sky-50 border-sky-200",
      btnColor: "bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-md shadow-sky-500/20",
      logo: <BPCLSvg />,
      loginEmail: "expert@cpcl.co.in",
      roleBadge: "Material Expert",
      roleDesc: "Technical DNA Validation & Standardization Committee",
    },
    {
      code: "HPCL",
      name: "Hindustan Petroleum Corporation Ltd.",
      role: "Refining & Petrochemicals",
      location: "Mumbai, Maharashtra",
      items: "54,000+",
      normRate: "95.4%",
      accentColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
      btnColor: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20",
      logo: <HPCLSvg />,
      loginEmail: "admin@cpcl.co.in",
      roleBadge: "Enterprise Workstation",
      roleDesc: "Standardized Codification & Asset Protection",
    },
  ];

  const pipelineStages = [
    { name: "DETECT", desc: "Ingest legacy CPSE ERP inventories without losing raw descriptors" },
    { name: "UNDERSTAND", desc: "Extract noun, modifier, standards, grades, sizes & pressure ratings" },
    { name: "NORMALIZE", desc: "Standardize units, technical abbreviations & synonym dictionary" },
    { name: "HARMONIZE", desc: "Synthesize structured Material DNA & EAV attribute dictionary" },
    { name: "EXPLAIN", desc: "Attribute-level explainable AI similarity scoring" },
    { name: "VALIDATE", desc: "Domain expert human-in-the-loop validation & sign-off" },
    { name: "GOVERN", desc: "National Material ID assignment (NM-xxxxxx) & immutable audit trail" },
    { name: "PREVENT", desc: "Real-time Material Creation Copilot to block duplicate entry" },
    { name: "OPTIMIZE", desc: "Cross-CPSE demand aggregation & strategic bulk procurement" },
  ];

  const newsItems = [
    {
      date: "March 2026",
      tag: "Refinery Integration",
      title: "Manali Refinery Operations Ingest 45,000 Line Items into Central Engine",
      desc: "Technical operations successfully validated and mapped legacy SAP ERP material records into standardized National Material DNA format.",
    },
    {
      date: "February 2026",
      tag: "Policy Gazette",
      title: "MoPNG Directs Cross-CPSE Material Master Interchangeability",
      desc: "Official notification mandates unified codification standards across downstream CPSEs to unlock collaborative spare pooling.",
    },
    {
      date: "January 2026",
      tag: "AI Benchmark",
      title: "Domain Reviewer Committee Records 94.8% Match Consensus",
      desc: "Independent evaluation by CPCL, IOCL, and ONGC technical experts confirms high precision in automated valve and pump spare matching.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      
      {/* ── Top Government Tricolor Accent Strip ── */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#ff9933] via-white to-[#138808] z-50 sticky top-0 shadow-sm" />

      {/* ── Main Government & Enterprise Header ── */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-1.5 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Left Brand Identification */}
          <div className="flex items-center gap-3.5">
            <GovtEmblem size={44} />
            <div className="border-l border-slate-200 pl-3.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CANONIX</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold uppercase tracking-wider">
                  Enterprise Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Government of India · Ministry of Petroleum & Natural Gas
              </p>
            </div>
          </div>

          {/* Center Header Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#enterprises" className="hover:text-amber-600 transition">CPSE Directory</a>
            <a href="#pipeline" className="hover:text-amber-600 transition">AI Pipeline Workflow</a>
            <a href="#bulletins" className="hover:text-amber-600 transition">Gazette Circulars</a>
            <Link href="/national-materials" className="hover:text-amber-600 transition">National Registry</Link>
          </nav>

          {/* Right Controls & Login Action */}
          <div className="flex items-center gap-4">
            
            {/* Quick Role Login Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95"
              >
                <span>Sign In to Workstation</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${loginDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {loginDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Select Role Workstation</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link
                      href="/login?email=admin@cpcl.co.in"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 transition text-xs text-slate-700"
                    >
                      <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">CPSE Admin (CPCL)</div>
                        <div className="text-[10px] text-slate-500">Ingestion, Users & Catalog Operations</div>
                      </div>
                    </Link>
                    <Link
                      href="/login?email=superadmin@canonix.gov.in"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 transition text-xs text-slate-700"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Super Admin (MoPNG)</div>
                        <div className="text-[10px] text-slate-500">Universal Cross-CPSE Master View</div>
                      </div>
                    </Link>
                    <Link
                      href="/login?email=expert@cpcl.co.in"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 transition text-xs text-slate-700"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Material Expert</div>
                        <div className="text-[10px] text-slate-500">DNA Review & Match Approvals</div>
                      </div>
                    </Link>
                    <Link
                      href="/login?email=analyst@cpcl.co.in"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 transition text-xs text-slate-700"
                    >
                      <BarChart3 className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Procurement Analyst</div>
                        <div className="text-[10px] text-slate-500">Spend Analytics & Demand Aggregation</div>
                      </div>
                    </Link>
                  </div>
                  <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-center">
                    <Link href="/login" className="text-[11px] font-semibold text-orange-600 hover:underline">
                      Standard Sign-In Page →
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ── Hero Section (Deep Navy Gradient from Main Branch) ── */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl">
        
        {/* Animated Background Flares */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-semibold mb-6 shadow-sm backdrop-blur-md">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Government of India · National Material Master Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              National Material Master <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 bg-clip-text text-transparent">Identity & Harmonization</span> Engine
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              Standardizing, classifying, and unifying material master catalogues across CPCL, IOCL, ONGC, GAIL, BPCL, and HPCL into canonical Material DNA with explainable AI matching and complete legacy code preservation.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm transition-all shadow-xl shadow-orange-500/25 group transform hover:-translate-y-0.5"
              >
                <span>Enter Workstation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all backdrop-blur-md"
              >
                <Boxes className="w-4 h-4 text-sky-400" />
                <span>Role Dashboard</span>
              </Link>

              <Link 
                href="/national-materials"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all backdrop-blur-md"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Browse Registry</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
              </Link>
            </div>

          </div>

          {/* Key Metrics Counter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-8 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">45,000+</div>
              <div className="text-xs text-slate-300 mt-1 font-medium">Standardized Line Items</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">6 Primary</div>
              <div className="text-xs text-slate-300 mt-1 font-medium">Integrated CPSEs</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">94.8%</div>
              <div className="text-xs text-slate-300 mt-1 font-medium">Match Precision Consensus</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black text-sky-300 tracking-tight">9-Stage</div>
              <div className="text-xs text-slate-300 mt-1 font-medium">AI Pipeline Architecture</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── CPSE Enterprise Directory & Access Cards ── */}
      <section id="enterprises" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" /> Participating Public Sector Enterprises
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                CPSE Enterprise Workstation Directory
              </h2>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                Explore participating CPSE master catalogs or access enterprise workstations for Super Admin, CPSE Admin, Material Experts, and Analysts.
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-xs text-slate-500 font-mono">
              Enterprise Multi-Tenant Security Active (<span className="text-amber-700 font-bold">cpse_id</span>)
            </div>
          </div>

          {/* Interactive CPSE Cards Grid (Light Mode with Smooth Animations) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cpseList.map((cpse) => (
              <div
                key={cpse.code}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-2xl hover:border-amber-400 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Logo & Code Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                        {cpse.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-lg text-slate-900">{cpse.code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cpse.accentColor}`}>
                            {cpse.items}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{cpse.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* CPSE Name & Role */}
                  <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-amber-700 transition-colors">
                    {cpse.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-3">{cpse.role}</p>
                  
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {cpse.roleDesc}
                  </p>
                </div>

                {/* Bottom Role Action Link */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3 text-[11px] text-slate-500 font-mono">
                    <span>Harmonization Rate:</span>
                    <span className="text-emerald-600 font-bold">{cpse.normRate}</span>
                  </div>

                  <Link
                    href={`/login?email=${cpse.loginEmail}`}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${cpse.btnColor}`}
                  >
                    <span>Launch {cpse.roleBadge}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 9-Stage AI Pipeline Architecture Section ── */}
      <section id="pipeline" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
                <GitMerge className="w-3.5 h-3.5" /> End-to-End Workflow Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                9-Stage AI Pipeline & Three-Tier Data Model
              </h2>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                Standardized progression from heterogeneous CPSE ERP inventories to unified National Identity without losing legacy records.
              </p>
            </div>
            <span className="hidden sm:inline-block px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
              Raw → Normalized → Canonical DNA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelineStages.map((stage, idx) => (
              <div 
                key={stage.name}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-black text-amber-800 shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 tracking-wide">
                    {stage.name}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {stage.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── System Core Modules & Gazette Bulletins ── */}
      <section id="bulletins" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: News Circulars & Gazette Notifications */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Gazette Notifications & Technical Circulars</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Ministry directives & Technical Cell publications</p>
                </div>
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>

              <div className="space-y-4">
                {newsItems.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition">
                    <div className="flex items-center gap-3 text-xs mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                        {item.tag}
                      </span>
                      <span className="text-slate-400">{item.date}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5 hover:text-amber-700 transition cursor-pointer">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: How Do I Quick Inquiry & Search */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Quick Catalog Search</h3>
                <Search className="w-5 h-5 text-amber-600" />
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Search guidelines, taxonomy rules, or material descriptors across all CPSE catalogs.
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g. Ball Valve Class 800..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    onClick={() => alert(`Searching CANONIX repository for: "${searchQuery || 'Standard Materials'}"`)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md"
                  >
                    Search National Repository
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Algorithm Weights:</span>
                    <span className="text-slate-800 font-mono">Semantic 40% | Attr 30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Embedding:</span>
                    <span className="text-slate-800 font-mono">all-MiniLM-L6-v2 (384d)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Official Government Footer ── */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            
            {/* Col 1: Ministry Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GovtEmblem size={36} />
                <span className="font-bold text-white text-sm">CANONIX</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                National Material Code Standardization & Harmonization Platform across Central Public Sector Enterprises.
              </p>
            </div>

            {/* Col 2: Technical Cell Address */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Technical Cell Contact</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Refinery Operations Complex,<br />
                Express Highway, Manali,<br />
                Chennai - 600 068, Tamil Nadu.
              </p>
            </div>

            {/* Col 3: Direct Inquiries */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Support & Helpdesk</h4>
              <p className="text-slate-400 text-xs">
                Phone: +91 (044) 2594-4000<br />
                Email: material.master@canonix.gov.in
              </p>
            </div>

            {/* Col 4: Quick Links */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Quick Links</h4>
              <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                <Link href="/login" className="hover:text-amber-400 transition">Portal Sign-In</Link>
                <Link href="/dashboard" className="hover:text-amber-400 transition">Role Dashboard</Link>
                <Link href="/national-materials" className="hover:text-amber-400 transition">National Registry</Link>
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 Ministry of Petroleum & Natural Gas, Government of India. All rights reserved.</p>
            <p>National Material Code Standardization & Harmonization Platform</p>
          </div>

        </div>
      </footer>

    </div>
  );
}

