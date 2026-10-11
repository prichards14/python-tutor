import React, { useState } from 'react';
import type { Lesson, UserProgress } from '../types';
import { calculateOverallStats, isDayUnlocked } from '../utils/storage';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
  RotateCcw,
  Award,
  Layers,
  Database,
  Globe,
  ShieldCheck,
} from 'lucide-react';

interface CurriculumViewProps {
  lessons: Lesson[];
  progress: UserProgress;
  onSelectDay: (day: number) => void;
  onResetDay: (day: number) => void;
  onOpenPlayground: () => void;
  onOpenCertificate: () => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  lessons,
  progress,
  onSelectDay,
  onResetDay,
  onOpenPlayground,
  onOpenCertificate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allowFreeNavigation, setAllowFreeNavigation] = useState(false);

  const stats = calculateOverallStats(progress, lessons.length);

  const categoryIcons: Record<string, React.ReactNode> = {
    core: <Layers size={14} />,
    data: <Database size={14} />,
    api: <Globe size={14} />,
    architecture: <ShieldCheck size={14} />,
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `day ${lesson.day}`.includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || lesson.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-border bg-gradient-to-br from-surface via-surface to-surface-muted shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles size={14} />
            <span>Senior Software Engineer Fast-Track</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            Python for Senior Engineers
          </h1>

          <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Tailored specifically for engineers with backgrounds in <strong>C64 BASIC</strong>, <strong>C & Modula-2</strong>, and enterprise <strong>C# & JavaScript</strong>. Come up to speed rapidly in processing data, consuming and creating APIs with FastAPI, and production engineering practices.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2.5 py-1 rounded-md bg-surface border border-border">14 Daily Units</span>
            <span className="px-2.5 py-1 rounded-md bg-surface border border-border">8 Questions per Day</span>
            <span className="px-2.5 py-1 rounded-md bg-surface border border-border">≥80% Pass Requirement</span>
            <span className="px-2.5 py-1 rounded-md bg-surface border border-border">Local Storage Saved</span>
          </div>
        </div>

        {/* Decorative corner element */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 rounded-full bg-gradient-to-tl from-indigo-500/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none"></div>
      </section>

      {/* Progress Dashboard Card */}
      <section className="p-6 sm:p-8 rounded-3xl border border-border bg-surface shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Course Telemetry
            </span>
            <h2 className="text-2xl font-black text-foreground mt-1">Your Progress Overview</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {stats.allPassed && (
              <button
                onClick={onOpenCertificate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
              >
                <Award size={16} />
                <span>View Certificate</span>
              </button>
            )}

            <button
              onClick={onOpenPlayground}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-surface-muted text-foreground text-xs font-semibold transition"
            >
              <span>Open Python Playground</span>
            </button>

            {/* Free Navigation Toggle */}
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pl-2 border-l border-border">
              <input
                type="checkbox"
                checked={allowFreeNavigation}
                onChange={(e) => setAllowFreeNavigation(e.target.checked)}
                className="rounded border-border text-primary focus:ring-0 cursor-pointer"
              />
              <span>Unlock all days (Explore mode)</span>
            </label>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border">
            <div className="text-xs text-muted-foreground font-medium">Days Passed (≥80%)</div>
            <div className="text-3xl font-black text-foreground mt-1">
              {stats.completedDays} <span className="text-sm font-normal text-muted-foreground">/ 14</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-border mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border">
            <div className="text-xs text-muted-foreground font-medium">Average Quiz Score</div>
            <div className="text-3xl font-black text-foreground mt-1">
              {stats.averageScore}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-3 font-mono">
              Across attempted sections
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border">
            <div className="text-xs text-muted-foreground font-medium">Questions Answered</div>
            <div className="text-3xl font-black text-foreground mt-1">
              {stats.totalCorrect} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalQuestionsAnswered || 112}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-3 font-mono">
              Correct responses
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border">
            <div className="text-xs text-muted-foreground font-medium">Passing Criteria</div>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              80%
            </div>
            <div className="text-[11px] text-muted-foreground mt-3 font-mono">
              Required to unlock next day
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-surface-muted border border-border text-xs">
          {[
            { id: 'all', label: 'All 14 Days' },
            { id: 'core', label: 'Core Language', icon: categoryIcons.core },
            { id: 'data', label: 'Data Processing', icon: categoryIcons.data },
            { id: 'api', label: 'Web APIs', icon: categoryIcons.api },
            { id: 'architecture', label: 'Architecture', icon: categoryIcons.architecture },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
          />
        </div>
      </section>

      {/* 14 Daily Sections Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => {
          const dayProg = progress.days[lesson.day];
          const isPassed = Boolean(dayProg?.passed);
          const isAttempted = Boolean(dayProg?.lastAttemptAt);
          const isUnlocked = isDayUnlocked(lesson.day, progress, allowFreeNavigation);

          return (
            <div
              key={lesson.day}
              className={`group flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden ${
                isUnlocked
                  ? 'bg-surface hover:shadow-2xl hover:border-primary/50'
                  : 'bg-surface/50 border-border/50 opacity-70'
              } ${isPassed ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-border'}`}
            >
              {/* Card Header Top */}
              <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    DAY {lesson.day}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    {categoryIcons[lesson.category]}
                    <span>{lesson.category}</span>
                  </span>
                </div>

                {/* Status Badge */}
                {isPassed ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={13} />
                    <span>Passed: {dayProg.score}%</span>
                  </span>
                ) : isAttempted ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span>Retake Needed: {dayProg.score}%</span>
                  </span>
                ) : isUnlocked ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-muted text-muted-foreground border border-border">
                    Available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-muted text-muted-foreground border border-border">
                    <Lock size={12} />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="px-6 flex-1">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition leading-snug">
                  {lesson.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {lesson.subtitle}
                </p>
              </div>

              {/* Meta stats */}
              <div className="px-6 py-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>{lesson.estimatedMinutes} mins</span>
                </div>
                <div>
                  <span>8 Questions</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-surface-muted/40 border-t border-border flex items-center justify-between gap-2">
                {isAttempted && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Reset quiz for Day ${lesson.day}? This clears your saved answers so you can retake it.`)) {
                        onResetDay(lesson.day);
                      }
                    }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition"
                    title="Reset quiz answers for this day"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}

                <button
                  disabled={!isUnlocked}
                  onClick={() => onSelectDay(lesson.day)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition ${
                    isUnlocked
                      ? isPassed
                        ? 'bg-surface hover:bg-surface-muted text-foreground border border-border'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'
                      : 'bg-surface-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {isPassed ? (
                    <>
                      <span>Review Content & Quiz</span>
                      <ArrowRight size={14} />
                    </>
                  ) : isUnlocked ? (
                    <>
                      <span>{isAttempted ? 'Retake Quiz / Study' : 'Start Lesson'}</span>
                      <ArrowRight size={14} />
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Pass Day {lesson.day - 1} to Unlock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
