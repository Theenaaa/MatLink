'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  UserCheck, Database, ShieldCheck, ChevronRight, Menu, X,
  ArrowRight, CheckCircle2, Sparkles, FileText, Users, Globe,
  Lock, Eye, ClipboardList, GitMerge, Tag, BarChart3, Search,
  ExternalLink, Download, HelpCircle, BookOpen, Building2,
  AlertCircle, Info, Cpu, ChevronDown, Play, Phone, Mail, MapPin,
  Calendar, Layers, Sliders, ChevronLeft, ArrowUpRight, Share2,
  Check, Compass, Settings, Activity, Clock
} from 'lucide-react';

const ASHOKA_CHAKRA_SPOKES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  return {
    x2: (20 + 13 * Math.cos(angle)).toFixed(2),
    y2: (20 + 13 * Math.sin(angle)).toFixed(2),
  };
});

// ── Government & CPCL Emblem SVG ────────────────────────────────
function EmblemPlaceholder({ size = 48 }: { size?: number }) {
  return (
    <div
      aria-label="Government of India Emblem"
      style={{ width: size, height: size }}
      className="rounded-full border border-amber-600/40 bg-amber-50 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="17" stroke="#92650a" strokeWidth="1.5" fill="none" />
        <circle cx="20" cy="20" r="3" fill="#92650a" />
        {ASHOKA_CHAKRA_SPOKES.map((spoke, i) => (
          <line
            key={i}
            x1="20"
            y1="20"
            x2={spoke.x2}
            y2={spoke.y2}
            stroke="#92650a"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        ))}
        <rect x="9" y="33" width="22" height="2" rx="1" fill="#92650a" />
        <text x="20" y="31" textAnchor="middle" fill="#92650a" fontSize="5" fontWeight="bold">🦁</text>
      </svg>
    </div>
  );
}

// ── Login Role Options ──────────────────────────────────────────
const LOGIN_ROLES = [
  {
    role: 'REVIEWER',
    label: 'Domain Expert / Reviewer',
    badge: 'Human Authority',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Review AI-generated material harmonization matches, approve, reject, or modify.',
    icon: UserCheck,
    href: '/login?role=REVIEWER',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    role: 'DATA_MANAGER',
    label: 'Data Manager',
    badge: 'Catalog Ingestion',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Upload multi-format CPSE ERP inventories (CSV, Excel) and trigger harmonization.',
    icon: Database,
    href: '/login?role=DATA_MANAGER',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    role: 'ADMIN',
    label: 'System Administrator',
    badge: 'Security & Audit',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Monitor harmonization progress across 6 CPSEs, view audit logs, manage compliance.',
    icon: ShieldCheck,
    href: '/login?role=ADMIN',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
];

// ── News Circulars Data (Matching City News in Ref) ─────────────
const NEWS_ITEMS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    date: 'December 2025',
    tag: 'Refinery Catalog',
    title: 'CPCL Manali Ingests 45,000 Material Line Items into Central Engine',
    desc: 'The technical operations division has successfully validated and mapped legacy SAP ERP material records into the unified MESC taxonomy format.',
    link: '#',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    date: 'January 2026',
    tag: 'Policy Gazette',
    title: 'MoPNG Issues Cross-CPSE Material Master Interchangeability Guidelines',
    desc: 'Official notification mandates standardized codification standards across all downstream CPSEs to unlock collaborative spare pooling.',
    link: '#',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    date: 'February 2026',
    tag: 'AI Performance',
    title: 'Domain Expert Reviewer Committee Records 94.8% Match Consensus',
    desc: 'Independent evaluation by CPCL, IOCL, and ONGC technical domain experts confirms high precision in automated valve and pump spare matching.',
    link: '#',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    date: 'March 2026',
    tag: 'Standardization',
    title: 'MESC & UNSPSC Taxonomy Integration Phase 2 Goes Live',
    desc: 'Unified codification rules deployed to map refinery-specific descriptors into standardized noun-modifier-attribute syntax.',
    link: '#',
  },
];

