'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  UserCheck,
  Database,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import type { UserRole } from '@/types';

// ── Ashoka Chakra Precomputed Spokes (Prevents Hydration Mismatch) ──
const ASHOKA_CHAKRA_SPOKES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  return {
    x2: (20 + 13 * Math.cos(angle)).toFixed(2),
    y2: (20 + 13 * Math.sin(angle)).toFixed(2),
  };
});

function EmblemMini({ size = 36 }: { size?: number }) {
  return (
    <div
      aria-label="Government of India Emblem"
      style={{ width: size, height: size }}
      className="rounded-full border border-amber-500/50 bg-amber-50 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
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

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(4, 'Minimum 4 characters required'),
});
type LoginForm = z.infer<typeof loginSchema>;

interface RoleMetaItem {
  label: string;
  badge: string;
  subTitle: string;
  demoUser: string;
  demoEmail: string;
  destination: string;
  icon: React.ElementType;
}

const ROLE_DETAILS: Record<UserRole, RoleMetaItem> = {
  REVIEWER: {
    label: 'Domain Expert / Reviewer',
    badge: 'Reviewer Portal',
    subTitle: 'Technical validation of AI-recommended material master records',
    demoUser: 'Dr. Rajesh Kumar',
    demoEmail: 'rajesh.kumar@cpse-reviewer.gov.in',
    destination: '/reviewer/review-queue',
    icon: UserCheck,
  },
  DATA_MANAGER: {
    label: 'Data Manager',
    badge: 'Data Manager Portal',
    subTitle: 'CPSE catalog ingestion, ERP dataset staging, and batch jobs',
    demoUser: 'Anita Singh',
    demoEmail: 'anita.singh@cpse-dm.gov.in',
    destination: '/data-manager/dataset-upload',
    icon: Database,
  },
  ADMIN: {
    label: 'System Administrator',
    badge: 'Admin Console',
    subTitle: 'Enterprise compliance, audit log scrutiny, and CPSE node policy',
    demoUser: 'System Administrator',
    demoEmail: 'admin@cpse-platform.gov.in',
    destination: '/admin/dashboard',
    icon: ShieldCheck,
  },
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginAsDemo } = useAuth();

  // Read role from query param (?role=REVIEWER). Defaults to REVIEWER.
  const paramRole = searchParams.get('role') as UserRole | null;
  const activeRole: UserRole = paramRole && ROLE_DETAILS[paramRole] ? paramRole : 'REVIEWER';

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const currentRole = ROLE_DETAILS[activeRole];
  const RoleIcon = currentRole.icon;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: currentRole.demoEmail,
      password: 'demoPassword123',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      router.push(currentRole.destination);
    } else {
      setServerError(result.error ?? 'Authentication failed');
    }
  };

  const handleInstantDemoLogin = () => {
    loginAsDemo(activeRole);
    router.push(currentRole.destination);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#0d2244] font-body text-white">
      {/* ── Background: Dramatic Coastal Refinery Scenery with Gradient Overlay ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85')`,
        }}
      />
      {/* Deep Atmospheric Gradient Overlay matching current website theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d2244]/90 via-[#10203a]/75 to-[#0a1628]/85 backdrop-brightness-75" />

      {/* ── Top Tricolor National Strip ── */}
      <div className="relative z-20 h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600 shrink-0 shadow-sm" />

      {/* ── Top Header Navigation ── */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EmblemMini size={38} />
          <div className="flex flex-col">
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-300 font-heading">
              Government of India
            </div>
            <div className="text-xs font-semibold text-slate-200">
              Ministry of Petroleum & Natural Gas — CPCL
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold font-heading text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* ── Main Split View Container (Hero Text on Left + Frosted Card on Right) ── */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 py-6 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* Left Side: Dramatic Hero Headline & Brand Identity */}
        <div className="flex-1 max-w-xl space-y-6 text-left">
          {/* Brand Badge */}
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              MATLINK
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black tracking-wider uppercase font-heading">
              CPCL • MoPNG
            </span>
          </div>

          {/* Big Bold Condensed Headline (Matching reference image "EXPLORE HORIZONS") */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-white uppercase leading-[0.95] drop-shadow-lg">
              STANDARDIZE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-blue-200">
                &amp; HARMONIZE
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-200 font-medium font-body leading-snug drop-shadow">
              Where Multi-Enterprise Catalogs Become Unified.
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-body max-w-lg">
            AI-driven automated deduplication, cross-enterprise catalog reconciliation, and authoritative domain expert verification for Chennai Petroleum Corporation Limited and all MoPNG CPSEs.
          </p>

          {/* Security & Compliance Highlights */}
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-300 font-heading">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>MoPNG Certified</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/15">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>256-Bit Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Real-time CPSE Sync</span>
            </div>
          </div>
        </div>

        {/* Right Side: Frosted Glassmorphic Login Card (Matching Reference Image) */}
        <div className="w-full max-w-md shrink-0">
          <div className="backdrop-blur-2xl bg-white/20 border border-white/30 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-5 transition-all">
            {/* Active Role Identifier (Shows ONLY the Reviewer Login) */}
            <div className="pb-3 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/25">
                  <RoleIcon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-heading">
                    {currentRole.badge}
                  </div>
                  <div className="text-sm font-bold text-white font-heading">
                    {currentRole.label}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                Authorized
              </span>
            </div>

            {/* Error message */}
            {serverError && (
              <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-400/40 rounded-xl px-3.5 py-2.5 text-xs text-rose-100">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wider font-heading">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="login-email-input"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-body shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-300 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/90 uppercase tracking-wider font-heading">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    placeholder="************"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-body shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-300 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('Password reset is managed via CPCL MoPNG Active Directory Service.')}
                  className="text-xs text-white/80 hover:text-white underline font-body transition"
                >
                  Forgot password?
                </button>
              </div>

              {/* SIGN IN Button (Matching blue button in reference image) */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-black text-sm tracking-wider uppercase font-heading shadow-lg shadow-blue-900/40 transition transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>SIGN IN</span>
                )}
              </button>
            </form>

            {/* ── or ── Divider (Matching Reference Image) */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/30" />
              <span className="text-xs text-white/70 font-medium uppercase tracking-wider font-heading">or</span>
              <div className="flex-1 h-px bg-white/30" />
            </div>

            {/* 1-Click Instant Demo Reviewer Access (Matching Social Login placement in reference image) */}
            <button
              id="instant-demo-access-btn"
              onClick={handleInstantDemoLogin}
              className="w-full py-3 px-4 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold font-heading flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-700">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>1-Click Reviewer Access ({currentRole.demoUser})</span>
            </button>

            {/* Bottom Card Footer */}
            <div className="pt-2 text-center text-xs text-white/75 font-body">
              <span>Are you new? </span>
              <button
                type="button"
                onClick={() => alert('New CPCL domain experts must request access through the MoPNG Portal Admin.')}
                className="text-white font-bold underline hover:text-amber-300 transition"
              >
                Contact Administrator
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-20 w-full px-6 sm:px-12 py-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-white/60 font-body gap-2">
        <div>Smart India Hackathon 2026 Prototype • Ministry of Petroleum &amp; Natural Gas</div>
        <div className="flex items-center gap-4">
          <span>CPCL Manali Refinery Node</span>
          <span>•</span>
          <span className="font-mono text-[11px]">v1.4-production</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d2244] flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
