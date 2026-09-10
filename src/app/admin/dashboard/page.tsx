'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { BarChart3, Users, ShieldCheck, Activity, Database, LogOut, Construction, Settings, Eye, ClipboardList } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-1.5">
        <div className="flex-1" style={{ backgroundColor: '#FF9933' }} />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ backgroundColor: '#138808' }} />
      </div>

      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Government of India — MoPNG / CPCL</div>
            <div className="text-base font-black text-gray-900">AI-Driven Material Master Harmonization Platform</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-right">
              <div className="font-semibold text-gray-800">{user?.name}</div>
              <div className="text-purple-600 font-bold uppercase text-[10px]">System Administrator</div>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition" aria-label="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <nav style={{ backgroundColor: '#581c87' }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1">
          {['Dashboard', 'Analytics', 'User Management', 'Audit Logs', 'System Config'].map((label, i) => (
            <a key={label} href="#"
              className={`px-4 py-2.5 text-sm font-medium transition ${i === 0 ? 'border-b-2 border-white text-white' : 'text-purple-200 hover:text-white hover:bg-white/10'}`}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
            <h1 className="text-xl font-black text-gray-900">Admin Dashboard — Page 2</h1>
          </div>
          <p className="text-sm text-gray-500">Monitor platform operations, analytics, users and audit information.</p>
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 mb-8 flex items-start gap-4">
          <Construction className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
          <div>
            <div className="text-base font-black text-amber-800 mb-1">Page 2 — Under Development</div>
            <p className="text-sm text-amber-700 mb-3">
              The Administrator workspace (Dashboard, Analytics, User Management, Audit) is planned
              for the next development phase. Routing and authentication are correctly configured.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="px-4 py-2 rounded-lg bg-amber-700 text-white text-sm font-semibold hover:bg-amber-600 transition">
                Return to Home
              </Link>
              <Link href="/login" className="px-4 py-2 rounded-lg border border-amber-400 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition">
                Switch Role
              </Link>
            </div>
          </div>
        </div>

        <h2 className="text-base font-bold text-gray-700 mb-4 uppercase tracking-wider">Planned Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Platform-wide analytics, review throughput and KPIs' },
            { icon: Users, title: 'User Management', desc: 'Manage reviewer, data manager and admin user accounts' },
            { icon: Activity, title: 'System Monitoring', desc: 'Real-time system health, processing queues and performance' },
            { icon: ClipboardList, title: 'Audit Logs', desc: 'Complete audit trail of all human decisions and system events' },
            { icon: Database, title: 'Data Governance', desc: 'Material master governance rules and configuration' },
            { icon: Settings, title: 'System Configuration', desc: 'Platform configuration, AI thresholds and settings' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-dashed border-gray-300 rounded-xl p-4 opacity-70">
              <Icon className="w-6 h-6 text-purple-500 mb-2" />
              <div className="text-sm font-bold text-gray-700 mb-1">{title}</div>
              <div className="text-xs text-gray-500">{desc}</div>
              <span className="inline-block mt-2 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">Planned</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
