"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative p-2 rounded-xl transition-all duration-300 border focus:outline-none ${
        theme === "dark"
          ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:border-amber-500/50 shadow-sm"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-slate-400 shadow-sm"
      } ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0 text-slate-700" />
      )}
    </button>
  );
}

