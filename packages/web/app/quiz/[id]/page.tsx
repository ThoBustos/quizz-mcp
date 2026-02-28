"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Terminal } from "@/components/ui/Terminal";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizCard } from "@/components/quiz/QuizCard";
import { QuizResults } from "@/components/quiz/QuizResults";
import { ChatDrawer } from "@/components/quiz/ChatDrawer";
import type { QuizSession, QuizQuestion } from "@quizz/core";

type Feedback = {
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
};

export default function QuizPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Fetch session
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/quiz/${sessionId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load quiz");
        }
        const data = await res.json();
        setSession(data.session);
        setCurrentIndex(data.session.answers.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  // Handle answer submission
  const handleAnswer = useCallback(
    async (answer: number | number[] | string) => {
      if (!session || submitting) return;

      setSubmitting(true);

      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, answer }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit answer");
        }

        const data = await res.json();

        // Show feedback
        setFeedback({
          isCorrect: data.evaluation.isCorrect,
          explanation: data.evaluation.explanation,
          correctAnswer: data.evaluation.correctAnswer,
        });

        // Update session state
        setSession(data.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setSubmitting(false);
      }
    },
    [session, sessionId, submitting]
  );

  // Handle moving to next question
  const handleNext = useCallback(() => {
    if (!session) return;
    setFeedback(null);
    setChatOpen(false);
    setCurrentIndex((prev) => prev + 1);
  }, [session]);

  // Handle retry - reset the quiz to start over
  const handleRetry = useCallback(async () => {
    if (!session) return;

    try {
      const res = await fetch(`/api/quiz/${sessionId}/retry`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset quiz");
      }

      const data = await res.json();
      setSession(data.session);
      setCurrentIndex(0);
      setFeedback(null);
      setChatOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry");
    }
  }, [session, sessionId]);

  // Keyboard handler for "next" after feedback (disabled when chat is open)
  useEffect(() => {
    if (!feedback || chatOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedback, handleNext, chatOpen]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Terminal title="quizz - loading">
          <div className="space-y-4 text-center">
            <p className="text-primary">$ loading quiz...</p>
            <p className="text-text-muted animate-pulse">
              <span className="cursor"></span>
            </p>
          </div>
        </Terminal>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Terminal title="quizz - error">
          <div className="space-y-4">
            <p className="text-error">$ error</p>
            <p className="text-text-muted">{error || "Quiz not found"}</p>
            <Link href="/" className="text-primary hover:underline">
              ← Go back
            </Link>
          </div>
        </Terminal>
      </div>
    );
  }

  const isComplete = session.completedAt || currentIndex >= session.questions.length;
  const currentQuestion = session.questions[currentIndex] as QuizQuestion | undefined;
  const correctCount = session.answers.filter((a) => a.isCorrect).length;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Terminal title={`quizz - ${session.config.difficulty}`} className="max-w-2xl">
        {isComplete ? (
          <QuizResults session={session} onRetry={handleRetry} />
        ) : currentQuestion ? (
          <div className="space-y-6">
            <QuizProgress
              current={currentIndex + 1}
              total={session.questions.length}
              correctCount={correctCount}
            />

            <QuizCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={session.questions.length}
              onAnswer={handleAnswer}
              feedback={feedback || undefined}
              disabled={submitting}
            />

            {feedback && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="border-border text-text-muted hover:border-primary hover:text-primary flex-1 rounded-lg border px-4 py-3 font-medium transition-colors"
                >
                  Ask about this →
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-primary text-bg hover:bg-primary/90 flex-1 rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  {currentIndex + 1 >= session.questions.length ? "See Results" : "Next Question →"}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Terminal>

      {/* Chat Drawer */}
      {feedback && currentQuestion && session.answers[currentIndex] && (
        <ChatDrawer
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          sessionId={sessionId}
          questionIndex={currentIndex}
          question={currentQuestion}
          userAnswer={session.answers[currentIndex].userAnswer}
          feedback={{
            isCorrect: feedback.isCorrect,
            explanation: feedback.explanation,
          }}
        />
      )}
    </div>
  );
}
