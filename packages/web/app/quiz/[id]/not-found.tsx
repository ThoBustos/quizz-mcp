import Link from "next/link";

export default function QuizNotFound() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface border-border w-full max-w-md rounded-lg border p-6 text-center">
        <div className="text-primary mb-4 font-mono text-4xl">&gt;_</div>
        <h2 className="text-text mb-2 text-xl font-medium">Quiz not found</h2>
        <p className="text-text-muted mb-6 text-sm">
          This quiz session doesn&apos;t exist or may have expired.
        </p>
        <div className="text-text-muted bg-bg mb-6 rounded p-3 font-mono text-sm">
          <p>To create a new quiz, use Claude Code:</p>
          <p className="text-primary mt-2">/quiz</p>
        </div>
        <Link
          href="/"
          className="bg-primary text-bg hover:bg-primary/90 inline-block rounded-lg px-4 py-2 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
