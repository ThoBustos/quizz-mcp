"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { themes, ThemeId } from "@/lib/useTheme";

const STORAGE_KEY = "theme-preference";

export default function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("hacker");
  const [savedTheme, setSavedTheme] = useState<ThemeId>("hacker");
  const [mounted, setMounted] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const initial = stored && themes.some((t) => t.id === stored) ? stored : "hacker";
    setSelectedTheme(initial);
    setSavedTheme(initial);
    setMounted(true);
  }, []);

  const handlePreview = (id: ThemeId) => {
    setSelectedTheme(id);
    document.documentElement.dataset.theme = id;
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, selectedTheme);
    setSavedTheme(selectedTheme);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleCancel = () => {
    setSelectedTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  };

  const hasChanges = selectedTheme !== savedTheme;

  if (!mounted) {
    return (
      <main className="bg-bg flex min-h-screen items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </main>
    );
  }

  return (
    <main className="bg-bg min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-primary text-2xl font-bold">Settings</h1>
          <Link href="/" className="text-text-muted hover:text-text text-sm transition-colors">
            ← Back
          </Link>
        </div>

        {/* Theme Section */}
        <section className="border-border bg-surface rounded-lg border p-6">
          <h2 className="text-text mb-2 text-lg font-semibold">Theme</h2>
          <p className="text-text-muted mb-6 text-sm">
            Select a theme for your quiz interface. Click to preview, then save.
          </p>

          {/* Theme Options */}
          <div className="mb-6 space-y-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handlePreview(theme.id)}
                className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                  selectedTheme === theme.id
                    ? "border-accent bg-surface-hover"
                    : "border-border hover:border-primary hover:bg-surface-hover"
                }`}
              >
                {/* Color swatch */}
                <span
                  className="h-8 w-8 rounded-full shadow-inner ring-1 ring-white/10"
                  style={{ backgroundColor: theme.preview }}
                />
                {/* Theme info */}
                <div className="flex-1">
                  <span className="text-text font-medium">{theme.name}</span>
                  {savedTheme === theme.id && (
                    <span className="text-text-muted ml-2 text-xs">(current)</span>
                  )}
                </div>
                {/* Selected check */}
                {selectedTheme === theme.id && (
                  <svg
                    className="text-accent h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
            {hasChanges && (
              <button
                onClick={handleCancel}
                className="text-text-muted hover:text-text px-4 py-2 text-sm transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-accent text-bg rounded-lg px-6 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showSaved ? "Saved!" : "Save"}
            </button>
          </div>
        </section>

        {/* Preview */}
        <section className="border-border bg-surface mt-6 rounded-lg border p-6">
          <h2 className="text-text mb-4 text-lg font-semibold">Preview</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <span className="text-primary">Primary</span>
              <span className="text-accent">Accent</span>
              <span className="text-error">Error</span>
              <span className="text-text-muted">Muted</span>
            </div>
            <button className="bg-primary text-bg rounded-lg px-4 py-2 text-sm">
              Submit Answer
            </button>
            <div className="border-border hover:border-primary rounded-lg border p-3 transition-colors">
              <span className="text-text-muted mr-2">A</span>
              <span className="text-text">Sample answer option</span>
            </div>
            <pre className="bg-bg rounded-lg p-4 font-mono text-sm">
              <span className="text-primary">const</span> <span className="text-text">quiz</span>{" "}
              <span className="text-text-muted">=</span>{" "}
              <span className="text-accent">&quot;ready&quot;</span>
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
