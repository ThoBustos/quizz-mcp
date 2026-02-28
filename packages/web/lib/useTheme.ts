"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeId = "hacker" | "claude" | "minimal" | "thomas";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  preview: string; // accent color for preview swatch
}

export const themes: ThemeDefinition[] = [
  { id: "hacker", name: "Hacker", preview: "#00ff41" },
  { id: "claude", name: "Claude Community", preview: "#d4a574" },
  { id: "minimal", name: "Minimal", preview: "#58a6ff" },
  { id: "thomas", name: "Thomas", preview: "#00ff41" },
];

const STORAGE_KEY = "theme-preference";
const DEFAULT_THEME: ThemeId = "hacker";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const initial = stored && themes.some((t) => t.id === stored) ? stored : DEFAULT_THEME;
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
    setMounted(true);
  }, []);

  const setThemeById = useCallback((id: ThemeId) => {
    setTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.dataset.theme = id;
  }, []);

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  return { theme, setTheme: setThemeById, currentTheme, themes, mounted };
}
