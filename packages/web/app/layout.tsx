import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";
import { ThemeInitializer } from "@/components/ui/ThemeInitializer";

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
      className="fixed left-4 top-4 z-50 font-mono text-xl font-bold opacity-40 transition-opacity duration-300 hover:opacity-100"
      title="AI Native Club"
      style={{ color: "var(--accent)" }}
    >
      &gt;_
    </a>
  );
}

function SettingsLink() {
  return (
    <Link
      href="/settings"
      className="border-border bg-surface fixed right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-md border opacity-40 transition-all duration-300 hover:opacity-100"
      title="Settings"
    >
      <svg
        className="text-text-muted h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-text min-h-screen font-mono antialiased">
        <ThemeInitializer />
        <AINativeLogo />
        <SettingsLink />
        {children}
      </body>
    </html>
  );
}
