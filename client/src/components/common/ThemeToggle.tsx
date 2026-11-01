'use client';

import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
      className={`p-2 transition-colors border flex items-center gap-2 ${
        theme === 'dark'
          ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold uppercase tracking-wider">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
