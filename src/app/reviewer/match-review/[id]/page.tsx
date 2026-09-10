'use client';

import React, { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, History, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import {
  getMaterial,
  approveMaterial,
  rejectMaterial,
  modifyMaterial,
  createNewMaster,
  getAuditHistoryForMaterial,
} from '@/lib/api/reviewApi';
import { MaterialSourcePanel } from '@/components/reviewer/MaterialSourcePanel';
import { AIRecommendationPanel } from '@/components/reviewer/AIRecommendationPanel';
import { ExplainabilityCard } from '@/components/reviewer/ExplainabilityCard';
import { SimilarMaterials } from '@/components/reviewer/SimilarMaterials';
import { ReviewActionBar } from '@/components/reviewer/ReviewActionBar';
import { ApprovalDialog } from '@/components/reviewer/ApprovalDialog';
import { RejectDialog } from '@/components/reviewer/RejectDialog';
import { ModifyMaterialForm } from '@/components/reviewer/ModifyMaterialForm';
import { CreateMasterForm } from '@/components/reviewer/CreateMasterForm';
import type { NewMasterData } from '@/types';

type Dialog = 'approve' | 'reject' | 'modify' | 'create' | null;

export default function MatchReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);

  const { data: material, isLoading, error } = useQuery({
    queryKey: ['material', id],
    queryFn: () => getMaterial(id),
    enabled: !!id,
  });

  const { data: auditHistory } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => getAuditHistoryForMaterial(id),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['material', id] });
    queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    queryClient.invalidateQueries({ queryKey: ['review-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['harmonized-master'] });
    queryClient.invalidateQueries({ queryKey: ['audit', id] });
  };

  const approveMut = useMutation({
    mutationFn: () =>
      approveMaterial({
        materialId: id,
        reviewerId: user!.id,
        reviewerName: user!.name,
        timestamp: new Date().toISOString(),
      }),
    onSuccess: () => { invalidate(); setDialog(null); },
  });

  const rejectMut = useMutation({
    mutationFn: ({ reason, comment }: { reason: string; comment?: string }) =>
      rejectMaterial({
        materialId: id,
        reason,
        comment,
        reviewerId: user!.id,
        reviewerName: user!.name,
        timestamp: new Date().toISOString(),
      }),
    onSuccess: () => { invalidate(); setDialog(null); },
  });

  const modifyMut = useMutation({
    mutationFn: (changes: Record<string, string>) =>
      modifyMaterial({
        materialId: id,
        modifiedAttributes: changes,
        reviewerId: user!.id,
        reviewerName: user!.name,
        timestamp: new Date().toISOString(),
      }),
    onSuccess: () => { invalidate(); setDialog(null); },
  });

  const createMut = useMutation({
    mutationFn: (data: NewMasterData) =>
      createNewMaster({
        materialId: id,
        masterData: data,
        reviewerId: user!.id,
        reviewerName: user!.name,
        timestamp: new Date().toISOString(),
      }),
    onSuccess: () => { invalidate(); setDialog(null); },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-sm">Loading material review workspace...</span>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <div className="text-slate-400 text-sm">Material not found: {id}</div>
        <Link href="/reviewer/review-queue" className="text-indigo-400 hover:underline text-sm">
          ← Return to Review Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/reviewer/review-queue"
            className="flex items-center gap-1.5 text-xs font-heading font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Review Queue
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-heading font-bold text-slate-900">AI Match Review</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            {id}
          </span>

          <div className="ml-auto flex items-center gap-2 flex-wrap text-xs font-heading font-bold">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{material.sourceCPSE}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{material.category}</span>
          </div>
        </div>

        {/* Flow indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] font-heading font-bold tracking-wider flex-wrap">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">1. ORIGINAL CPSE DATA</span>
          <span className="text-slate-300">→</span>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">2. AI RECOMMENDATION</span>
          <span className="text-slate-300">→</span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">3. DOMAIN EXPERT DECISION</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Source Material */}
          <div>
            <MaterialSourcePanel material={material} />
          </div>

          {/* Center: AI Recommendation */}
          <div>
            <AIRecommendationPanel recommendation={material.aiRecommendation} />
          </div>

          {/* Right: Explainability */}
          <div>
            <ExplainabilityCard factors={material.aiRecommendation.explanation} />
          </div>
        </div>

        {/* Bottom: Similar Materials */}
        <div>
          <SimilarMaterials
            candidates={material.candidateMatches}
            materialId={material.id}
          />
        </div>

        {/* Audit History */}
        {auditHistory && auditHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70">
              <History className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                Audit History
              </span>
            </div>
            <div className="p-5 space-y-3 font-body">
              {auditHistory.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-[#10203a] text-white flex items-center justify-center shrink-0 text-xs font-black font-heading shadow-2xs">
                    {a.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 font-heading">{a.userName}</span>
                      <span className="text-[10px] text-slate-500">({a.userRole})</span>
                      <span className="text-xs font-bold text-slate-600 uppercase font-heading">{a.action}</span>
                    </div>
                    {a.decision && <p className="text-xs text-slate-700 mt-0.5 font-medium">{a.decision}</p>}
                    {a.reason && <p className="text-xs text-rose-600 mt-0.5 font-medium">Reason: {a.reason}</p>}
                    {a.comment && <p className="text-xs text-slate-500 mt-0.5 italic">"{a.comment}"</p>}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 font-heading">
                    <Clock className="w-3 h-3" />
                    {new Date(a.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Bar */}
      <ReviewActionBar
        materialId={material.id}
        reviewStatus={material.reviewStatus}
        onApprove={() => setDialog('approve')}
        onReject={() => setDialog('reject')}
        onModify={() => setDialog('modify')}
        onCreateNew={() => setDialog('create')}
      />

      {/* Dialogs */}
      <ApprovalDialog
        material={material}
        isOpen={dialog === 'approve'}
        isLoading={approveMut.isPending}
        onConfirm={() => approveMut.mutate()}
        onCancel={() => setDialog(null)}
      />

      <RejectDialog
        materialId={material.id}
        isOpen={dialog === 'reject'}
        isLoading={rejectMut.isPending}
        onConfirm={(reason, comment) => rejectMut.mutate({ reason, comment })}
        onCancel={() => setDialog(null)}
      />

      {dialog === 'modify' && (
        <ModifyMaterialForm
          materialId={material.id}
          recommendation={material.aiRecommendation}
          isOpen
          isLoading={modifyMut.isPending}
          onConfirm={(changes) => modifyMut.mutate(changes)}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === 'create' && (
        <CreateMasterForm
          materialId={material.id}
          sourceCPSE={material.sourceCPSE}
          isOpen
          isLoading={createMut.isPending}
          onConfirm={(data) => createMut.mutate(data)}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
