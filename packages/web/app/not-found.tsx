import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface border-border w-full max-w-md rounded-lg border p-6 text-center">
        <div className="text-primary mb-4 font-mono text-6xl">404</div>
        <h2 className="text-text mb-2 text-xl font-medium">Page not found</h2>
        <p className="text-text-muted mb-6 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
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
