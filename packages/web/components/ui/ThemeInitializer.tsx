"use client";

import { useEffect } from "react";

const STORAGE_KEY = "theme-preference";

export function ThemeInitializer() {
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  return null;
}
