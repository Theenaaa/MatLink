"use client";

import React, { useState } from "react";
import {
  X,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Database,
  RefreshCw,
  Hash,
  Scale,
  ShieldCheck,
  Code,
} from "lucide-react";
import { MaterialDetailItem, normalizeMaterialApi } from "@/lib/api";

interface MaterialDetailModalProps {
  material: MaterialDetailItem | null;
  token: string | null;
  onClose: () => void;
  onMaterialUpdated?: (updated: MaterialDetailItem) => void;
}

export default function MaterialDetailModal({
  material,
  token,
  onClose,
  onMaterialUpdated,
}: MaterialDetailModalProps) {
  const [currentMat, setCurrentMat] = useState<MaterialDetailItem | null>(material);
  const [normalizing, setNormalizing] = useState(false);
  const [normError, setNormError] = useState<string | null>(null);

  if (!currentMat) return null;

  const handleNormalize = async () => {
    if (!token) return;
    setNormalizing(true);
    setNormError(null);
    try {
      const updated = await normalizeMaterialApi(token, currentMat.id);
      setCurrentMat(updated);
      if (onMaterialUpdated) onMaterialUpdated(updated);
    } catch (err: any) {
      setNormError(err.message || "Failed to normalize material");
    } finally {
      setNormalizing(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "NORMALIZED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> NORMALIZED
          </span>
        );
      case "REVIEW_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> REVIEW REQUIRED
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            RAW (UNPROCESSED)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold font-mono text-amber-400">
                  {currentMat.material_code}
                </span>
                {statusBadge(currentMat.normalization_status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Catalog Traceability ID #{currentMat.id} · Bound to {currentMat.cpse_code || "CPSE"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNormalize}
              disabled={normalizing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 transition shadow-sm"
              title="Run deterministic normalization pipeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${normalizing ? "animate-spin" : ""}`} />
              <span>{currentMat.normalization_status === "RAW" ? "Normalize Now" : "Re-Run Normalization"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {normError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{normError}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION A: SOURCE / RAW CPSE DATA                                */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Section A: Source / Raw CPSE Data
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                Source of Truth Preserved
              </span>
            </div>

            {/* Raw Description Box */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                Raw Material Description (Unmodified Master Record):
              </span>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed select-all">
                {currentMat.raw_description}
              </div>
            </div>

            {/* Grid of Raw Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">Material Code</span>
                <span className="font-mono font-bold text-slate-200">{currentMat.material_code}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">Order Quantity &amp; UOM</span>
                <span className="font-mono font-bold text-slate-200">
                  {currentMat.order_qty} {currentMat.uom}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">Enterprise CPSE</span>
                <span className="font-bold text-amber-400">{currentMat.cpse_code || "CPCL"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">Lineage Source File</span>
                <span className="font-mono text-slate-300 truncate block" title={currentMat.file_name || ""}>
                  {currentMat.file_name || "Direct Master"} (Row {currentMat.source_row_number ?? 1})
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION B: CANONIX INTELLIGENCE LAYER                              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Section B: CANONIX Intelligence &amp; Material DNA
                </h3>
              </div>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40">
                Deterministic Derived Layer
              </span>
            </div>

            {/* Canonical Description */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                Standardized Canonical Description:
              </span>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-sky-900/40 text-sky-200 font-mono text-xs font-medium leading-relaxed select-all">
                {currentMat.canonical_description || (
                  <span className="text-slate-500 italic">
                    Not yet normalized. Click &quot;Normalize Now&quot; above to synthesize canonical description.
                  </span>
                )}
              </div>
            </div>

            {/* Classification Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Material Classification</span>
                <span className="font-bold text-white text-sm">
                  {currentMat.material_type || "UNKNOWN"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Material Group</span>
                <span className="font-bold text-indigo-300 text-sm">
                  {currentMat.material_group || "GENERAL"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Normalized At</span>
                <span className="font-mono text-slate-300">
                  {currentMat.normalized_at
                    ? new Date(currentMat.normalized_at).toLocaleString("en-IN")
                    : "Pending"}
                </span>
              </div>
            </div>

              {/* Material DNA JSON Viewer */}
            {currentMat.material_dna && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-amber-400" />
                  <span>Synthesized Material DNA (JSONB):</span>
                </span>
                <pre className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
                  {JSON.stringify(currentMat.material_dna, null, 2)}
                </pre>
              </div>
            )}

            {/* Extracted Structured Attributes Table */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">
                Multi-Dimensional Extracted Attributes ({currentMat.attributes.length}):
              </span>

              {currentMat.attributes.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 rounded-lg bg-slate-900 border border-slate-800">
                  No attributes extracted yet. Click &quot;Normalize Now&quot; to extract dimensions, grades, and standards.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <th className="px-3 py-2.5">Attribute</th>
                        <th className="px-3 py-2.5">Raw Value</th>
                        <th className="px-3 py-2.5">Normalized Value</th>
                        <th className="px-3 py-2.5">Canonical Unit</th>
                        <th className="px-3 py-2.5">Confidence</th>
                        <th className="px-3 py-2.5">Extraction Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {currentMat.attributes.map((attr) => (
                        <tr key={attr.id} className="hover:bg-slate-800/30 transition">
                          <td className="px-3 py-2 text-slate-300 font-bold uppercase">{attr.attribute_name}</td>
                          <td className="px-3 py-2 text-slate-400">{attr.raw_value || "—"}</td>
                          <td className="px-3 py-2 text-amber-300 font-semibold">{attr.normalized_value || "—"}</td>
                          <td className="px-3 py-2 text-sky-400">{attr.normalized_unit || "—"}</td>
                          <td className="px-3 py-2">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {Math.round(attr.confidence_score * 100)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-400 text-[11px]">{attr.extraction_method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION C: NATIONAL MATERIAL IDENTITY (PHASE 5)                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {currentMat.national_mapping && (
            <div className="p-5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Section C: National Material Identity &amp; Cross-CPSE Harmonization
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentMat.national_mapping.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  Mapping: {currentMat.national_mapping.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">National Material Code</span>
                  <a
                    href={`/national-materials/${currentMat.national_mapping.national_material_id}`}
                    className="font-mono font-bold text-emerald-400 text-sm hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{currentMat.national_mapping.national_material_code}</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Mapping Relationship</span>
                  <span className="font-bold text-white text-sm font-mono">
                    {currentMat.national_mapping.mapping_type}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Confidence Score</span>
                  <span className="font-mono text-white text-sm font-bold">
                    {(currentMat.national_mapping.confidence_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

