"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, loginApi, getMeApi } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  getDefaultDashboardRoute: (role?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = "canonix_auth_token";
const USER_STORAGE_KEY = "canonix_auth_user";

export function getRoleDashboardPath(roleName?: string): string {
  switch (roleName) {
    case "SUPER_ADMIN":
      return "/dashboard/super-admin";
    case "CPSE_ADMIN":
      return "/dashboard/cpse-admin";
    case "MATERIAL_EXPERT":
      return "/dashboard/material-expert";
    case "PROCUREMENT_ANALYST":
      return "/dashboard/procurement-analyst";
    default:
      return "/login";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Rehydrate auth state on client mount
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Silently verify token with backend
        getMeApi(savedToken)
          .then((verifiedUser) => {
            setUser(verifiedUser);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(verifiedUser));
          })
          .catch(() => {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setToken(null);
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await loginApi(email, password);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user || !user.role) return false;
    if (user.role.name === "SUPER_ADMIN") return true; // Super Admin has universal access
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role.name);
  };

  const getDefaultDashboardRoute = (roleName?: string): string => {
    return getRoleDashboardPath(roleName || user?.role?.name);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasRole,
        getDefaultDashboardRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
