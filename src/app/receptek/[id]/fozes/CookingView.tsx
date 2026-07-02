"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { Check, CheckCircle2, X } from "lucide-react";

type State = {
  startedAt: number;
  checkedIngredients: number[];
  checkedSteps: number[];
};

function storageKey(recipeId: string) {
  return `cooking-${recipeId}`;
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export function CookingView({ recipe }: { recipe: Recipe }) {
  const router = useRouter();

  const steps = useMemo(
    () =>
      recipe.instructions
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [recipe.instructions]
  );

  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Hydrate from localStorage (or start fresh) on mount.
  useEffect(() => {
    const key = storageKey(recipe.id);
    let loaded: State | null = null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) loaded = JSON.parse(raw) as State;
    } catch {
      loaded = null;
    }
    if (!loaded || typeof loaded.startedAt !== "number") {
      loaded = {
        startedAt: Date.now(),
        checkedIngredients: [],
        checkedSteps: [],
      };
      try {
        localStorage.setItem(key, JSON.stringify(loaded));
      } catch {
        /* noop */
      }
    }
    setState(loaded);
  }, [recipe.id]);

  // Tick every second for elapsed timer.
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Persist state changes.
  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(storageKey(recipe.id), JSON.stringify(state));
    } catch {
      /* noop */
    }
  }, [state, recipe.id]);

  const total = recipe.ingredients.length + steps.length;
  const done = state
    ? state.checkedIngredients.length + state.checkedSteps.length
    : 0;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  function toggleIngredient(i: number) {
    setState((prev) => {
      if (!prev) return prev;
      const has = prev.checkedIngredients.includes(i);
      return {
        ...prev,
        checkedIngredients: has
          ? prev.checkedIngredients.filter((x) => x !== i)
          : [...prev.checkedIngredients, i],
      };
    });
  }

  function toggleStep(i: number) {
    setState((prev) => {
      if (!prev) return prev;
      const has = prev.checkedSteps.includes(i);
      return {
        ...prev,
        checkedSteps: has
          ? prev.checkedSteps.filter((x) => x !== i)
          : [...prev.checkedSteps, i],
      };
    });
  }

  function clearAndGo(path: string) {
    try {
      localStorage.removeItem(storageKey(recipe.id));
    } catch {
      /* noop */
    }
    router.push(path);
  }

  const elapsed = state ? now - state.startedAt : 0;
  const ingredientChecked = (i: number) =>
    !!state?.checkedIngredients.includes(i);
  const stepChecked = (i: number) => !!state?.checkedSteps.includes(i);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-24 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title={recipe.name}
        back={`/receptek/${recipe.id}`}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="primary">Folyamatban</Badge>
            <span className="text-sm tabular-nums font-semibold text-[var(--color-foreground)]">
              {formatElapsed(elapsed)}
            </span>
          </div>
        }
      />

      <div className="mt-3">
        <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
          <div
            className="h-full brand-gradient transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
          <span>
            {done} / {total} kész
          </span>
          <span>{progress}%</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
        A pipálás automatikusan mentődik. Ha visszalépsz, folytatható.
      </p>

      <section className="mt-5 animate-fade-up">
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] mb-2 px-1">
          Hozzávalók
        </h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, i) => {
            const checked = ingredientChecked(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggleIngredient(i)}
                  className={cn(
                    "w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm min-h-14 px-4 py-3 flex items-center gap-3 transition active:scale-[0.99] hover:border-[var(--color-primary)]/40",
                    checked && "opacity-60"
                  )}
                  aria-pressed={checked}
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center transition",
                      checked
                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "border-[var(--color-input)] bg-[var(--color-background)]"
                    )}
                  >
                    {checked && <Check className="w-5 h-5" strokeWidth={3} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "block text-[15px] font-medium",
                        checked && "line-through"
                      )}
                    >
                      {ing.name}
                    </span>
                    <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      {ing.qty} {ing.unit}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 animate-fade-up">
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] mb-2 px-1">
          Elkészítés
        </h2>
        {steps.length === 0 ? (
          <Card className="p-4 text-sm text-[var(--color-muted-foreground)]">
            Ehhez a recepthez nincs elkészítési útmutató.
          </Card>
        ) : (
          <ul className="space-y-2">
            {steps.map((s, i) => {
              const checked = stepChecked(i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggleStep(i)}
                    className={cn(
                      "w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm min-h-14 px-4 py-3 flex items-start gap-3 transition active:scale-[0.99] hover:border-[var(--color-primary)]/40",
                      checked && "opacity-60"
                    )}
                    aria-pressed={checked}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center transition text-sm font-semibold tabular-nums",
                        checked
                          ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "border-[var(--color-input)] bg-[var(--color-background)] text-[var(--color-foreground)]"
                      )}
                    >
                      {checked ? (
                        <Check className="w-5 h-5" strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-[15px] leading-relaxed",
                        checked && "line-through"
                      )}
                    >
                      {s}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="fixed bottom-0 inset-x-0 md:left-64 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-md p-4 z-40">
        <div className="max-w-md md:max-w-3xl mx-auto flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            leftIcon={<X className="w-4 h-4" />}
            onClick={() => clearAndGo(`/receptek/${recipe.id}`)}
          >
            Megszakítás
          </Button>
          <Button
            type="button"
            size="lg"
            fullWidth
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => clearAndGo(`/etelek/uj?recipeId=${recipe.id}`)}
          >
            Kész, értékelem
          </Button>
        </div>
      </div>
    </main>
  );
}
