"use client";

import { ReactNode } from "react";

interface TerminalProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Terminal({ title = "terminal", children, className = "" }: TerminalProps) {
  return (
    <div
      className={`bg-surface border-border w-full max-w-3xl overflow-hidden rounded-lg border shadow-2xl ${className}`}
    >
      {/* Title bar */}
      <div className="bg-surface border-border flex items-center gap-2 border-b px-4 py-3">
        {/* Traffic lights */}
        <div className="flex gap-2">
          <div className="traffic-light traffic-light-red" />
          <div className="traffic-light traffic-light-yellow" />
          <div className="traffic-light traffic-light-green" />
        </div>
        {/* Title */}
        <div className="text-text-muted flex-1 text-center text-sm">{title}</div>
        {/* Spacer to balance traffic lights */}
        <div className="w-12" />
      </div>
      {/* Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}
