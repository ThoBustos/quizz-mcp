export const theme = {
  colors: {
    bg: "#0d1117",
    surface: "#161b22",
    surfaceHover: "#1c2128",
    text: "#c9d1d9",
    textMuted: "#8b949e",
    primary: "#d4a574", // Gold/amber for headings
    accent: "#00ff41", // Matrix green for success
    error: "#f85149",
    warning: "#d29922",
    border: "#30363d",
    borderLight: "#3d444d",
  },
  fonts: {
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
} as const;

export type Theme = typeof theme;
