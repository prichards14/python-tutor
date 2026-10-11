import type { UserProgress, DayProgress, QuizQuestion } from '../types';

const STORAGE_KEY = 'python_senior_tutor_progress_v1';

export function getInitialProgress(): UserProgress {
  return {
    days: {},
    currentDay: 1,
    theme: 'dark',
  };
}

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialProgress();
    const parsed = JSON.parse(raw);
    return {
      ...getInitialProgress(),
      ...parsed,
    };
  } catch (e) {
    console.error('Failed to load progress from localStorage:', e);
    return getInitialProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage:', e);
  }
}

export function getDayProgress(day: number, progress: UserProgress): DayProgress | undefined {
  return progress.days[day];
}

export function recordQuizAttempt(
  day: number,
  answers: Record<string, number>,
  questions: QuizQuestion[],
  progress: UserProgress
): { progress: UserProgress; dayProgress: DayProgress } {
  let correctCount = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctIndex) {
      correctCount++;
    }
  }

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= 80;

  const dayProgress: DayProgress = {
    day,
    completed: passed,
    score,
    correctCount,
    totalQuestions,
    passed,
    answers,
    completedAt: passed ? new Date().toISOString() : progress.days[day]?.completedAt,
    lastAttemptAt: new Date().toISOString(),
  };

  const updatedProgress: UserProgress = {
    ...progress,
    days: {
      ...progress.days,
      [day]: dayProgress,
    },
  };

  saveProgress(updatedProgress);
  return { progress: updatedProgress, dayProgress };
}

export function resetDayQuiz(day: number, progress: UserProgress): UserProgress {
  const updatedDays = { ...progress.days };
  delete updatedDays[day];

  const updatedProgress: UserProgress = {
    ...progress,
    days: updatedDays,
  };

  saveProgress(updatedProgress);
  return updatedProgress;
}

export function resetAllProgress(): UserProgress {
  const reset = getInitialProgress();
  saveProgress(reset);
  return reset;
}

export function isDayUnlocked(day: number, progress: UserProgress, allowFreeNavigation = false): boolean {
  if (day === 1 || allowFreeNavigation) return true;
  // Requires previous day to be passed (>=80%)
  const prevDayProgress = progress.days[day - 1];
  return Boolean(prevDayProgress && prevDayProgress.passed);
}

export function calculateOverallStats(progress: UserProgress, totalDays = 14) {
  const completedDays = Object.values(progress.days).filter((d) => d.passed).length;
  const attemptedDays = Object.values(progress.days).length;
  
  let totalScoreSum = 0;
  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;

  for (const d of Object.values(progress.days)) {
    totalScoreSum += d.score;
    totalQuestionsAnswered += d.totalQuestions;
    totalCorrect += d.correctCount;
  }

  const averageScore = attemptedDays > 0 ? Math.round(totalScoreSum / attemptedDays) : 0;
  const progressPercentage = Math.round((completedDays / totalDays) * 100);

  return {
    completedDays,
    totalDays,
    progressPercentage,
    averageScore,
    totalQuestionsAnswered,
    totalCorrect,
    allPassed: completedDays === totalDays,
  };
}

export function exportProgressAsJson(progress: UserProgress): string {
  return JSON.stringify(progress, null, 2);
}

export function importProgressFromJson(jsonString: string): UserProgress | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.days === 'object') {
      const merged: UserProgress = {
        ...getInitialProgress(),
        ...parsed,
      };
      saveProgress(merged);
      return merged;
    }
    return null;
  } catch (e) {
    console.error('Invalid JSON progress import:', e);
    return null;
  }
}
