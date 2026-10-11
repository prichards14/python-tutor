import { useState, useEffect } from 'react';
import type { UserProgress } from './types';
import { allLessons, getLessonByDay } from './data';
import {
  loadProgress,
  recordQuizAttempt,
  resetDayQuiz,
  resetAllProgress,
  exportProgressAsJson,
  importProgressFromJson,
  saveProgress,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { CurriculumView } from './components/CurriculumView';
import { LessonView } from './components/LessonView';
import { PlaygroundModal } from './components/PlaygroundModal';
import { CertificateModal } from './components/CertificateModal';

export function App() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [playgroundInitialCode, setPlaygroundInitialCode] = useState<string>('');
  const [playgroundTitle, setPlaygroundTitle] = useState<string>('Python 3.12 Playground');
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(progress.theme === 'light' ? 'light' : 'dark');

  // Handle Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const dayMatch = hash.match(/^#\/day\/(\d+)$/);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1], 10);
        if (dayNum >= 1 && dayNum <= 14) {
          setCurrentDay(dayNum);
          return;
        }
      }
      // Default to curriculum home
      setCurrentDay(null);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync Theme with HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const updated: UserProgress = { ...progress, theme: nextTheme };
    setProgress(updated);
    saveProgress(updated);
  };

  const handleNavigateHome = () => {
    window.location.hash = '#/';
    setCurrentDay(null);
  };

  const handleSelectDay = (day: number) => {
    window.location.hash = `#/day/${day}`;
    setCurrentDay(day);
  };

  const handleQuizSubmit = (day: number, answers: Record<string, number>) => {
    const lesson = getLessonByDay(day);
    if (!lesson) return;

    const { progress: updatedProgress } = recordQuizAttempt(
      day,
      answers,
      lesson.quiz,
      progress
    );
    setProgress(updatedProgress);
  };

  const handleQuizReset = (day: number) => {
    const updated = resetDayQuiz(day, progress);
    setProgress(updated);
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        'Are you sure you want to reset ALL progress and scores across all 14 days? This cannot be undone.'
      )
    ) {
      const reset = resetAllProgress();
      setProgress(reset);
      handleNavigateHome();
    }
  };

  const handleExport = () => {
    const dataStr = exportProgressAsJson(progress);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `python-tutor-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = importProgressFromJson(text);
        if (imported) {
          setProgress(imported);
          alert('Progress imported successfully!');
        } else {
          alert('Invalid progress JSON file.');
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to read import file.');
      }
    };
    input.click();
  };

  const handleOpenPlaygroundWithCode = (code: string, snippetTitle: string) => {
    setPlaygroundInitialCode(code);
    setPlaygroundTitle(snippetTitle);
    setPlaygroundOpen(true);
  };

  const currentLesson = currentDay ? getLessonByDay(currentDay) : undefined;
  const passedDaysCount = Object.values(progress.days).filter((d) => d.passed).length;
  const averageScore =
    passedDaysCount > 0
      ? Math.round(
          Object.values(progress.days).reduce((acc, d) => acc + d.score, 0) /
            Object.values(progress.days).length
        )
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Header Navbar */}
      <Navbar
        progress={progress}
        onNavigateHome={handleNavigateHome}
        onOpenPlayground={() => {
          setPlaygroundInitialCode('');
          setPlaygroundTitle('Python 3.12 WebAssembly Playground');
          setPlaygroundOpen(true);
        }}
        onOpenCertificate={() => setCertificateOpen(true)}
        currentDay={currentDay}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onResetAll={handleResetAll}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentLesson ? (
          <LessonView
            lesson={currentLesson}
            progress={progress}
            onNavigateHome={handleNavigateHome}
            onSelectDay={handleSelectDay}
            onQuizSubmit={handleQuizSubmit}
            onQuizReset={handleQuizReset}
            onOpenPlaygroundWithCode={handleOpenPlaygroundWithCode}
          />
        ) : (
          <CurriculumView
            lessons={allLessons}
            progress={progress}
            onSelectDay={handleSelectDay}
            onResetDay={handleQuizReset}
            onOpenPlayground={() => {
              setPlaygroundInitialCode('');
              setPlaygroundTitle('Python 3.12 WebAssembly Playground');
              setPlaygroundOpen(true);
            }}
            onOpenCertificate={() => setCertificateOpen(true)}
          />
        )}
      </main>

      {/* Global Interactive Playground Modal */}
      <PlaygroundModal
        isOpen={playgroundOpen}
        onClose={() => setPlaygroundOpen(false)}
        initialCode={playgroundInitialCode}
        title={playgroundTitle}
      />

      {/* Course Certificate Modal */}
      <CertificateModal
        isOpen={certificateOpen}
        onClose={() => setCertificateOpen(false)}
        completedCount={passedDaysCount}
        averageScore={averageScore}
      />

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <span>Python Tutor SPA</span>
            <span>•</span>
            <span>Senior Software Engineer Fast-Track</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>LocalStorage Tracked</span>
            <span>•</span>
            <span>GitHub Pages Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