// ── Take Action Services (Matching Ref 4-card tall grid) ─────────
const ACTION_SERVICES = [
  {
    id: 'reviewer',
    title: 'Domain Reviewer Queue',
    subtitle: 'Human-in-the-Loop Validation',
    desc: 'Inspect AI-recommended material matches with side-by-side technical attribute explainability.',
    href: '/login?role=REVIEWER',
    roleTag: 'Role: Domain Expert',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    icon: UserCheck,
    cta: 'Enter Review Workspace',
  },
  {
    id: 'datamanager',
    title: 'Dataset Ingestion Portal',
    subtitle: 'Enterprise Data Onboarding',
    desc: 'Upload multi-format CSV, XLSX or ERP dumps to trigger automated deduplication and standardization.',
    href: '/login?role=DATA_MANAGER',
    roleTag: 'Role: Data Manager',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    icon: Database,
    cta: 'Upload CPSE Inventory',
  },
  {
    id: 'master',
    title: 'Harmonized Golden Master',
    subtitle: 'Unified Material Directory',
    desc: 'Search, filter, and inspect verified single source-of-truth material records ready for cross-CPSE sharing.',
    href: '/reviewer/harmonized-master',
    roleTag: 'Public & CPSE Access',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=600&q=80',
    icon: GitMerge,
    cta: 'Browse Master Registry',
  },
  {
    id: 'admin',
    title: 'Compliance & Audit Trail',
    subtitle: 'Governance & Oversight',
    desc: 'Track full tamper-proof decision histories, reviewer logs, and inter-enterprise sync metrics.',
    href: '/login?role=ADMIN',
    roleTag: 'Role: System Admin',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
    icon: ShieldCheck,
    cta: 'Access Admin Dashboard',
  },
];

