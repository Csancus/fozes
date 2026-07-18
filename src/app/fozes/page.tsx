import { requireUser } from "@/lib/auth";
import { seedExampleDataAction } from "../actions";
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
  Package,
  Utensils,
  ChevronRight,
  Plus,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

export default async function FozesHub() {
  const me = await requireUser();

  const [pantry, recipes, lists, purchases] = await Promise.all([
    listPantry(me.householdId),
    listRecipes(me.householdId),
    listShoppingLists(me.householdId),
    listPurchases(me.householdId),
  ]);
  await ensureDefaultLocations(me.householdId);

  const isEmpty =
    recipes.length === 0 && pantry.length === 0 && purchases.length === 0;

  const now = Date.now();
  const expiringSoon = pantry.filter(
    (p) => p.expiresAt != null && p.expiresAt - now <= 3 * DAY_MS
  );
  const activeLists = lists.filter((l) => !l.completedAt);
  const doneLists = lists.length - activeLists.length;
  const openItemsCount = activeLists.reduce(
    (sum, l) => sum + l.items.filter((it) => !it.checked && it.need > 0).length,
    0
  );
  const spent30d = purchases
    .filter((p) => now - p.purchasedAt < 30 * DAY_MS)
    .reduce((s, p) => s + p.total, 0);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-5xl mx-auto">
      <PageHeader
        title="Főzés"
        subtitle="Konyha asszisztens"
        back="/"
        action={
          <Button
            href="/receptek/uj"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Recept
          </Button>
        }
      />

      <section className="mt-6 grid grid-cols-4 gap-3">
        <Stat label="Recept" value={recipes.length} href="/receptek" />
        <Stat label="Spájz" value={pantry.length} href="/spajz" />
        <Stat
          label="Venni való"
          value={openItemsCount}
          highlight={openItemsCount > 0}
          href="/bevasarlas"
        />
        <Stat label="Vásárlás" value={purchases.length} href="/vasarlas" />
      </section>

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
          desc={
            expiringSoon.length
              ? `${expiringSoon.length} tétel lejár 3 napon belül`
              : "Mi van itthon, meddig áll el"
          }
          badge={pantry.length ? String(pantry.length) : undefined}
          badgeTone={expiringSoon.length ? "warning" : "neutral"}
        />
        <ModuleTile
          href="/bevasarlas"
          icon={ShoppingCart}
          title="Bevásárlás"
          desc={
            activeLists.length
              ? `${activeLists.length} folyamatban · ${doneLists} lezárt`
              : `${doneLists} lezárt lista`
          }
          badge={activeLists.length ? `${activeLists.length} lista` : undefined}
          badgeTone={activeLists.length ? "primary" : "neutral"}
        />
        <ModuleTile
          href="/vasarlas"
          icon={Receipt}
          title="Vásárlás"
          desc={
            spent30d > 0 ? `30 nap: ${fmtFt(spent30d)}` : "Blokk import + ártörténet"
          }
          badge={purchases.length ? String(purchases.length) : undefined}
        />
        <ModuleTile
          href="/katalogus"
          icon={Package}
          title="Katalógus"
          desc="Termékek, vonalkód, tápérték"
        />
        <ModuleTile
          href="/etelek"
          icon={Utensils}
          title="Elkészült ételek"
          desc="Fotós, csillagos főzés-napló"
        />
        <ModuleTile
          href="/statisztika"
          icon={BarChart3}
          title="Statisztika"
          desc="Költések, top termékek, árak"
          className="md:col-span-2"
        />
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
                    2 recept, 5 spájz tétel, 1 blokk és 1 bevásárlólista.
                  </p>
                </div>
              </div>
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
  href,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <p
        className={
          "text-xl font-bold tabular-nums " +
          (highlight ? "text-[var(--color-primary)]" : "")
        }
      >
        {value}
      </p>
      <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </>
  );
  const cls =
    "block rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-center transition hover:border-[var(--color-primary)]/40 hover:shadow-sm active:scale-[0.98]";
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return <div className={cls}>{inner}</div>;
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
  icon: LucideIcon;
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
          {badge && (
            <Badge
              tone={
                badgeTone === "warning"
                  ? "warning"
                  : badgeTone === "primary"
                  ? "primary"
                  : "muted"
              }
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
          {desc}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition" />
    </Link>
  );
}
