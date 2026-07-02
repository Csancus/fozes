import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logout } from "./belepes/actions";
import { seedExampleDataAction } from "./actions";
import { redis, key } from "@/lib/redis";
import type { Household } from "@/lib/types";
import {
  listPantry,
  listRecipes,
  listShoppingLists,
  listPurchases,
  ensureDefaultLocations,
} from "@/lib/data";
import Link from "next/link";
import {
  BookOpen,
  Refrigerator,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  LogOut,
  AlertTriangle,
  ChevronRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const me = await currentUser();
  if (!me) redirect("/belepes");

  const [hh, pantry, recipes, lists, purchases] = await Promise.all([
    redis.get<Household>(key.household(me.householdId)),
    listPantry(me.householdId),
    listRecipes(me.householdId),
    listShoppingLists(me.householdId),
    listPurchases(me.householdId),
  ]);
  await ensureDefaultLocations(me.householdId);

  const isEmpty =
    recipes.length === 0 && pantry.length === 0 && purchases.length === 0;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const expiringSoon = pantry
    .filter((p) => p.expiresAt != null && p.expiresAt - now <= 3 * dayMs)
    .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0));
  const activeLists = lists.filter((l) => !l.completedAt);
  const openItemsCount = activeLists.reduce(
    (sum, l) => sum + l.items.filter((it) => !it.checked && it.need > 0).length,
    0
  );

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
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-semibold shadow-sm">
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

      {expiringSoon.length > 0 && (
        <Link
          href="/spajz"
          className="mt-5 block rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition animate-fade-up"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {expiringSoon.length} tétel hamarosan lejár
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

      <section className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Recept" value={recipes.length} />
        <Stat label="Spájz tétel" value={pantry.length} />
        <Stat label="Venni való" value={openItemsCount} highlight={openItemsCount > 0} />
      </section>

      {isEmpty && (
        <section className="mt-6">
          <form action={seedExampleDataAction}>
            <button
              type="submit"
              className="w-full rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] p-4 text-left hover:brightness-95 transition active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-primary)]">
                    Példa adatok betöltése
                  </p>
                  <p className="text-xs text-[var(--color-primary)]/80 mt-0.5">
                    2 recept, 5 spájz tétel, 1 blokk (7 sor) és 1 bevásárlólista. Bármikor törölhető.
                  </p>
                </div>
              </div>
            </button>
          </form>
        </section>
      )}

      <section className="mt-8 grid gap-3 md:grid-cols-2">
        <ModuleTile
          href="/receptek"
          icon={BookOpen}
          title="Receptek"
          desc="Kedvenceid, hozzávalókkal"
          badge={recipes.length ? String(recipes.length) : undefined}
        />
        <ModuleTile
          href="/spajz"
          icon={Refrigerator}
          title="Spájz"
          desc="Mi van itthon, meddig áll el"
          badge={pantry.length ? String(pantry.length) : undefined}
          badgeTone={expiringSoon.length ? "warning" : "neutral"}
        />
        <ModuleTile
          href="/bevasarlas"
          icon={ShoppingCart}
          title="Bevásárlás"
          desc="Mit kell venni, receptek alapján"
          badge={activeLists.length ? `${activeLists.length} lista` : undefined}
        />
        <ModuleTile
          href="/vasarlas"
          icon={Receipt}
          title="Vásárlás"
          desc="Blokk import + ártörténet"
        />
        <ModuleTile
          href="/statisztika"
          icon={BarChart3}
          title="Statisztika"
          desc="Költések, top termékek, árak"
          className="md:col-span-2"
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

      <div className="mt-6 flex justify-center">
        <Button href="/receptek/uj" variant="soft" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Új recept
        </Button>
      </div>
    </main>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5 text-center">
      <p className={"text-2xl font-bold tabular-nums " + (highlight ? "text-[var(--color-primary)]" : "")}>
        {value}
      </p>
      <p className="text-[11px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

function ModuleTile({
  href,
  icon: Icon,
  title,
  desc,
  badge,
  badgeTone = "neutral",
  className,
}: {
  href: string;
  icon: typeof BookOpen;
  title: string;
  desc: string;
  badge?: string;
  badgeTone?: "neutral" | "warning" | "primary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={
        "group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm transition hover:border-[var(--color-primary)]/40 hover:shadow-md active:scale-[0.99] " +
        (className ?? "")
      }
    >
      <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[15px]">{title}</p>
          {badge && <Badge tone={badgeTone === "warning" ? "warning" : "muted"}>{badge}</Badge>}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition" />
    </Link>
  );
}
