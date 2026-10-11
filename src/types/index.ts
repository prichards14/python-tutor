export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  seniorTrap?: string; // Specific callout on why C#/C/JS developers commonly pick a wrong answer
}

export interface SeniorBridge {
  csharp?: string;
  c_modula2?: string;
  javascript?: string;
  c64_basic?: string;
}

export interface CodeExample {
  title: string;
  description: string;
  pythonCode: string;
  runnable?: boolean;
  expectedOutput?: string;
}

export interface LessonSection {
  id: string;
  title: string;
  content: string; // Markdown or rich text
  codeSnippet?: string;
  seniorInsight?: string;
}

export interface Lesson {
  day: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  category: 'core' | 'data' | 'api' | 'architecture';
  seniorBridge: SeniorBridge;
  overview: string;
  keyTakeaways: string[];
  sections: LessonSection[];
  codeExamples: CodeExample[];
  quiz: QuizQuestion[];
}

export interface DayProgress {
  day: number;
  completed: boolean;
  score: number; // percentage 0-100
  correctCount: number;
  totalQuestions: number;
  passed: boolean; // score >= 80
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  completedAt?: string;
  lastAttemptAt?: string;
}

export interface UserProgress {
  days: Record<number, DayProgress>;
  currentDay: number;
  theme: 'dark' | 'light' | 'system';
}
