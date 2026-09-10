"use client";

import { useEffect } from "react";
import { useAuth, getRoleDashboardPath } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const target = getRoleDashboardPath(user.role.name);
      router.replace(target);
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
        <span className="w-3.5 h-3.5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <span>Routing to Authorized Role Dashboard...</span>
      </div>
    </div>
  );
}
