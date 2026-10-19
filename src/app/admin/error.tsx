'use client';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-16">
      <h1 className="font-display text-3xl font-semibold">This screen failed to load.</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.digest ? `Error ${error.digest}. Check the server log.` : 'Check the server log.'}</p>
      <button type="button" onClick={reset} className="mt-6 rounded-md border border-primary px-4 py-2 text-sm text-primary transition-transform active:scale-[0.98]">
        Try again
      </button>
    </div>
  );
}
