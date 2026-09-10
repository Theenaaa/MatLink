'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Database, CheckCircle2, Clock, FileText, Users, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { getHarmonizedMaster } from '@/lib/api/reviewApi';
import type { HarmonizedMaster } from '@/types';

function StatusBadge({ status }: { status: HarmonizedMaster['approvalStatus'] }) {
  const cfg = {
    APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    DRAFT: 'bg-amber-50 text-amber-800 border-amber-200',
    UNDER_REVIEW: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg[status]}`}>
      {status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
      {status === 'DRAFT' && <Clock className="w-3 h-3 text-amber-600" />}
      {status}
    </span>
  );
}

export default function HarmonizedMasterPage() {
  const { data: records = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['harmonized-master'],
    queryFn: getHarmonizedMaster,
  });

  const approved = records.filter((r) => r.approvalStatus === 'APPROVED');
  const drafts = records.filter((r) => r.approvalStatus === 'DRAFT');

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight">
              Harmonized Material Master
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 font-heading">
              Golden Registry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Authoritative single source-of-truth material records — validated & certified by CPSE Domain Experts.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-heading font-bold text-slate-700 shadow-2xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* 3 Summary KPI Cards (Matching FlowMail metric cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide font-heading">Approved Masters</div>
            <div className="text-3xl font-black font-heading text-slate-900 mt-1">{approved.length}</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">Authoritative central records</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide font-heading">Draft Proposals</div>
            <div className="text-3xl font-black font-heading text-slate-900 mt-1">{drafts.length}</div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">Awaiting secondary signoff</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide font-heading">Total Harmonized</div>
            <div className="text-3xl font-black font-heading text-slate-900 mt-1">{records.length}</div>
            <div className="text-[11px] text-blue-700 font-semibold mt-1">Unified across 6 CPSEs</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-900 leading-relaxed">
          <strong>Certified Single Source of Truth:</strong> Only records with status <strong>APPROVED</strong> represent the authoritative harmonized material master. Each master has an immutable audit trail recording the reviewer identity, timestamp, and rationale.
        </p>
      </div>

      {/* Records Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
              Harmonized Material Catalog
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500">{records.length} records</span>
        </div>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#10203a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-500 text-center">
            <Database className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-700 font-heading">No harmonized records yet</p>
            <p className="text-xs text-slate-500">Approve materials in the Review Queue to populate this golden master.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-heading font-bold uppercase tracking-wider text-[11px]">
                  {[
                    'Master Code',
                    'Standardized Description',
                    'Category',
                    'UOM',
                    'Key Attributes',
                    'Source CPSEs',
                    'Status',
                    'Approved By',
                    'Approved Date',
                  ].map((col) => (
                    <th key={col} className="px-5 py-3.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    {/* Master Code */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#10203a] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {rec.commonMaterialCode}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="text-xs font-semibold text-slate-900 truncate" title={rec.standardizedDescription}>
                        {rec.standardizedDescription}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-slate-600 font-medium">{rec.category}</span>
                    </td>

                    {/* UOM */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-heading">
                        {rec.uom}
                      </span>
                    </td>

                    {/* Key Attributes */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(rec.keyAttributes).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="inline-flex text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200/60">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Source CPSEs */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-800">{rec.sourceCPSECount}</span>
                        <span className="text-[11px] text-slate-500">({rec.sourceCPSEs.join(', ')})</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={rec.approvalStatus} />
                    </td>

                    {/* Approved By */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700">{rec.approvedBy}</span>
                    </td>

                    {/* Approved Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                      {new Date(rec.approvedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Future ERP/SAP Integration Note */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 font-heading">
          Enterprise ERP/SAP Integration Layer — National CPSE Data Grid
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Approved harmonized master records are prepared for automated two-way synchronization into CPSE SAP/ERP and MESC systems via the National Petroleum Data Grid. This prototype demonstrates authenticated human approval flows using verified synthetic test data.
        </p>
      </div>
    </div>
  );
}
