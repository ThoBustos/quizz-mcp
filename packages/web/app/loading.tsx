export default function Loading() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
