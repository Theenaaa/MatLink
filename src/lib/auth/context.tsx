'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';

// ============================================================
// DEMO USERS — for prototype demonstration only
// NOT a real authentication mechanism
// ============================================================
const DEMO_USERS: Record<UserRole, User> = {
  REVIEWER: {
    id: 'USER-001',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@cpse-reviewer.gov.in',
    role: 'REVIEWER',
    department: 'Materials Engineering',
    cpse: 'Central Harmonization Team',
    avatarInitials: 'RK',
  },
  DATA_MANAGER: {
    id: 'USER-003',
    name: 'Anita Singh',
    email: 'anita.singh@cpse-dm.gov.in',
    role: 'DATA_MANAGER',
    department: 'Data Management',
    cpse: 'Central Harmonization Team',
    avatarInitials: 'AS',
  },
  ADMIN: {
    id: 'USER-004',
    name: 'System Administrator',
    email: 'admin@cpse-platform.gov.in',
    role: 'ADMIN',
    department: 'IT Administration',
    cpse: 'Central Harmonization Team',
    avatarInitials: 'SA',
  },
};

// ============================================================
// AUTH CONTEXT
// ============================================================
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// AUTH PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('matlink_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistUser = (u: User) => {
    sessionStorage.setItem('matlink_user', JSON.stringify(u));
    setUser(u);
  };

  const login = async (
    email: string,
    _password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    // Simulate async network call
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);

    // Find a demo user matching email
    const found = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (found) {
      persistUser(found);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials. Use a demo account below.' };
  };

  const loginAsDemo = (role: UserRole) => {
    const u = DEMO_USERS[role];
    persistUser(u);
    // Caller handles redirect — preserves query-param role preselection
  };

  const logout = () => {
    sessionStorage.removeItem('matlink_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOKS
// ============================================================
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const ROLE_HOME: Record<UserRole, string> = {
  REVIEWER: '/reviewer/review-queue',
  DATA_MANAGER: '/data-manager/dataset-upload',
  ADMIN: '/admin/dashboard',
};

export function useRequireRole(allowedRoles: UserRole[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && !allowedRoles.includes(user.role)) {
      router.push(ROLE_HOME[user.role]);
    }
  }, [isLoading, isAuthenticated, user, router, allowedRoles]);

  return { user, isAuthenticated, isLoading };
}
