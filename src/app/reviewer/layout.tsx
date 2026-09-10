'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  SearchCode,
  Database,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Bell,
  LogOut,
  Sparkles,
  Search,
  ChevronDown,
  BarChart3,
  Sliders,
  Settings,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

const NAV_ITEMS = [
  {
    href: '/reviewer/review-queue',
    label: 'Dashboard',
    icon: LayoutDashboard,
    badge: '14 Pending',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    href: '/reviewer/material-explorer',
    label: 'Material Explorer',
    icon: SearchCode,
  },
  {
    href: '/reviewer/harmonized-master',
    label: 'Harmonized Masters',
    icon: Database,
  },
  {
    href: '/reviewer/profile',
    label: 'Reviewer Profile',
    icon: Settings,
  },
];

function SidebarNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="flex flex-col h-full bg-white border-r border-slate-200/80 select-none">
      {/* Logo area */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#10203a] flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
              <span>MatLink</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                CPCL
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-body">Master Harmonization</div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 py-5 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">
          Workspace Navigation
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge, badgeColor }) => {
          const isActive = pathname === href || (href !== '/reviewer/review-queue' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm transition font-medium group ${
                isActive
                  ? 'bg-[#10203a] text-white shadow-sm shadow-blue-950/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-700'}`} />
              <span className="truncate">{label}</span>
              {badge && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-400 text-slate-900' : badgeColor}`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Card at bottom (Exact match to FlowMail user profile pill) */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10203a] to-[#254b8c] text-white flex items-center justify-center text-xs font-heading font-bold shrink-0 shadow-sm">
              {user?.avatarInitials || 'AK'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate font-heading">{user?.name || 'Dr. Arun Kumar'}</div>
              <div className="text-[10px] text-slate-500 truncate font-body">CPCL Domain Expert</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            aria-label="Logout"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?role=REVIEWER');
    }
    if (!isLoading && user && user.role !== 'REVIEWER') {
      router.push('/login?role=REVIEWER');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-5 h-5 border-2 border-[#10203a] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium font-body">Loading Reviewer Workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-900 font-body flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col fixed h-full z-30">
        <SidebarNav />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-white h-full shadow-2xl">
            <SidebarNav onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Top Header Bar (Matching FlowMail Topbar) */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                {pathname.includes('match-review')
                  ? 'AI Match Review Workspace'
                  : pathname.includes('harmonized-master')
                  ? 'Harmonized Golden Master'
                  : pathname.includes('material-explorer')
                  ? 'Material Explorer'
                  : pathname.includes('profile')
                  ? 'Reviewer Profile'
                  : 'Dashboard'}
              </span>
              <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                MoPNG Live Sync
              </span>
            </div>
          </div>

          {/* Center: Search Bar Pill (Exact match to FlowMail search bar) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search materials, part number, CPSE catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100/70 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-full border border-slate-200/80 focus:border-[#10203a] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Right: Notifications & AI Insight Button */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with alert badge */}
            <button
              aria-label="Notifications"
              onClick={() => alert('All CPSE Material review queues up to date.')}
              className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {/* Gradient AI Insight Pill Button (Matching "Get Ai Insight" in FlowMail) */}
            <button
              onClick={() => alert('AI Harmonization Engine: 14 recommendations loaded with 94.8% confidence.')}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#10203a] via-[#1a3866] to-[#254b8c] text-white text-xs font-heading font-bold shadow-sm hover:shadow-md shadow-blue-950/20 transition transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition" />
              <span className="hidden sm:inline">Get AI Insight</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
