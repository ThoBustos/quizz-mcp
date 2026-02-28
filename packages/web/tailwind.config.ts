import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0d1117",
        surface: "#161b22",
        "surface-hover": "#1c2128",
        text: "#c9d1d9",
        "text-muted": "#8b949e",
        primary: "#d4a574",
        accent: "#00ff41",
        error: "#f85149",
        warning: "#d29922",
        border: "#30363d",
        "border-light": "#3d444d",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      animation: {
        "cursor-blink": "blink 1s step-end infinite",
        "glow-pulse": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 5px rgba(0, 255, 65, 0.5), 0 0 10px rgba(0, 255, 65, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 10px rgba(0, 255, 65, 0.8), 0 0 20px rgba(0, 255, 65, 0.5)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
