'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Loader2 } from 'lucide-react';

export default function DataManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push('/login?role=DATA_MANAGER'); return; }
    if (user && user.role !== 'DATA_MANAGER') { router.push('/login?role=DATA_MANAGER'); }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