// ── CPSE Departments / Ecosystem ────────────────────────────────
const CPSE_ENTITIES = [
  { code: 'MoPNG', name: 'Ministry of Petroleum & Natural Gas', role: 'Nodal Ministry', city: 'New Delhi' },
  { code: 'CPCL', name: 'Chennai Petroleum Corporation Ltd.', role: 'Host CPSE & Pilot Refinery', city: 'Chennai' },
  { code: 'IOCL', name: 'Indian Oil Corporation Limited', role: 'Downstream & Refineries', city: 'New Delhi' },
  { code: 'ONGC', name: 'Oil & Natural Gas Corporation', role: 'Upstream Exploration', city: 'Dehradun' },
  { code: 'GAIL', name: 'GAIL (India) Limited', role: 'Natural Gas Transmission', city: 'New Delhi' },
  { code: 'BPCL', name: 'Bharat Petroleum Corporation Ltd.', role: 'Refining & Marketing', city: 'Mumbai' },
  { code: 'HPCL', name: 'Hindustan Petroleum Corporation Ltd.', role: 'Refining & Petrochemicals', city: 'Mumbai' },
  { code: 'CHT', name: 'Centre for High Technology', role: 'Technical Advisory Body', city: 'Noida' },
];

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'refineries' | 'upstream'>('all');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close login dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body flex flex-col selection:bg-amber-100 selection:text-amber-900">

      {/* ── 1. Top Bar (Exact Match to Hinton reference top bar) ── */}
      <div className="bg-[#10203a] text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-700/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Left: Location & Ministry address */}
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Ministry of Petroleum & Natural Gas, Shastri Bhawan, Dr. Rajendra Prasad Rd, New Delhi - 110001</span>
          </div>

          {/* Right: Contact, Social, Language, and Accessibility */}
          <div className="flex items-center gap-4 shrink-0 text-slate-300">
            <div className="hidden sm:flex items-center gap-1.5 hover:text-white transition">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 (044) 2594-4000 (CPCL Helpdesk)</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <span className="hover:text-white cursor-pointer transition">Facebook</span>
              <span className="text-slate-600">•</span>
              <span className="hover:text-white cursor-pointer transition">Twitter</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-white">English</span>
              <span className="text-slate-400">/ हिन्दी</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tricolor National Bar ── */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600 shrink-0" />

      {/* ── 2. Main Navigation Bar (Clean White / Frosted) ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[37px] z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <EmblemPlaceholder size={44} />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition">
                  MATLINK
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200 font-heading">
                  CPCL • MoPNG
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide font-body">
                AI Material Master Standardization Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-heading font-extrabold tracking-wider text-slate-700 uppercase">
            <a href="#home" className="text-blue-800 border-b-2 border-blue-800 pb-0.5">Home</a>
            <a href="#about" className="hover:text-blue-900 transition">About Initiative</a>
            <a href="#bulletins" className="hover:text-blue-900 transition">Circulars</a>
            <a href="#services" className="hover:text-blue-900 transition">Core Modules</a>
            <a href="#impact" className="hover:text-blue-900 transition">Economic Impact</a>
            <a href="#ecosystem" className="hover:text-blue-900 transition">CPSE Network</a>
            <a href="#contact" className="hover:text-blue-900 transition">Contact</a>
          </nav>

          {/* Action Tools & Login Dropdown */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Search Portal"
              aria-label="Search Portal"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Login Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLoginOpen(!loginOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#162f55] hover:bg-[#102444] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Portal Login</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${loginOpen ? 'rotate-180' : ''}`} />
              </button>

              {loginOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 py-3 px-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Authorized Portal</p>
                    <p className="text-[11px] text-slate-500">Government & CPSE authentication protocol</p>
                  </div>

                  <div className="space-y-1.5">
                    {LOGIN_ROLES.map((role) => {
                      const Icon = role.icon;
                      return (
                        <Link
                          key={role.role}
                          href={role.href}
                          onClick={() => setLoginOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition group"
                        >
                          <div className={`p-2 rounded-md ${role.color} shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-800 transition truncate">
                                {role.label}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${role.badgeColor}`}>
                                {role.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              {role.desc}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-800 self-center shrink-0" />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 px-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Role-Based Access Control (RBAC)</span>
                    <Link href="/login" onClick={() => setLoginOpen(false)} className="text-blue-700 font-semibold hover:underline">
                      Common Login →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-800">Home</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-800">About Initiative</a>
            <a href="#bulletins" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-800">Circulars</a>
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-800">Core Modules</a>
            <a href="#impact" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-800">Economic Impact</a>
            <a href="#ecosystem" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-800">CPSE Network</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-800">Contact</a>
          </div>
        )}
      </header>

      {/* ── 3. Hero Section (Matching Hinton Oklahoma Hero Layout) ── */}
      <section id="home" className="relative min-h-[560px] md:min-h-[620px] flex items-center overflow-hidden bg-slate-900 text-white">
        {/* Full Bleed Background Image: Industrial Petroleum Refinery */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-90"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />

        {/* Angled / Diagonal Deep-Blue Cutout Overlay (Left side geometric polygon like ref image) */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0d2244]/95 via-[#0f2c59]/85 to-transparent pointer-events-none"
          style={{
            clipPath: 'polygon(0 0, 72% 0, 48% 100%, 0% 100%)',
          }}
        />

        {/* Global Dark Vignette Overlay for Readability */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 w-full flex flex-col justify-between h-full min-h-[560px]">
          <div className="max-w-2xl mt-4">
            {/* Signature Script Line (Exact match to "Town of" in ref) */}
            <div className="font-script text-3xl sm:text-4xl md:text-5xl text-amber-300 drop-shadow-md tracking-wide mb-[-10px]">
              National Master of
            </div>

            {/* Giant Flowing Script Headline (Exact match to "Hinton" in ref) */}
            <h1 className="font-script text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white drop-shadow-2xl leading-[1.05] tracking-wide my-1">
              Petroleum
            </h1>

            {/* Script Subhead (Exact match to "Oklahoma" in ref) */}
            <div className="font-script text-4xl sm:text-5xl md:text-6xl text-white/95 drop-shadow-xl tracking-wide ml-3 sm:ml-6 mt-[-10px] mb-4">
              CPSEs & Refineries
            </div>

            {/* Problem Statement Subheading */}
            <p className="mt-2 text-sm sm:text-base text-slate-200 leading-relaxed font-body font-normal max-w-xl drop-shadow-sm">
              AI-Driven Material Master Standardization & Cross-Enterprise Harmonization for
              <strong className="text-white font-semibold"> Chennai Petroleum Corporation Limited (CPCL) </strong>
              and public sector oil enterprises under the Ministry of Petroleum & Natural Gas.
            </p>

            {/* Explore / Video Trigger (Matching circular play button in ref) */}
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button
                onClick={() => setVideoModalOpen(true)}
                className="group flex items-center gap-3 px-5 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition transform hover:scale-105"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span>Watch System Walkthrough</span>
              </button>

              <a
                href="#about"
                className="px-5 py-3 rounded-full border border-white/40 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-xs transition"
              >
                Explore Architecture ↓
              </a>
            </div>
          </div>

          {/* Bottom Right Floating Preview Cards (Exact Match to Hinton reference cards) */}
          <div className="self-end mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto max-w-lg">
            {/* Card 1 */}
            <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900/80 backdrop-blur-md transition hover:scale-102">
              <div
                className="h-28 bg-cover bg-center filter brightness-90 group-hover:brightness-100 transition"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80')`,
                }}
              />
              <div className="p-3 bg-[#0d2244]/95 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">CPCL Refinery Assets</p>
                  <p className="text-[10px] text-slate-300">45,000+ Items Harmonized</p>
                </div>
                <Link
                  href="/reviewer/harmonized-master"
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 uppercase tracking-wider"
                >
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900/80 backdrop-blur-md transition hover:scale-102">
              <div
                className="h-28 bg-cover bg-center filter brightness-90 group-hover:brightness-100 transition"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80')`,
                }}
              />
              <div className="p-3 bg-[#0d2244]/95 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Cross-CPSE Hub</p>
                  <p className="text-[10px] text-slate-300">MESC & UNSPSC Standards</p>
                </div>
                <a
                  href="#services"
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 uppercase tracking-wider"
                >
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. "About Initiative" Overlapping Collage Section (Matching Hinton Ref) ── */}
      <section id="about" className="py-20 px-4 sm:px-8 bg-white relative overflow-hidden">
        {/* Giant Watermark Typography in Background */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[140px] md:text-[200px] font-heading font-black text-slate-100 select-none pointer-events-none tracking-tighter opacity-80 z-0">
          HARMONY
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Overlapping Photo Collage (Exact Match to Hinton Ref Left Collage) */}
          <div className="lg:col-span-6 relative pb-10 sm:pb-16 pr-4 sm:pr-8">
            {/* Primary Tall Photo Card */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white max-w-md w-full aspect-[4/5] bg-slate-200">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-medium font-body">
                CPCL Manali Refinery Complex • Critical Spares Standardization Division
              </div>
            </div>

            {/* Overlapping White Badge Card with Photo (Matching "Always Growing Always Prospering" in ref) */}
            <div className="absolute bottom-0 right-0 sm:right-6 bg-white rounded-xl shadow-2xl p-4 border border-slate-200 max-w-[280px] sm:max-w-[320px] transition transform hover:-translate-y-1">
              <div className="rounded-lg overflow-hidden h-28 mb-3 relative">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80')`,
                  }}
                />
                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-heading font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI + Human
                </span>
              </div>
              <h4 className="font-heading text-sm font-extrabold text-slate-900 leading-snug">
                Unified Codification & Zero Redundancy
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 font-body">
                Resolving inconsistent vendor part numbers across Indian oil CPSEs.
              </p>
            </div>

            {/* Floating Circular Seal Icon at Intersection */}
            <div className="absolute top-6 right-8 w-14 h-14 rounded-full bg-blue-900 border-4 border-white text-white shadow-xl flex items-center justify-center font-bold text-lg">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
          </div>

          {/* Right: Narrative Description & Metrics (Matching Hinton Ref Right Content) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Top Icon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-heading font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>MoPNG Technical Mandate</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              ABOUT MATLINK HARMONIZATION
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-body">
              Every year, Indian oil CPSEs procure tens of thousands of specialized engineering spares — valves, pumps, gaskets, and instrumentation. Because each enterprise maintains separate legacy SAP or ERP databases with ad-hoc descriptions, the same mechanical component exists under multiple divergent part numbers.
            </p>

            <p className="text-slate-600 text-sm leading-relaxed font-body">
              <strong>MatLink</strong> solves this critical SIH challenge by integrating semantic AI embeddings, fuzzy distance scoring, and rule-based MESC taxonomy with authoritative <strong>Human-in-the-Loop Domain Expert Review</strong>. AI recommends; certified CPSE engineers validate.
            </p>

            {/* Read More Link */}
            <div>
              <a
                href="#services"
                className="inline-flex items-center gap-1.5 text-blue-800 font-heading font-bold text-xs uppercase tracking-wider hover:text-blue-950 transition"
              >
                <span>Read Technical Architecture</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* 3 Metric Counters (Exact Match to 3.1+ / 3,196+ / 667+ in ref) */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
              <div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">₹4,200 Cr+</div>
                <div className="text-[11px] font-heading font-bold text-slate-500 uppercase tracking-wider mt-0.5">Inventory Analyzed</div>
              </div>
              <div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">185,000+</div>
                <div className="text-[11px] font-heading font-bold text-slate-500 uppercase tracking-wider mt-0.5">Standardized Spares</div>
              </div>
              <div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">6 CPSEs</div>
                <div className="text-[11px] font-heading font-bold text-slate-500 uppercase tracking-wider mt-0.5">Unified Network</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. "City News / Portal Circulars" Section (Matching Hinton Ref City News) ── */}
      <section id="bulletins" className="py-16 px-4 sm:px-8 bg-[#375073] text-white relative">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-widest text-amber-300 mb-1">BE UPDATED WITH</p>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                PORTAL CIRCULARS & NOTIFICATIONS
              </h2>
            </div>
            <button
              onClick={() => alert('Viewing all official notifications and circulars under MoPNG CPSE Standardization.')}
              className="self-start sm:self-auto px-5 py-2 rounded-md bg-[#e63946] hover:bg-[#d62828] text-white text-xs font-heading font-bold uppercase tracking-wider shadow-sm transition"
            >
              VIEW ALL
            </button>
          </div>

          {/* 4 News Cards in Horizontal Grid (Exact match to Hinton Ref) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {NEWS_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200 text-slate-900 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-xl group"
              >
                <div>
                  <div className="h-36 overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-[#10203a]/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                      {item.tag}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      {item.date}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-900 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#e63946] hover:text-[#b71c1c] transition uppercase tracking-wider">
                    Read More →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Event Strip / Ticker (Exact Match to Hinton Ref dark blue bottom bar) */}
          <div className="bg-[#1b2a42] rounded-xl p-4 sm:p-5 border border-slate-600/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider shrink-0">
              <Calendar className="w-4 h-4" />
              <span>UPCOMING MILESTONES:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-slate-300">
              <div className="flex items-center gap-2 bg-[#253957] px-3 py-2 rounded-lg">
                <span className="w-6 h-6 rounded bg-[#10203a] text-amber-300 font-black text-[11px] flex items-center justify-center shrink-0">01</span>
                <span className="truncate">CPCL-IOCL Joint Review Committee — Oct 18</span>
              </div>
              <div className="flex items-center gap-2 bg-[#253957] px-3 py-2 rounded-lg">
                <span className="w-6 h-6 rounded bg-[#10203a] text-amber-300 font-black text-[11px] flex items-center justify-center shrink-0">02</span>
                <span className="truncate">MESC Class 68 Valve Catalog Sync — Nov 05</span>
              </div>
              <div className="flex items-center gap-2 bg-[#253957] px-3 py-2 rounded-lg">
                <span className="w-6 h-6 rounded bg-[#10203a] text-amber-300 font-black text-[11px] flex items-center justify-center shrink-0">03</span>
                <span className="truncate">Automated Deduplication Run — Every Friday 23:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. "TAKE ACTION" 4-Card Module Grid (Matching Hinton Ref) ── */}
      <section id="services" className="py-20 px-4 sm:px-8 bg-slate-50 relative overflow-hidden">
        {/* Giant Watermark text "SERVICES" */}
        <div className="absolute left-1/2 -translate-x-1/2 top-10 text-[120px] sm:text-[180px] font-heading font-black text-slate-200/60 select-none pointer-events-none tracking-widest uppercase z-0">
          SERVICES
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-widest text-blue-800 mb-1">
                INFORMATION & DIRECT ACCESS
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900">
                TAKE ACTION
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 rounded-md bg-[#e63946] hover:bg-[#d62828] text-white text-xs font-heading font-bold uppercase tracking-wider shadow-sm transition"
              >
                VIEW ALL WORKSPACES
              </Link>
            </div>
          </div>

          {/* 4 Tall Vertical Interactive Cards (Exact match to Hinton Ref) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ACTION_SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="relative group rounded-2xl overflow-hidden shadow-xl min-h-[420px] flex flex-col justify-end p-6 border border-slate-200 transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${service.image}')` }}
                  />

                  {/* Gradient Tint Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-[#102a50]/80 to-[#1e3a6e]/40" />

                  {/* Content on Top */}
                  <div className="relative z-10 space-y-4">
                    {/* Circular Icon in Glass Circle (Exact match to Hinton Ref) */}
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg group-hover:bg-amber-400 group-hover:text-slate-900 transition duration-300">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                        {service.roleTag}
                      </span>
                      <h3 className="font-heading text-lg font-black text-white uppercase tracking-tight mt-2 leading-tight">
                        {service.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mt-2 line-clamp-3 font-body">
                        {service.desc}
                      </p>
                    </div>

                    <Link
                      href={service.href}
                      className="inline-flex items-center gap-2 text-xs font-heading font-bold text-amber-300 hover:text-amber-200 uppercase tracking-wider pt-2 border-t border-white/15 w-full justify-between"
                    >
                      <span>{service.cta}</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Arrows / Pagination Hint */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => alert('Scroll to explore all services.')}
              className="w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
            <button
              onClick={() => alert('Scroll to explore all services.')}
              className="w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 7. "Economic Development" Split Feature Section (Matching Hinton Ref) ── */}
      <section id="impact" className="py-20 px-4 sm:px-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Overlapping Photo Collage */}
          <div className="lg:col-span-6 relative pb-10 sm:pb-16 pr-4 sm:pr-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white max-w-md w-full aspect-[4/5] bg-slate-200">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-medium font-body">
                Inter-Refinery Procurement & Emergency Spares Network
              </div>
            </div>

            {/* Overlapping Badge Card */}
            <div className="absolute bottom-0 right-0 sm:right-6 bg-white rounded-xl shadow-2xl p-4 border border-slate-200 max-w-[280px] sm:max-w-[320px]">
              <div className="rounded-lg overflow-hidden h-28 mb-3 relative">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=400&q=80')`,
                  }}
                />
              </div>
              <h4 className="font-heading text-sm font-extrabold text-slate-900 leading-snug">
                Vibrant Inter-CPSE Sharing Community
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 font-body">
                Enabling rapid emergency spare discovery during major turnaround shutdowns.
              </p>
            </div>

            <div className="absolute top-6 right-8 w-14 h-14 rounded-full bg-amber-400 border-4 border-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>

          {/* Right: Narrative + 4 Bottom Feature Icons (Matching Hinton Ref) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-heading font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Atmanirbhar Bharat & Capital Optimization</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              ECONOMIC DEVELOPMENT & PROCUREMENT RESILIENCE
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-body">
              Standardizing material masters frees up substantial idle working capital currently locked in redundant inventory reserves. When CPCL, IOCL, and ONGC share a unified technical codification syntax, identical valves, flanges, and electrical spares can be shared dynamically across refinery sites.
            </p>

            <div>
              <button
                onClick={() => alert('Opening Economic Impact & ROI Study report.')}
                className="text-xs font-heading font-bold text-blue-800 uppercase tracking-wider hover:text-blue-950 flex items-center gap-1.5"
              >
                <span>Read Economic Whitepaper</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Feature Pills / Boxes (Exact match to Hinton Ref 4 icon boxes) */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center flex flex-col items-center hover:bg-slate-100 transition">
                <Database className="w-6 h-6 text-blue-700 mb-1.5" />
                <span className="text-[11px] font-heading font-bold text-slate-800 uppercase">ERP Integration</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center flex flex-col items-center hover:bg-slate-100 transition">
                <GitMerge className="w-6 h-6 text-emerald-700 mb-1.5" />
                <span className="text-[11px] font-heading font-bold text-slate-800 uppercase">Deduplication</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center flex flex-col items-center hover:bg-slate-100 transition">
                <Tag className="w-6 h-6 text-purple-700 mb-1.5" />
                <span className="text-[11px] font-heading font-bold text-slate-800 uppercase">MESC Standard</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center flex flex-col items-center hover:bg-slate-100 transition">
                <Cpu className="w-6 h-6 text-amber-700 mb-1.5" />
                <span className="text-[11px] font-heading font-bold text-slate-800 uppercase">AI Explainable</span>
              </div>
            </div>

            {/* Indicator Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full bg-blue-900" />
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. "DEPARTMENTS / CPSE ECOSYSTEM" Curved Wave Section (Matching Hinton Ref) ── */}
      <section id="ecosystem" className="relative bg-[#0d2244] text-white pt-24 pb-20 px-4 sm:px-8">
        {/* Curving Top Wave Divider SVG (Exact match to Hinton Ref Wave) */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none z-10 pointer-events-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-16 sm:h-20 text-white fill-current"
          >
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,0 L0,0 Z" />
          </svg>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto space-y-12">
          {/* Header Row with Department Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-widest text-amber-300 mb-1">
                MINISTRY & ALLIED ENTERPRISES
              </p>
              <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                PARTICIPATING CPSEs & DEPARTMENTS
              </h2>
            </div>
            {/* White Pill Toggle on Right (Matching Hinton Ref "ENVIRONMENTAL" pill) */}
            <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20 text-xs font-heading font-bold">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-1.5 rounded-full uppercase tracking-wider transition ${
                  activeCategory === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                ALL CPSEs
              </button>
              <button
                onClick={() => setActiveCategory('refineries')}
                className={`px-4 py-1.5 rounded-full uppercase tracking-wider transition ${
                  activeCategory === 'refineries' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                REFINERIES
              </button>
            </div>
          </div>

          {/* Horizontal Interconnected Node Line (Exact Match to Hinton Ref Circular Department Icons) */}
          <div className="relative">
            {/* Horizontal Line Through Centers */}
            <div className="hidden lg:block absolute top-8 left-12 right-12 h-0.5 bg-blue-400/30 -z-0" />

            {/* Circular Department Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 relative z-10">
              {CPSE_ENTITIES.map((cpse, idx) => (
                <div key={cpse.code} className="flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-[#162f55] border-2 border-amber-400/70 group-hover:border-amber-400 flex items-center justify-center text-amber-300 shadow-lg group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-900 transition duration-200">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-heading text-xs font-black text-white mt-3 uppercase tracking-wider">
                    {cpse.code}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 font-body">
                    {cpse.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Official Government Footer (Matching Hinton Ref Deep Navy Footer) ── */}
      <footer id="contact" className="bg-[#071324] text-slate-300 text-xs pt-16 pb-8 px-4 sm:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Brand Column (Matching Hinton Script Logo in Footer) */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <EmblemPlaceholder size={44} />
                <div>
                  <div className="font-script text-3xl sm:text-4xl text-white font-bold tracking-wide">
                    The Petroleum CPSEs
                  </div>
                  <div className="font-script text-xl text-amber-300 font-light mt-[-4px]">
                    Ministry of Petroleum & Natural Gas
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-body">
                National Artificial Intelligence Portal for Material Master Standardization, Codification & Duplicate Identification across Central Public Sector Enterprises.
              </p>
              <div className="pt-2 text-[11px] text-slate-400 font-body">
                Host Entity: <strong>Chennai Petroleum Corporation Limited (CPCL)</strong>, Manali Refinery, Chennai - 600068.
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Quick Links
              </h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><a href="#home" className="hover:text-amber-300 transition">Portal Home</a></li>
                <li><a href="#about" className="hover:text-amber-300 transition">About Initiative</a></li>
                <li><a href="#services" className="hover:text-amber-300 transition">Core Modules</a></li>
                <li><a href="#bulletins" className="hover:text-amber-300 transition">Gazette Circulars</a></li>
                <li><Link href="/reviewer/harmonized-master" className="hover:text-amber-300 transition">Harmonized Master</Link></li>
              </ul>
            </div>

            {/* Contact Us Column (Matching Hinton Ref Address/Phone format) */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Contact Technical Cell
              </h4>
              <div className="space-y-2.5 text-slate-400 text-xs leading-relaxed">
                <p>
                  CPCL Manali Refinery Complex,<br />
                  Express Highway, Manali,<br />
                  Chennai - 600 068, Tamil Nadu.
                </p>
                <p className="text-slate-300">
                  Phone: +91 (044) 2594-4000<br />
                  Email: material.master@cpcl.co.in
                </p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-300 hover:underline font-semibold"
                >
                  <span>Map & Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* "How Do I..." Quick Search Column (Exact match to Hinton Ref Search Box) */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                How Do I...
              </h4>
              <p className="text-slate-400 text-xs">
                Quickly search guidelines, taxonomy rules, or material catalogs.
              </p>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Ball Valve 600#..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => alert(`Searching MatLink repository for: "${searchQuery || 'Standard Materials'}"`)}
                  className="bg-[#e63946] hover:bg-[#d62828] text-white px-3 py-2 rounded-md font-bold shrink-0 transition"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 block">Digital India & National Informatics Centre compliant.</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 Ministry of Petroleum & Natural Gas, Government of India. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Powered by CPCL Smart Automation Initiative</span>
              <span>•</span>
              <Link href="/login" className="hover:text-slate-300">Staff Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── System Walkthrough Video Modal ── */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-700 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <EmblemPlaceholder size={28} />
                <h3 className="text-sm font-bold text-white">MatLink System Walkthrough & Architecture</h3>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-slate-300 text-sm">
              <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <Play className="w-12 h-12 text-amber-400 mb-3" />
                <h4 className="text-base font-bold text-white mb-1">AI-Driven Material Master Harmonization</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Demonstrating ingestion of CPSE legacy records, cosine distance vector matching, rule-based MESC taxonomy, and human-in-the-loop validation.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Link
                  href="/login?role=REVIEWER"
                  onClick={() => setVideoModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Enter Reviewer Workspace →
                </Link>
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search Modal ── */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-24 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-300 overflow-hidden shadow-2xl animate-in fade-in duration-150 text-slate-900">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search materials, circulars, or CPSE catalogs..."
                className="w-full text-sm outline-none placeholder-slate-400 font-medium"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Suggested Inquiries:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-slate-100 rounded-full cursor-pointer hover:bg-blue-50 hover:text-blue-800">Ball Valve Class 800</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded-full cursor-pointer hover:bg-blue-50 hover:text-blue-800">Centrifugal Pump Spares</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded-full cursor-pointer hover:bg-blue-50 hover:text-blue-800">MESC Group 68 Taxonomy</span>
                <span className="px-2.5 py-1 bg-slate-100 rounded-full cursor-pointer hover:bg-blue-50 hover:text-blue-800">CPCL Ingestion Batch #12</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
