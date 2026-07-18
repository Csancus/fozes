import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logout } from "./belepes/actions";
import { redis, key } from "@/lib/redis";
import type { Household } from "@/lib/types";
import {
  listPantry,
  listRecipes,
  listExpenses,
  listSavedItems,
} from "@/lib/data";
import Link from "next/link";
import {
  ChefHat,
  Wallet,
  Bookmark,
  Users,
  LogOut,
  AlertTriangle,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

export default async function Home() {
  const me = await currentUser();
  if (!me) redirect("/belepes");

  const [hh, pantry, recipes, expenses, saved] = await Promise.all([
    redis.get<Household>(key.household(me.householdId)),
    listPantry(me.householdId),
    listRecipes(me.householdId),
    listExpenses(me.householdId),
    listSavedItems(me.householdId),
  ]);

  const now = Date.now();
  const expiringSoon = pantry.filter(
    (p) => p.expiresAt != null && p.expiresAt - now <= 3 * DAY_MS
  );

  const monthStart = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  })();
  const spentThisMonth = expenses
    .filter((e) => e.spentAt >= monthStart)
    .reduce((s, e) => s + e.amount, 0);

  const savedTodo = saved.filter((s) => !s.done);

  const initials = me.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-dvh px-5 pt-5 pb-8 max-w-md md:max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full brand-gradient text-white flex items-center justify-center font-semibold shadow-sm">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-muted-foreground)]">Szia,</p>
            <p className="font-semibold truncate">{me.name}</p>
          </div>
        </div>
        <form action={logout}>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            aria-label="Kilépés"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </form>
      </header>

      {hh && (
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {hh.name}
        </p>
      )}

      <div className="mt-5">
        <h1 className="text-2xl font-bold tracking-tight">Élet Portál</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
          Kövesd egy helyen a dolgaid.
        </p>
      </div>

      {expiringSoon.length > 0 && (
        <Link
          href="/spajz"
          className="mt-5 block rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {expiringSoon.length} spájz tétel hamarosan lejár
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 truncate">
                {expiringSoon
                  .slice(0, 3)
                  .map((p) => p.name)
                  .join(", ")}
                {expiringSoon.length > 3 && "…"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-700/70 dark:text-amber-400/70 mt-2" />
          </div>
        </Link>
      )}

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <AreaTile
          href="/fozes"
          icon={ChefHat}
          title="Főzés"
          desc="Receptek, spájz, bevásárlás, vásárlás"
          stat={recipes.length ? `${recipes.length} recept` : "Konyha asszisztens"}
          badge={
            expiringSoon.length ? `${expiringSoon.length} lejár` : undefined
          }
          badgeTone="warning"
        />
        <AreaTile
          href="/koltsegek"
          icon={Wallet}
          title="Költségek"
          desc="Kiadások tételenként, kategóriákkal"
          stat={
            spentThisMonth > 0
              ? ` E hó: ${fmtFt(spentThisMonth)}`
              : "Kezdd el követni"
          }
        />
        <AreaTile
          href="/bakancslista"
          icon={Bookmark}
          title="Bakancslista"
          desc="Éttermek, utak, könyvek, cikkek, videók"
          stat={
            saved.length
              ? `${savedTodo.length} felfedezni való`
              : "Mentsd el, ne vessz el"
          }
          badge={savedTodo.length ? String(savedTodo.length) : undefined}
          badgeTone="primary"
        />
      </section>

      <section className="mt-8">
        <Link
          href="/csalad"
          className="flex items-center justify-between rounded-2xl border border-dashed border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/40 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)]">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-medium">Család / meghívó</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Hívj meg másokat a háztartásba
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
        </Link>
      </section>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <QuickAdd href="/koltsegek/uj" label="Új kiadás" />
        <QuickAdd href="/bakancslista/uj" label="Új mentés" />
      </div>
    </main>
  );
}

function AreaTile({
  href,
  icon: Icon,
  title,
  desc,
  stat,
  badge,
  badgeTone = "neutral",
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  stat: string;
  badge?: string;
  badgeTone?: "neutral" | "warning" | "primary";
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition hover:border-[var(--color-primary)]/40 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
        {badge && (
          <Badge tone={badgeTone === "warning" ? "warning" : "primary"}>
            {badge}
          </Badge>
        )}
      </div>
      <p className="mt-4 font-semibold text-[17px]">{title}</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
        {desc}
      </p>
      <p className="mt-3 text-sm font-medium text-[var(--color-primary)] flex items-center gap-1">
        {stat}
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
      </p>
    </Link>
  );
}

function QuickAdd({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] px-4 h-10 text-sm font-medium hover:brightness-95 transition"
    >
      <Plus className="w-4 h-4" />
      {label}
    </Link>
  );
}
