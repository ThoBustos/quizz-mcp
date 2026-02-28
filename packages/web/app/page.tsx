import { Terminal } from "@/components/ui/Terminal";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Terminal title="quizz">
        <div className="space-y-4">
          <p className="text-primary">$ quizz --help</p>
          <div className="text-text-muted space-y-2">
            <p>
              <span className="text-accent">quizz-mcp</span> - Terminal quiz generator
            </p>
            <p className="mt-4">Usage:</p>
            <p className="pl-4">Generate a quiz in Claude Code, then take it here.</p>
            <p className="mt-4">To start:</p>
            <p className="pl-4">1. In Claude Code, ask: "Generate a quiz about our session"</p>
            <p className="pl-4">2. The browser will open automatically</p>
            <p className="pl-4">3. Answer questions using keyboard shortcuts</p>
          </div>
          <div className="text-text-muted mt-8">
            <p>
              <span className="text-primary">Keyboard:</span> A/B/C/D to select,{" "}
              <kbd className="mx-1">Enter</kbd> to submit
            </p>
          </div>
          <p className="text-text-muted animate-pulse">
            Waiting for quiz session...<span className="cursor"></span>
          </p>
        </div>
      </Terminal>
    </div>
  );
}
