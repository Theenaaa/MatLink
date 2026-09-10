'use client';

import React, { useState } from 'react';
import { PlusCircle, X, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { NewMasterData } from '@/types';

const CATEGORIES = [
  'PLATES', 'PIPES', 'FASTENERS', 'VALVES', 'CABLES', 'STRUCTURAL STEEL',
  'INSULATION', 'LUBRICANTS', 'PUMPS', 'MOTORS', 'INSTRUMENTS', 'ELECTRICAL', 'OTHER',
];

const UOMS = ['MT', 'MTR', 'NOS', 'KG', 'LTR', 'SQM', 'SET', 'PAIR', 'RLL', 'BOX'];

interface CreateMasterFormProps {
  materialId: string;
  sourceCPSE: string;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (data: NewMasterData) => void;
  onCancel: () => void;
}

export function CreateMasterForm({
  materialId,
  sourceCPSE,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: CreateMasterFormProps) {
  const [formData, setFormData] = useState<NewMasterData>({
    commonMaterialCode: '',
    standardizedDescription: '',
    category: '',
    uom: '',
    technicalAttributes: {},
    standards: '',
    reasonForNew: '',
  });
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');
  const [touched, setTouched] = useState(false);

  const update = (patch: Partial<NewMasterData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const addAttribute = () => {
    if (attrKey && attrVal) {
      update({ technicalAttributes: { ...formData.technicalAttributes, [attrKey]: attrVal } });
      setAttrKey('');
      setAttrVal('');
    }
  };

  const removeAttribute = (key: string) => {
    const copy = { ...formData.technicalAttributes };
    delete copy[key];
    update({ technicalAttributes: copy });
  };

  const isValid =
    formData.commonMaterialCode &&
    formData.standardizedDescription &&
    formData.category &&
    formData.uom &&
    formData.reasonForNew;

  const handleConfirm = () => {
    setTouched(true);
    if (!isValid) return;
    onConfirm(formData);
  };

  if (!isOpen) return null;

  const required = (field: string) =>
    touched && !field ? 'border-red-600/60' : 'border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-2xl bg-[#0a1628] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-cyan-950/20 shrink-0">
          <PlusCircle className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">Create New Master Record</h2>
            <p className="text-xs text-slate-500">
              No suitable existing harmonized material found for{' '}
              <span className="font-mono">{materialId}</span>
            </p>
          </div>
          <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-start gap-2 bg-cyan-950/20 border border-cyan-800/30 rounded-lg px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-xs text-cyan-300/80">
              Creating a new master record when no existing harmonized material is technically suitable.
              This record will be added to the Harmonized Master as a draft pending final review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Common Material Code */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Common Material Code <span className="text-red-400">*</span>
              </label>
              <input
                id="new-master-code"
                type="text"
                value={formData.commonMaterialCode}
                onChange={(e) => update({ commonMaterialCode: e.target.value })}
                placeholder="e.g. NMM-MS-PIPE-25-SCH80"
                className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${required(formData.commonMaterialCode)}`}
              />
            </div>

            {/* Standardized Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Standardized Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="new-master-description"
                value={formData.standardizedDescription}
                onChange={(e) => update({ standardizedDescription: e.target.value })}
                rows={2}
                placeholder="Noun-modifier format: e.g. Mild Steel Pipe — NB: 25 mm — Schedule: 80 — IS 1239"
                className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${required(formData.standardizedDescription)}`}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                id="new-master-category"
                value={formData.category}
                onChange={(e) => update({ category: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${required(formData.category)}`}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* UOM */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Unit of Measure <span className="text-red-400">*</span>
              </label>
              <select
                id="new-master-uom"
                value={formData.uom}
                onChange={(e) => update({ uom: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${required(formData.uom)}`}
              >
                <option value="">Select UOM...</option>
                {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Standards */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Applicable Standards
              </label>
              <input
                type="text"
                value={formData.standards}
                onChange={(e) => update({ standards: e.target.value })}
                placeholder="e.g. IS 1239 Part 1, ASME B36.10M"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Technical Attributes */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Technical Attributes
            </label>
            <div className="space-y-1.5 mb-2">
              {Object.entries(formData.technicalAttributes).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-slate-400 min-w-[100px]">{k}</span>
                  <span className="text-xs text-slate-200 flex-1">{v}</span>
                  <button onClick={() => removeAttribute(k)} className="text-slate-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={attrKey}
                onChange={(e) => setAttrKey(e.target.value)}
                placeholder="Attribute name"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <input
                type="text"
                value={attrVal}
                onChange={(e) => setAttrVal(e.target.value)}
                placeholder="Value"
                onKeyDown={(e) => e.key === 'Enter' && addAttribute()}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                onClick={addAttribute}
                disabled={!attrKey || !attrVal}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Reason for Creating New Master <span className="text-red-400">*</span>
            </label>
            <textarea
              id="new-master-reason"
              value={formData.reasonForNew}
              onChange={(e) => update({ reasonForNew: e.target.value })}
              rows={3}
              placeholder="Explain why no existing harmonized material is technically suitable..."
              className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${required(formData.reasonForNew)}`}
            />
          </div>

          {touched && !isValid && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Please fill all required fields before submitting.
            </div>
          )}
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
            id="create-master-confirm-btn"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><PlusCircle className="w-4 h-4" /> Create New Master</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
