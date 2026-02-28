export default function QuizLoading() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-2xl p-4">
        <div className="bg-surface border-border animate-pulse rounded-lg border p-6">
          {/* Header skeleton */}
          <div className="mb-6 flex items-center gap-2">
            <div className="bg-border h-4 w-16 rounded" />
            <div className="bg-border h-4 w-24 rounded" />
          </div>

          {/* Question skeleton */}
          <div className="mb-8 space-y-2">
            <div className="bg-border h-6 w-full rounded" />
            <div className="bg-border h-6 w-3/4 rounded" />
          </div>

          {/* Options skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-border h-12 w-full rounded-lg" />
            ))}
          </div>

          {/* Button skeleton */}
          <div className="bg-border mt-6 h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
