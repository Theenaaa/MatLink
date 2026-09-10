'use client';

import React, { useState } from 'react';
import { Edit3, X, Loader2, ArrowDown } from 'lucide-react';
import type { AIRecommendation } from '@/types';

interface ModifyMaterialFormProps {
  materialId: string;
  recommendation: AIRecommendation;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (changes: Record<string, string>) => void;
  onCancel: () => void;
}

export function ModifyMaterialForm({
  materialId,
  recommendation,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: ModifyMaterialFormProps) {
  const [fields, setFields] = useState<Record<string, string>>({
    standardizedDescription: recommendation.standardizedDescription,
    ...recommendation.attributes,
  });
  const [comment, setComment] = useState('');

  const updateField = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const getOriginal = (key: string): string => {
    if (key === 'standardizedDescription') return recommendation.standardizedDescription;
    return recommendation.attributes[key] ?? '';
  };

  const isModified = (key: string) => fields[key] !== getOriginal(key);

  if (!isOpen) return null;

  const allFields = [
    { key: 'standardizedDescription', label: 'Standardized Description' },
    ...Object.keys(recommendation.attributes).map((k) => ({ key: k, label: k })),
  ];

  const handleConfirm = () => {
    const changes: Record<string, string> = { ...fields };
    if (comment) changes._reviewerComment = comment;
    onConfirm(changes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-2xl bg-[#0a1628] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-purple-950/20 shrink-0">
          <Edit3 className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">Modify AI Recommendation</h2>
            <p className="text-xs text-slate-500 font-mono">{materialId}</p>
          </div>
          <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 rounded-lg px-3 py-2">
            <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
            Fields highlighted in purple have been modified from the AI-generated value.
            Original CPSE data is never overwritten.
          </div>

          {allFields.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {label}
                </label>
                {isModified(key) && (
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">
                    Modified
                  </span>
                )}
              </div>

              {/* AI original value */}
              <div className="text-[10px] text-slate-600 mb-1">
                AI Generated:{' '}
                <span className="text-slate-500 font-mono">{getOriginal(key) || 'Not specified'}</span>
              </div>

              {/* Editable field */}
              {key === 'standardizedDescription' ? (
                <textarea
                  value={fields[key] ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition ${
                    isModified(key) ? 'border-purple-700/60 bg-purple-950/10' : 'border-slate-700'
                  }`}
                />
              ) : (
                <input
                  type="text"
                  value={fields[key] ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    isModified(key) ? 'border-purple-700/60 bg-purple-950/10' : 'border-slate-700'
                  }`}
                />
              )}

              {isModified(key) && (
                <div className="text-[10px] text-purple-400 mt-0.5 flex items-center gap-1">
                  <ArrowDown className="w-2.5 h-2.5" />
                  Reviewer Modified Value
                </div>
              )}
            </div>
          ))}

          {/* Reviewer comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Reason for Modification <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="modify-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Explain the technical basis for modification..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/30 shrink-0">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="modify-confirm-btn"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Edit3 className="w-4 h-4" /> Submit Modification</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
