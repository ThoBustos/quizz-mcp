import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Quizz - Terminal Quiz",
  description: "Test your knowledge from Claude Code sessions",
};

function AINativeLogo() {
  return (
    <a
      href="https://ainativeclub.com"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed left-4 top-4 z-50 opacity-30 transition-opacity duration-300 hover:opacity-100"
      title="AI Native Club"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-8 w-8">
        <rect width="32" height="32" rx="6" fill="#0d1117" />
        <text
          x="16"
          y="22"
          fontFamily="ui-monospace, monospace"
          fontSize="14"
          fontWeight="bold"
          fill="#00ff41"
          textAnchor="middle"
        >
          &gt;_
        </text>
      </svg>
    </a>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text min-h-screen font-mono antialiased">
        <AINativeLogo />
        {children}
      </body>
    </html>
  );
}
