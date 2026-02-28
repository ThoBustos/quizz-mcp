"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface border-border w-full max-w-md rounded-lg border p-6 text-center">
        <div className="text-error mb-4 text-4xl">!</div>
        <h2 className="text-text mb-2 text-xl font-medium">Something went wrong</h2>
        <p className="text-text-muted mb-6 text-sm">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="bg-primary text-bg hover:bg-primary/90 rounded-lg px-4 py-2 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="border-border text-text hover:bg-surface-hover rounded-lg border px-4 py-2 transition-colors"
          >
            Go home
          </button>
        </div>
        {error.digest && (
          <p className="text-text-muted mt-4 font-mono text-xs">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
