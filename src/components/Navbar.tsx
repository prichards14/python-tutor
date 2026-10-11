import React from 'react';
import { Terminal, Moon, Sun, BookOpen, Award, RotateCcw, Download, Upload } from 'lucide-react';
import type { UserProgress } from '../types';
import { calculateOverallStats } from '../utils/storage';

interface NavbarProps {
  progress: UserProgress;
  onNavigateHome: () => void;
  onOpenPlayground: () => void;
  onOpenCertificate: () => void;
  currentDay: number | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onResetAll: () => void;
  onExport: () => void;
  onImport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  progress,
  onNavigateHome,
  onOpenPlayground,
  onOpenCertificate,
  currentDay,
  theme,
  onToggleTheme,
  onResetAll,
  onExport,
  onImport,
}) => {
  const stats = calculateOverallStats(progress);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/85 backdrop-blur-md transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
              <span className="font-mono font-black text-lg">Py</span>
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-foreground block group-hover:text-primary transition">
                Python Senior Tutor
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                C64 • C • C# • JS → Python
              </span>
            </div>
          </button>

          {currentDay && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                Day {currentDay} of 14
              </span>
            </div>
          )}
        </div>

        {/* Center / Navigation items */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onNavigateHome}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentDay === null
                ? 'bg-surface-muted text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
            }`}
          >
            <BookOpen size={14} />
            <span>Curriculum</span>
          </button>

          <button
            onClick={onOpenPlayground}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
            title="Open in-browser Python 3.12 WebAssembly Playground"
          >
            <Terminal size={14} className="text-emerald-400" />
            <span>Playground</span>
          </button>

          {stats.allPassed && (
            <button
              onClick={onOpenCertificate}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
            >
              <Award size={14} />
              <span>Certificate</span>
            </button>
          )}
        </div>

        {/* Right tools: Progress, theme, data management */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Progress pill */}
          <div
            onClick={onNavigateHome}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-muted border border-border text-xs hover:border-border-hover transition"
            title={`Completed: ${stats.completedDays}/14 (${stats.progressPercentage}%) • Avg Score: ${stats.averageScore}%`}
          >
            <div className="w-16 h-2 rounded-full bg-border overflow-hidden hidden sm:block">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              ></div>
            </div>
            <span className="font-mono font-bold text-foreground">
              {stats.completedDays}/14
            </span>
          </div>

          {/* Quick Playground Icon for Mobile */}
          <button
            onClick={onOpenPlayground}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
            title="Open Python Playground"
          >
            <Terminal size={18} className="text-emerald-400" />
          </button>

          {/* Export / Import Menu Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={onExport}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
              title="Export progress to JSON file"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onImport}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
              title="Import progress from JSON file"
            >
              <Upload size={16} />
            </button>
            <button
              onClick={onResetAll}
              className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Reset all course progress"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
