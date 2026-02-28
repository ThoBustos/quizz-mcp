"use client";

import Link from "next/link";
import type { QuizSession } from "@quizz/core";

interface QuizResultsProps {
  session: QuizSession;
  onReview?: () => void;
  onRetry?: () => void;
}

export function QuizResults({ session, onReview, onRetry }: QuizResultsProps) {
  const { score, config, questions, answers } = session;

  if (!score) return null;

  const percentage = score.percentage;
  const passed = percentage >= getThreshold(config.difficulty);

  return (
    <div className="space-y-8">
      {/* Score display */}
      <div className="space-y-4 text-center">
        <h2 className="text-primary text-2xl">Quiz Complete!</h2>
        <div className={`text-6xl font-bold ${passed ? "text-accent glow" : "text-error"}`}>
          {percentage}%
        </div>
        <p className="text-text-muted">
          {score.correct} of {score.total} correct
        </p>
        <div
          className={`inline-block rounded-full px-4 py-2 text-sm ${
            passed
              ? "bg-accent/20 text-accent border-accent border"
              : "bg-error/20 text-error border-error border"
          }`}
        >
          {passed ? "PASSED" : "FAILED"} - {config.difficulty.toUpperCase()} level
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <h3 className="text-primary">Summary</h3>
        <div className="space-y-2">
          {questions.map((q, i) => {
            const answer = answers[i];
            return (
              <div
                key={i}
                className={`rounded border p-3 ${
                  answer.isCorrect ? "border-accent/50 bg-accent/5" : "border-error/50 bg-error/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={answer.isCorrect ? "text-accent" : "text-error"}>
                    {answer.isCorrect ? "✓" : "✗"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-text truncate text-sm">{q.question}</p>
                    {!answer.isCorrect && (
                      <p className="text-text-muted mt-1 text-xs">
                        Your answer: {formatAnswer(q, answer.userAnswer)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-primary text-bg hover:bg-primary/90 flex-1 rounded-lg px-4 py-3 font-medium transition-colors"
            >
              Try Again
            </button>
          )}
          <Link
            href="/"
            className="border-border text-text-muted hover:border-primary hover:text-primary flex-1 rounded-lg border px-4 py-3 text-center transition-colors"
          >
            Done
          </Link>
        </div>
        {onReview && (
          <button
            type="button"
            onClick={onReview}
            className="text-text-muted hover:text-primary w-full px-4 py-2 text-sm transition-colors"
          >
            Review Answers
          </button>
        )}
      </div>
    </div>
  );
}

function getThreshold(difficulty: string): number {
  const thresholds: Record<string, number> = {
    easy: 50,
    medium: 60,
    hard: 75,
    expert: 85,
  };
  return thresholds[difficulty] || 70;
}

function formatAnswer(
  question: QuizSession["questions"][0],
  answer: number | number[] | string
): string {
  if (question.type === "multiple-choice" && typeof answer === "number") {
    return `${String.fromCharCode(65 + answer)}) ${question.options[answer]}`;
  }
  if (question.type === "multi-select" && Array.isArray(answer)) {
    return answer.map((i) => `${String.fromCharCode(65 + i)}) ${question.options[i]}`).join(", ");
  }
  return String(answer);
}
