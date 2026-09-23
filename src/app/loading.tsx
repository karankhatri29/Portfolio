export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      <span className="sr-only">Loading</span>
      <div aria-hidden="true" className="h-3 w-40 animate-pulse bg-ink/15" />
      <div aria-hidden="true" className="mt-6 h-14 w-full max-w-2xl animate-pulse bg-ink/10" />
      <div aria-hidden="true" className="mt-4 h-14 w-full max-w-xl animate-pulse bg-ink/10" />
    </div>
  );
}
