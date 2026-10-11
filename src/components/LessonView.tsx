import React, { useEffect } from 'react';
import type { Lesson, UserProgress } from '../types';
import { SeniorBridgeCallout } from './SeniorBridgeCallout';
import { CodeBlock } from './CodeBlock';
import { Quiz } from './Quiz';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Terminal,
} from 'lucide-react';
import { getAdjacentDays } from '../data';
import { isDayUnlocked } from '../utils/storage';

interface LessonViewProps {
  lesson: Lesson;
  progress: UserProgress;
  onNavigateHome: () => void;
  onSelectDay: (day: number) => void;
  onQuizSubmit: (day: number, answers: Record<string, number>) => void;
  onQuizReset: (day: number) => void;
  onOpenPlaygroundWithCode: (code: string, title: string) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  progress,
  onNavigateHome,
  onSelectDay,
  onQuizSubmit,
  onQuizReset,
  onOpenPlaygroundWithCode,
}) => {
  const { prevDay, nextDay } = getAdjacentDays(lesson.day);
  const dayProgress = progress.days[lesson.day];
  const isPassed = Boolean(dayProgress?.passed);
  const isNextUnlocked = nextDay ? isDayUnlocked(nextDay, progress, true) : false;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lesson.day]);

  const scrollToQuiz = () => {
    const el = document.getElementById('quiz-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between gap-3 pb-4 border-b border-border text-xs">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-surface-muted text-foreground transition font-semibold"
        >
          <Home size={14} />
          <span>Curriculum Home</span>
        </button>

        <div className="flex items-center gap-2">
          {prevDay && (
            <button
              onClick={() => onSelectDay(prevDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-surface-muted text-foreground transition font-semibold"
            >
              <ArrowLeft size={14} />
              <span>Day {prevDay}</span>
            </button>
          )}

          <button
            onClick={scrollToQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition font-semibold"
          >
            <HelpCircle size={14} />
            <span>Jump to Quiz</span>
          </button>

          {nextDay && (
            <button
              disabled={!isNextUnlocked && !isPassed}
              onClick={() => onSelectDay(nextDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Day {nextDay}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </nav>

      {/* Lesson Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
            DAY {lesson.day} OF 14
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground px-2.5 py-1 rounded-xl bg-surface-muted border border-border">
            {lesson.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono ml-auto">
            <Clock size={13} />
            <span>~{lesson.estimatedMinutes} min read</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
          {lesson.title}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {lesson.subtitle}
        </p>

        {isPassed && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={14} />
            <span>Completed & Passed (Score: {dayProgress?.score}%)</span>
          </div>
        )}
      </header>

      {/* Senior Bridge Callout */}
      <SeniorBridgeCallout bridge={lesson.seniorBridge} />

      {/* Key Takeaways Box */}
      <section className="p-6 rounded-2xl bg-surface border border-border shadow-md space-y-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm uppercase tracking-wider">
          <Lightbulb size={16} className="text-amber-400" />
          <span>Executive Key Takeaways for Senior Devs</span>
        </div>
        <ul className="grid grid-cols-1 gap-2.5 pl-1 text-sm text-foreground/90">
          {lesson.keyTakeaways.map((takeaway, idx) => (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Main Lesson Sections */}
      <div className="space-y-10">
        {lesson.sections.map((section) => (
          <section key={section.id} className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {section.title}
            </h2>

            <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line space-y-3">
              {section.content}
            </div>

            {section.codeSnippet && (
              <CodeBlock
                code={section.codeSnippet}
                language="python"
                title={`${section.title.split('.')[1]?.trim() || 'Python'}`}
                runnable={true}
                onRun={(c) => onOpenPlaygroundWithCode(c, section.title)}
              />
            )}

            {section.seniorInsight && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3 text-xs leading-relaxed text-indigo-200">
                <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-300">Senior Insight: </span>
                  <span className="opacity-95">{section.seniorInsight}</span>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Runnable Code Examples Gallery */}
      {lesson.codeExamples.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Interactive Code Examples</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Run directly in WebAssembly or copy to your local environment
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <Terminal size={14} />
              <span>Runnable</span>
            </div>
          </div>

          <div className="space-y-6">
            {lesson.codeExamples.map((ex, exIdx) => (
              <div key={exIdx} className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{ex.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{ex.description}</p>
                  </div>
                </div>

                <CodeBlock
                  code={ex.pythonCode}
                  language="python"
                  runnable={true}
                  onRun={(c) => onOpenPlaygroundWithCode(c, ex.title)}
                />

                {ex.expectedOutput && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Expected Output:
                    </span>
                    <pre className="m-0 whitespace-pre overflow-x-auto">
                      <code>{ex.expectedOutput}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* End of Section Mastery Quiz */}
      <Quiz
        day={lesson.day}
        questions={lesson.quiz}
        dayProgress={dayProgress}
        onQuizSubmit={(answers) => onQuizSubmit(lesson.day, answers)}
        onQuizReset={() => onQuizReset(lesson.day)}
        onNextDay={nextDay ? () => onSelectDay(nextDay) : undefined}
        hasNextDay={Boolean(nextDay)}
      />

      {/* Bottom Navigation */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:bg-surface-muted text-foreground text-xs font-semibold transition"
        >
          <Home size={15} />
          <span>Return to Curriculum</span>
        </button>

        <div className="flex items-center gap-3">
          {prevDay && (
            <button
              onClick={() => onSelectDay(prevDay)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-surface-muted text-foreground text-xs font-semibold transition"
            >
              <ArrowLeft size={15} />
              <span>Day {prevDay}</span>
            </button>
          )}

          {nextDay && (
            <button
              disabled={!isNextUnlocked && !isPassed}
              onClick={() => onSelectDay(nextDay)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <span>Next: Day {nextDay}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </footer>
    </article>
  );
};
