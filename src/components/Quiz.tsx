import React, { useState } from 'react';
import type { QuizQuestion, DayProgress } from '../types';
import { CheckCircle2, XCircle, RotateCcw, Award, ArrowRight, AlertTriangle, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizProps {
  day: number;
  questions: QuizQuestion[];
  dayProgress?: DayProgress;
  onQuizSubmit: (answers: Record<string, number>) => void;
  onQuizReset: () => void;
  onNextDay?: () => void;
  hasNextDay: boolean;
}

export const Quiz: React.FC<QuizProps> = ({
  day,
  questions,
  dayProgress,
  onQuizSubmit,
  onQuizReset,
  onNextDay,
  hasNextDay,
}) => {
  // If user already took the quiz and has progress recorded, show their answers; otherwise empty
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    dayProgress?.answers || {}
  );
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(Boolean(dayProgress?.lastAttemptAt));

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (hasSubmitted) return; // Prevent changing after submit until reset
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const isComplete = answeredCount === questions.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;

    onQuizSubmit(selectedAnswers);
    setHasSubmitted(true);

    // Calculate score
    let correct = 0;
    for (const q of questions) {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    }
    const scorePct = Math.round((correct / questions.length) * 100);

    if (scorePct >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if confetti fails
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset this quiz? This will clear your recorded answers and score for this section so you can retake it.')) {
      setSelectedAnswers({});
      setHasSubmitted(false);
      onQuizReset();
    }
  };

  const score = dayProgress?.score ?? 0;
  const passed = dayProgress?.passed ?? false;
  const correctCount = dayProgress?.correctCount ?? 0;

  return (
    <div id="quiz-section" className="quiz-container rounded-2xl border p-6 md:p-8 my-8 shadow-xl bg-surface">
      {/* Quiz Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              End of Day {day} Assessment
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {questions.length} Questions • 4 Options Each
            </span>
          </div>
          <h2 className="text-2xl font-black mt-2 text-foreground">Section Mastery Quiz</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Achieve <span className="font-semibold text-emerald-400">≥ 80%</span> to earn section credit and unlock Day {day + 1}.
          </p>
        </div>

        {hasSubmitted && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-surface-muted text-foreground transition"
              title="Reset and retake this quiz from scratch"
            >
              <RotateCcw size={16} />
              <span>Reset & Retake</span>
            </button>
          </div>
        )}
      </div>

      {/* Submitted Result Score Banner */}
      {hasSubmitted && (
        <div
          className={`my-6 p-6 rounded-2xl border ${
            passed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl ${
                  passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {passed ? <Award size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {passed ? 'Assessment Passed! Credit Received' : 'Assessment Attempted (Retake Recommended)'}
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  You answered <span className="font-bold">{correctCount} of {questions.length}</span> questions correctly (
                  <span className="font-bold">{score}%</span>).
                  {passed
                    ? ' Outstanding job! You have satisfied the ≥80% requirement.'
                    : ' A minimum score of 80% is required to receive credit. Review the detailed explanations below and click "Reset & Retake" to try again.'}
                </p>
              </div>
            </div>

            {passed && hasNextDay && onNextDay && (
              <button
                onClick={onNextDay}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shrink-0"
              >
                <span>Advance to Day {day + 1}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      <form onSubmit={handleSubmit} className="space-y-8 mt-6">
        {questions.map((q, qIndex) => {
          const userSelectedIndex = selectedAnswers[q.id];
          const isAnswered = userSelectedIndex !== undefined;
          const isCorrect = isAnswered && userSelectedIndex === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`p-5 md:p-6 rounded-2xl border transition ${
                hasSubmitted
                  ? isCorrect
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-rose-500/40 bg-rose-950/10'
                  : 'border-border bg-surface-muted/40 hover:border-border-hover'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-primary/10 text-primary">
                    Q{qIndex + 1}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {hasSubmitted ? (isCorrect ? 'Correct' : 'Incorrect') : isAnswered ? 'Answered' : 'Pending'}
                  </span>
                </div>

                {hasSubmitted && (
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={16} />
                        <span>Correct (+1)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400">
                        <XCircle size={16} />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Question Text */}
              <p className="font-semibold text-base text-foreground mb-3 whitespace-pre-line leading-relaxed">
                {q.question}
              </p>

              {/* Optional Code Snippet inside Question */}
              {q.codeSnippet && (
                <div className="my-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                  <pre className="m-0 whitespace-pre">
                    <code>{q.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* 4 Answer Options */}
              <div className="grid grid-cols-1 gap-2.5 mt-4">
                {q.options.map((optText, optIndex) => {
                  const isSelected = userSelectedIndex === optIndex;
                  const isThisCorrect = optIndex === q.correctIndex;

                  let optionStyle = 'border-border bg-surface hover:bg-surface-muted text-foreground';
                  if (hasSubmitted) {
                    if (isThisCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-semibold';
                    } else if (isSelected && !isThisCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-500/20 text-rose-200 line-through';
                    } else {
                      optionStyle = 'border-border/50 bg-surface/40 text-muted-foreground opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-primary bg-primary/15 text-primary font-semibold ring-2 ring-primary/20';
                  }

                  const optionLetter = ['A', 'B', 'C', 'D'][optIndex];

                  return (
                    <button
                      type="button"
                      key={optIndex}
                      disabled={hasSubmitted}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                      className={`flex items-start text-left p-3.5 rounded-xl border text-sm transition cursor-pointer disabled:cursor-default ${optionStyle}`}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md font-mono text-xs font-bold mr-3 shrink-0 bg-surface-muted/60 border border-border">
                        {optionLetter}
                      </span>
                      <span className="flex-1 pt-0.5 leading-relaxed">{optText}</span>
                      {hasSubmitted && isThisCorrect && (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 ml-2 mt-0.5" />
                      )}
                      {hasSubmitted && isSelected && !isThisCorrect && (
                        <XCircle size={18} className="text-rose-400 shrink-0 ml-2 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Senior Trap (revealed after submission) */}
              {hasSubmitted && (
                <div className="mt-5 pt-4 border-t border-border space-y-3 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-surface border border-border flex items-start gap-2.5">
                    <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-foreground">Explanation: </span>
                      <span className="text-muted-foreground">{q.explanation}</span>
                    </div>
                  </div>

                  {q.seniorTrap && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-200">
                      <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Why Senior Engineers Get This Wrong: </span>
                        <span className="opacity-95">{q.seniorTrap}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Bar */}
        {!hasSubmitted && (
          <div className="sticky bottom-4 p-4 rounded-2xl bg-surface/90 backdrop-blur-md border border-border shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Answered <span className="font-bold text-foreground">{answeredCount}</span> of{' '}
              <span className="font-bold text-foreground">{questions.length}</span> questions
              {!isComplete && (
                <span className="text-amber-400 ml-2">({questions.length - answeredCount} remaining)</span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isComplete}
              className="px-8 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              <span>Submit Assessment</span>
              <CheckCircle2 size={16} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
