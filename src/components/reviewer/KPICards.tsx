'use client';

import React from 'react';
import {
  Clock,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { ReviewQueueKPIs } from '@/types';

interface KPICardsProps {
  kpis?: ReviewQueueKPIs;
  isLoading?: boolean;
}

function KPISkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3.5 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-4 bg-slate-200 rounded" />
      </div>
      <div className="h-8 w-12 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-28 bg-slate-200 rounded" />
    </div>
  );
}

export function KPICards({ kpis, isLoading }: KPICardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <KPISkeleton key={i} />
        ))}
      </div>
    );
  }

  // Format today's date like "10 Sept"
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  const cards = [
    {
      title: 'PENDING REVIEW',
      value: kpis.pendingReview ?? 14,
      subtext: 'Awaiting validation',
      icon: Clock,
      iconColor: 'text-amber-500',
    },
    {
      title: 'HIGH CONFIDENCE',
      value: kpis.highConfidence ?? 10,
      subtext: '90–100% AI confidence',
      icon: TrendingUp,
      iconColor: 'text-blue-600',
    },
    {
      title: 'MEDIUM CONFIDENCE',
      value: kpis.mediumConfidence ?? 7,
      subtext: '75–89% AI confidence',
      icon: BarChart3,
      iconColor: 'text-purple-600',
    },
    {
      title: 'REQUIRES REVIEW',
      value: kpis.requiresReview ?? 3,
      subtext: 'Below 75%',
      icon: AlertTriangle,
      iconColor: 'text-rose-500',
    },
    {
      title: 'APPROVED TODAY',
      value: kpis.approvedToday ?? 0,
      subtext: todayFormatted || '10 Sept',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-sm hover:border-slate-300 transition group"
          >
            {/* Top row: All-caps title + icon on right */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-heading">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.iconColor}`} />
            </div>

            {/* Big Stat Number */}
            <div className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight mb-1">
              {card.value}
            </div>

            {/* Subtext description */}
            <div className="text-xs text-slate-500 font-body font-medium">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
