"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  GitMerge,
  Building2,
  FileSpreadsheet,
  Boxes
} from "lucide-react";

interface HealthStatus {
  status: string;
  app: string;
  version: string;
  description: string;
  timestamp: string;
  matching_weights?: {
    semantic: number;
    attribute: number;
    rule: number;
    classification: number;
  };
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function checkHealth() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/health`);
        if (!res.ok) {
          throw new Error(`API returned status ${res.status}`);
        }
        const data = await res.json();
        setHealth(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to connect to CANONIX Backend API");
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, [apiUrl]);

  const pipelineStages = [
    { name: "DETECT", desc: "Ingest CPSE legacy masters without losing raw data" },
    { name: "UNDERSTAND", desc: "Parse standards, grades, sizes & pressure ratings" },
    { name: "NORMALIZE", desc: "Standardize units, abbreviations & terminology" },
    { name: "HARMONIZE", desc: "Synthesize structured Material DNA" },
    { name: "EXPLAIN", desc: "Attribute-level explainable AI recommendations" },
    { name: "VALIDATE", desc: "Domain expert human-in-the-loop review" },
    { name: "GOVERN", desc: "National Material ID mapping & immutable audit logs" },
    { name: "PREVENT", desc: "Real-time Material Creation Copilot" },
    { name: "OPTIMIZE", desc: "Cross-CPSE demand aggregation & bulk procurement" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">CANONIX</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-medium">
                  SIH 26099
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ministry of Petroleum & Natural Gas | CPCL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Backend Connectivity Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Backend API:</span>
              {loading ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  Connecting...
                </span>
              ) : health ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online (v{health.version})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Offline ({apiUrl})
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-4">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Multi-Tenant CPSE Isolation</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero Section */}
        <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-850 to-slate-900 p-8 sm:p-10 mb-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" /> Phase 2A: Authentication & RBAC Shell Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              National Material Identity & Harmonization Engine
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
              Standardizing, classifying, and unifying material master catalogues across CPCL, IOCL, BPCL, HPCL, and other CPSEs into canonical Material DNA with explainable hybrid matching and complete legacy code preservation.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a 
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/20"
              >
                Sign In to Role Workstation <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium text-sm transition-colors"
              >
                Role Dashboard
              </a>
              <a 
                href={`${apiUrl}/docs`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-medium text-sm transition-colors"
              >
                FastAPI Swagger Docs
              </a>
            </div>
          </div>
        </div>

        {/* System Architecture & Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: System Isolation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Deterministic Org Isolation</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Upload files contain no CPSE column. The backend deterministically binds datasets to the authenticated user's organization (<span className="text-slate-300 font-mono">cpse_id</span>).
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Secure Zero-Leakage Architecture
            </div>
          </div>

          {/* Card 2: Flexible Material DNA */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Immutable Raw + Material DNA</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Legacy descriptions are permanently preserved. Technical attributes are extracted into flexible EAV attributes and JSONB Material DNA.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Three-Tier: Raw → Norm → Canonical
            </div>
          </div>

          {/* Card 3: Configurable Hybrid Matching */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <GitMerge className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Configurable Matching Weights</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Dynamic weights govern hybrid scoring with hard engineering rules:
            </p>
            {health?.matching_weights ? (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Semantic: {health.matching_weights.semantic * 100}%</span>
                <span className="text-slate-400">Attribute: {health.matching_weights.attribute * 100}%</span>
                <span className="text-slate-400">Rules: {health.matching_weights.rule * 100}%</span>
                <span className="text-slate-400">Class: {health.matching_weights.classification * 100}%</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Connecting to configuration...</div>
            )}
          </div>
        </div>

        {/* 9-Stage Pipeline Architecture */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                CANONIX End-to-End Pipeline Workflow
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Standardized progression from heterogeneous CPSE ERP data to unified National Identity
              </p>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              9-Stage Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelineStages.map((stage, idx) => (
              <div 
                key={stage.name}
                className="flex items-start gap-3.5 p-3.5 rounded-lg bg-slate-850/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400 shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200 tracking-wide">
                    {stage.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {stage.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Implementation Milestones Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Milestone Roadmap Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-sky-500/5 border border-sky-500/20">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                <div>
                  <span className="text-sm font-semibold text-white">Milestone 1: Foundation & Core Ingestion Pipeline</span>
                  <p className="text-xs text-slate-400">FastAPI Backend + Next.js Frontend + PostgreSQL Database Schema + Auth/RBAC</p>
                </div>
              </div>
              <span className="text-xs font-medium text-sky-400 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30">
                Phase 1 Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-850/40 border border-slate-800 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-300">Milestone 2: Normalization & Material DNA</span>
                  <p className="text-xs text-slate-500">Dictionaries, spaCy NLP attribute extraction, canonical description generation</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">Queued</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-850/40 border border-slate-800 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-300">Milestone 3: AI Embeddings & Hybrid Matching</span>
                  <p className="text-xs text-slate-500">Sentence Transformers (all-MiniLM-L6-v2), pgvector search & engineering rules</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">Queued</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-850/40 border border-slate-800 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-300">Milestone 4: Human Expert Review & National Material Master</span>
                  <p className="text-xs text-slate-500">Side-by-side comparison UI, NM-xxxxxx creation, legacy CPSE code mapping</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">Queued</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-850/40 border border-slate-800 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-300">Milestone 5: Procurement Intelligence & Duplicate Prevention</span>
                  <p className="text-xs text-slate-500">Demand aggregation, volume consolidation opportunities, Material Creation Copilot</p>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">Queued</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>CANONIX | National Material Code Standardization & Harmonization Platform</p>
        <p className="mt-1">Smart India Hackathon 2026 Problem Statement 26099 | Ministry of Petroleum & Natural Gas</p>
      </footer>
    </div>
  );
}
