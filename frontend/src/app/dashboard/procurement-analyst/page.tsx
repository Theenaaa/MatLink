"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  GitCompare,
  TrendingDown,
  RefreshCw,
  Sliders,
  DollarSign,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function ProcurementAnalystDashboard() {
  const { user } = useAuth();
  const cpseCode = user?.cpse?.code || "CPCL";

  const duplicateOpportunities = [
    {
      canonical: "BALL VALVE 2IN 150# RF A105 LEVER OP",
      cpseA: { cpse: "CPCL", code: "CPCL-4812", unitPrice: "₹14,500", stock: 45 },
      cpseB: { cpse: "IOCL", code: "IOCL-9921", unitPrice: "₹18,200", stock: 12 },
      diff: "20.3% Cost Variance",
      opportunity: "Inter-CPSE Bulk Procurement & Stock Sharing",
      potentialSaving: "₹1.85 Lakhs",
    },
    {
      canonical: "SPIRAL WOUND GASKET 3IN 300# 316L/GRAPHITE",
      cpseA: { cpse: "CPCL", code: "CPCL-5923", unitPrice: "₹950", stock: 120 },
      cpseB: { cpse: "ONGC", code: "ONGC-3310", unitPrice: "₹1,320", stock: 240 },
      diff: "28.0% Cost Variance",
      opportunity: "Framework Agreement Harmonization",
      potentialSaving: "₹1.33 Lakhs",
    },
    {
      canonical: "CENTRIFUGAL PUMP IMPELLER SS316 250MM",
      cpseA: { cpse: "CPCL", code: "CPCL-8830", unitPrice: "₹62,000", stock: 8 },
      cpseB: { cpse: "GAIL", code: "GAIL-1045", unitPrice: "₹79,500", stock: 3 },
      diff: "22.0% Cost Variance",
      opportunity: "Emergency Spares Mutual Sharing",
      potentialSaving: "₹1.75 Lakhs",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-slate-900 border border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[11px] font-semibold mb-2 border border-purple-500/30">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Procurement & Duplication Intelligence</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Spend Rationalization & Sourcing Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> · Strategic analyst for <span className="text-purple-400 font-semibold">{cpseCode}</span>. Identifying identical materials procured under varying tariffs, inventory dead-stock, and bulk pooling synergies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Rationalization</span>
              <span className="text-sm font-bold text-amber-400 font-mono">₹4.93 Lakhs / 3 items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Duplicate SKUs Identified</span>
            <GitCompare className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">1,480 Pairs</p>
          <p className="text-[11px] text-purple-400 mt-1">Across CPCL & IOCL</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Inter-CPSE Transfers</span>
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">42 Potential</p>
          <p className="text-[11px] text-slate-400 mt-1">Reduces idle inventory</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Average Price Variance</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2 font-mono">23.4%</p>
          <p className="text-[11px] text-amber-400 mt-1">For identical specifications</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Matching Weights Model</span>
            <Sliders className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-2 font-mono">Hybrid</p>
          <p className="text-[11px] text-slate-400 mt-1">40% S + 30% A + 20% R + 10% C</p>
        </div>
      </div>

      {/* Duplicate Opportunities Radar */}
      <div id="duplicates" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-400" />
              <span>Cross-Enterprise Duplicate Material Radar</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identical materials procured by multiple CPSEs with significant cost deviations
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400">Procurement Intelligence</span>
        </div>

        <div className="space-y-3">
          {duplicateOpportunities.map((dup, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Canonical Component Identity:
                  </span>
                  <span className="font-mono font-bold text-xs text-white">
                    {dup.canonical}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Potential Savings
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {dup.potentialSaving}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">{dup.cpseA.cpse} ({dup.cpseA.code})</span>
                    <span className="font-bold text-slate-200 font-mono">{dup.cpseA.unitPrice}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Stock: {dup.cpseA.stock} units</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">{dup.cpseB.cpse} ({dup.cpseB.code})</span>
                    <span className="font-bold text-amber-300 font-mono">{dup.cpseB.unitPrice}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Stock: {dup.cpseB.stock} units</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-amber-400 font-mono text-[11px]">
                  ⚡ {dup.diff} · {dup.opportunity}
                </span>
                <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition">
                  <span>Create Pooling Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
