import Link from "next/link";
import {
  ChefHat,
  Compass,
  Home,
  ListTodo,
  NotebookPen,
  Plane,
  Wallet,
} from "lucide-react";

// Story 8.3 – barátságos 404: mit történt, és merre tovább.
const shortcuts = [
  { href: "/fozes", label: "Főzés", icon: ChefHat },
  { href: "/koltsegek", label: "Költségek", icon: Wallet },
  { href: "/teendok", label: "Teendők", icon: ListTodo },
  { href: "/utazasok", label: "Utazások", icon: Plane },
  { href: "/jegyzetek", label: "Jegyzetek", icon: NotebookPen },
];

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-sm">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="absolute inset-0 rounded-3xl brand-gradient opacity-20 blur-xl" />
          <div className="relative w-20 h-20 rounded-3xl brand-gradient flex items-center justify-center shadow-md">
            <Compass className="w-10 h-10 text-white -rotate-12" strokeWidth={1.75} />
          </div>
        </div>

        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-muted-foreground)]">
          404-es hiba
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Ez az oldal nincs meg</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Lehet, hogy elírás van a címben, vagy az oldalt időközben törölték. A lenti linkekkel
          visszatalálsz.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Home className="w-4 h-4" />
          Vissza a kezdőlapra
        </Link>

        <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">Vagy ugorj egy modulra:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {shortcuts.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
