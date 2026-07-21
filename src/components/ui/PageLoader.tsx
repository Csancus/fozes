import { Loader2 } from "lucide-react";

// Teljes-oldalas töltő (App Router loading.tsx-ekhez).
export function PageLoader({ label = "Betöltés…" }: { label?: string }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5">
      <div className="flex flex-col items-center gap-3 text-[var(--color-muted-foreground)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
        <p className="text-sm">{label}</p>
      </div>
    </main>
  );
}
