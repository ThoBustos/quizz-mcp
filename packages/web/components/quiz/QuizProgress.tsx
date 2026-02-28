"use client";

interface QuizProgressProps {
  current: number;
  total: number;
  correctCount: number;
}

export function QuizProgress({ current, total, correctCount }: QuizProgressProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="text-text-muted flex justify-between text-sm">
        <span>
          Question <span className="text-primary">{current}</span> of {total}
        </span>
        <span>
          Score: <span className="text-accent">{correctCount}</span>/{current - 1}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
