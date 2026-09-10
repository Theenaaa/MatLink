'use client';

import React from 'react';
import { Database, Tag, Ruler, Factory } from 'lucide-react';
import type { Material } from '@/types';

interface MaterialSourcePanelProps {
  material: Material;
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 font-heading">
        {label}
      </div>
      {value ? (
        <div className={`text-xs font-semibold text-slate-800 ${mono ? 'font-mono text-blue-900 bg-blue-50/60 px-2 py-0.5 rounded border border-blue-100 w-fit' : 'font-body'}`}>
          {value}
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic font-body">Not specified</div>
      )}
    </div>
  );
}

export function MaterialSourcePanel({ material }: MaterialSourcePanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-fit">
      {/* Panel header */}
      <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
          <Database className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
            Source Material
          </span>
          <p className="text-[10px] text-slate-500 font-body">Original enterprise data</p>
        </div>
        <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 font-heading">
          {material.sourceCPSE}
        </span>
      </div>

      <div className="px-5 py-2">
        <Field label="Material Code" value={material.originalCode} mono />
        <Field label="Original Description" value={material.originalDescription} />
        <Field label="Source CPSE" value={material.sourceCPSE} />
        <Field label="Category" value={material.category} />
        <Field label="Unit of Measure" value={material.uom} />
        <Field label="Manufacturer" value={material.manufacturer} />
        <Field label="Original Specifications" value={material.originalSpecifications} />
        <Field label="Source Dataset" value={material.sourceDataset} />
      </div>

      {/* Normalized attributes if available */}
      {material.normalizedAttributes && Object.keys(material.normalizedAttributes).length > 0 && (
        <>
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-heading">
                Normalized Attributes
              </span>
            </div>
          </div>
          <div className="px-5 pb-4 space-y-2 pt-2">
            {Object.entries(material.normalizedAttributes).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0 font-body">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px]">{String(v)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
