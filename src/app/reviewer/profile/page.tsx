'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/context';
import { User, Mail, Building2, Shield, Award, CheckCircle2, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#10203a] shrink-0">
          <User className="w-6 h-6 text-[#10203a]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
            Reviewer Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-body mt-0.5">
            Authenticated Domain Expert credentials and MoPNG role assignments
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10203a] via-[#1a3866] to-[#254b8c] flex items-center justify-center text-xl font-black text-white shadow-md shadow-blue-950/20 font-heading shrink-0">
            {user.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black font-heading text-slate-900 tracking-tight">
                {user.name}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-heading bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Active Reviewer
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-heading">
                {user.role}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600 font-body">
                {user.cpse} Central Operations
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Official Email', value: user.email, icon: Mail },
            { label: 'Department / Unit', value: user.department, icon: Building2 },
            { label: 'Assigned Role', value: 'Domain Expert / Reviewer', icon: Shield },
            { label: 'Enterprise CPSE', value: user.cpse, icon: Award },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="p-4 rounded-xl bg-slate-50 border border-slate-100/90 flex items-start gap-3.5 hover:border-slate-200 transition"
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-blue-900 shrink-0 mt-0.5 shadow-2xs">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                  {label}
                </div>
                <div className="text-sm font-bold text-slate-800 font-heading mt-0.5 truncate">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-body">
          <span>Prototype Environment: MoPNG SIH 2026</span>
          <span className="font-mono text-[11px]">Audit ID: SEC-REV-CPCL-2026-A1</span>
        </div>
      </div>
    </div>
  );
}
