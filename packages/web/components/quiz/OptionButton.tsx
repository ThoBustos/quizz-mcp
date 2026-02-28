"use client";

import { ReactNode } from "react";

interface OptionButtonProps {
  index: number;
  children: ReactNode;
  selected: boolean;
  focused?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function OptionButton({
  index,
  children,
  selected,
  focused,
  correct,
  incorrect,
  disabled,
  onClick,
}: OptionButtonProps) {
  const letter = String.fromCharCode(65 + index);

  let stateClass = "";
  if (correct) {
    stateClass = "correct";
  } else if (incorrect) {
    stateClass = "incorrect";
  } else if (selected) {
    stateClass = "selected";
  }

  const focusedClass = focused && !disabled && !correct && !incorrect ? "ring-2 ring-primary" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`option-button w-full ${stateClass} ${focusedClass} ${disabled ? "cursor-not-allowed opacity-75" : ""}`}
    >
      <span className="key-hint">
        <kbd>{letter}</kbd>
      </span>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border text-sm font-medium ${
            correct
              ? "border-accent text-accent"
              : incorrect
                ? "border-error text-error"
                : selected
                  ? "border-primary text-primary"
                  : "border-border text-text-muted"
          }`}
        >
          {letter}
        </span>
        <span className="text-left">{children}</span>
      </div>
      {correct && <span className="text-accent absolute left-2 top-2 text-xs">✓</span>}
      {incorrect && <span className="text-error absolute left-2 top-2 text-xs">✗</span>}
    </button>
  );
}
