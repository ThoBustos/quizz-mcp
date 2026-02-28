"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  QuizQuestion,
  MultiSelectQuestion,
  CodeWritingQuestion,
  CodeSnippet,
} from "@quizz/core";
import { OptionButton } from "./OptionButton";
import { CodeBlock, CodeComparison } from "../ui/CodeBlock";

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: number | number[] | string) => void;
  feedback?: {
    isCorrect: boolean;
    explanation: string;
    correctAnswer: string;
  };
  disabled?: boolean;
}

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  feedback,
  disabled = false,
}: QuizCardProps) {
  const [selected, setSelected] = useState<number | number[] | null>(null);
  const [focused, setFocused] = useState<number>(0);
  const [textAnswer, setTextAnswer] = useState("");

  // Reset state when question changes
  useEffect(() => {
    setSelected(null);
    setFocused(0);
    setTextAnswer("");
  }, [question]);

  // Submit handler (defined before useEffect that uses it)
  const handleSubmit = useCallback(() => {
    if (disabled) return;

    if (question.type === "open-ended" || question.type === "code-writing") {
      if (textAnswer.trim()) {
        onAnswer(textAnswer.trim());
      }
    } else if (question.type === "multi-select") {
      if (Array.isArray(selected) && selected.length > 0) {
        onAnswer(selected);
      }
    } else {
      if (typeof selected === "number") {
        onAnswer(selected);
      }
    }
  }, [question.type, selected, textAnswer, onAnswer, disabled]);

  // Keyboard navigation
  useEffect(() => {
    if (disabled || feedback) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (question.type === "multiple-choice" || question.type === "multi-select") {
        const options = question.options;

        // Arrow keys for navigation (focus only, not selection)
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          setFocused((prev) => (prev + 1) % options.length);
        }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          setFocused((prev) => (prev - 1 + options.length) % options.length);
        }

        // Space to toggle selection (multi-select) or select (single)
        if (e.key === " ") {
          e.preventDefault();
          if (question.type === "multi-select") {
            setSelected((prev) => {
              const current = (prev as number[]) || [];
              if (current.includes(focused)) {
                return current.filter((i) => i !== focused);
              }
              return [...current, focused];
            });
          } else {
            setSelected(focused);
          }
        }

        // A-F for direct option selection (only single character keys)
        if (e.key.length === 1) {
          const keyIndex = e.key.toUpperCase().charCodeAt(0) - 65;
          if (keyIndex >= 0 && keyIndex < options.length) {
            e.preventDefault();
            setFocused(keyIndex);
            if (question.type === "multi-select") {
              setSelected((prev) => {
                const current = (prev as number[]) || [];
                if (current.includes(keyIndex)) {
                  return current.filter((i) => i !== keyIndex);
                }
                return [...current, keyIndex];
              });
            } else {
              setSelected(keyIndex);
            }
          }
        }
      }

      // Enter to submit (but not for code-writing which uses Cmd+Enter)
      if (e.key === "Enter" && !e.shiftKey && question.type !== "code-writing") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, disabled, feedback, selected, textAnswer, focused, handleSubmit]);

  const handleOptionClick = (index: number) => {
    if (disabled || feedback) return;

    setFocused(index);
    if (question.type === "multi-select") {
      setSelected((prev) => {
        const current = (prev as number[]) || [];
        if (current.includes(index)) {
          return current.filter((i) => i !== index);
        }
        return [...current, index];
      });
    } else {
      setSelected(index);
    }
  };

  const isOptionSelected = (index: number): boolean => {
    if (question.type === "multi-select" && Array.isArray(selected)) {
      return selected.includes(index);
    }
    return selected === index;
  };

  const isOptionCorrect = (index: number): boolean | undefined => {
    if (!feedback) return undefined;
    if (question.type === "multiple-choice") {
      return index === question.correctIndex;
    }
    if (question.type === "multi-select") {
      return (question as MultiSelectQuestion).correctIndices.includes(index);
    }
    return undefined;
  };

  const isOptionIncorrect = (index: number): boolean => {
    if (!feedback) return false;
    const wasSelected = isOptionSelected(index);
    const isCorrect = isOptionCorrect(index);
    return wasSelected && !isCorrect;
  };

  // Check for code context in the question
  const codeContext =
    "codeContext" in question
      ? (question as { codeContext?: CodeSnippet[] }).codeContext
      : undefined;
  const isCodeWriting = question.type === "code-writing";
  const codeWritingQ = isCodeWriting ? (question as CodeWritingQuestion) : null;

  return (
    <div className="space-y-6">
      {/* Question header */}
      <div className="text-text-muted flex items-center gap-2 text-sm">
        <span className="text-primary">
          [{questionNumber}/{totalQuestions}]
        </span>
        <span className="text-xs uppercase">{question.type.replace("-", " ")}</span>
        {question.source && <span className="text-xs">• {question.source}</span>}
      </div>

      {/* Code context (if present) */}
      {codeContext && codeContext.length > 0 && (
        <div className="space-y-2">
          <CodeComparison snippets={codeContext} showLineNumbers />
        </div>
      )}

      {/* Question text */}
      <h2 className="text-text text-lg leading-relaxed">{question.question}</h2>

      {/* Multi-select hint */}
      {question.type === "multi-select" && !feedback && (
        <p className="text-text-muted text-sm italic">Select all that apply</p>
      )}

      {/* Options or text input */}
      {question.type === "open-ended" ? (
        <div className="space-y-4">
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={disabled || !!feedback}
            placeholder="Type your answer here..."
            className="bg-bg border-border text-text placeholder-text-muted focus:border-primary h-32 w-full resize-none rounded-lg border p-4 font-mono focus:outline-none"
          />
          {!feedback && (
            <div className="text-text-muted text-sm">
              Press <kbd>Enter</kbd> to submit
            </div>
          )}
        </div>
      ) : isCodeWriting && codeWritingQ ? (
        <div className="space-y-4">
          {/* Starter code (if provided) */}
          {codeWritingQ.starterCode && (
            <div className="space-y-2">
              <span className="text-text-muted text-xs uppercase">Starter Code</span>
              <CodeBlock
                code={codeWritingQ.starterCode}
                language={codeWritingQ.language}
                showLineNumbers
              />
            </div>
          )}
          {/* Code input area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-xs uppercase">Your Solution</span>
              <span className="text-primary text-xs">{codeWritingQ.language}</span>
            </div>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={disabled || !!feedback}
              placeholder={`Write your ${codeWritingQ.language} code here...`}
              className="code-editor border-border placeholder-text-muted focus:border-primary h-48 w-full resize-y rounded-lg border p-4 font-mono text-sm focus:outline-none"
              onKeyDown={(e) => {
                // Allow Enter for newlines in code, use Cmd/Ctrl+Enter to submit
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          {!feedback && (
            <div className="text-text-muted text-sm">
              Press <kbd>⌘</kbd>+<kbd>Enter</kbd> to submit
            </div>
          )}
        </div>
      ) : question.type === "multiple-choice" || question.type === "multi-select" ? (
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <OptionButton
              key={index}
              index={index}
              selected={isOptionSelected(index)}
              focused={focused === index}
              correct={isOptionCorrect(index) === true}
              incorrect={isOptionIncorrect(index)}
              disabled={disabled || !!feedback}
              onClick={() => handleOptionClick(index)}
            >
              {option}
            </OptionButton>
          ))}
          {!feedback && (
            <div className="text-text-muted pt-2 text-sm">
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate •{" "}
              {question.type === "multi-select" ? (
                <>
                  <kbd>Space</kbd> toggle •{" "}
                </>
              ) : (
                ""
              )}
              <kbd>Enter</kbd> submit
            </div>
          )}
        </div>
      ) : null}

      {/* Submit button */}
      {!feedback && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            disabled ||
            (question.type === "open-ended" || question.type === "code-writing"
              ? !textAnswer.trim()
              : question.type === "multi-select"
                ? !Array.isArray(selected) || selected.length === 0
                : selected === null)
          }
          className="bg-primary text-bg w-full rounded-lg px-4 py-3 font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Answer
        </button>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg border p-4 ${
            feedback.isCorrect
              ? "feedback-correct border-accent"
              : "feedback-incorrect border-error"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className={feedback.isCorrect ? "text-accent" : "text-error"}>
              {feedback.isCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </span>
          </div>
          <p className="text-text-muted text-sm">{feedback.explanation}</p>
          {!feedback.isCorrect && (
            <p className="mt-2 text-sm">
              <span className="text-text-muted">Correct answer: </span>
              <span className="text-accent">{feedback.correctAnswer}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
