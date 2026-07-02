"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { buildMatrix } from "@/lib/matrix";
import { createShoppingListAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { BookOpen, ChefHat, Plus, ChevronRight, Table2 } from "lucide-react";

export function RecipeMatrix({ recipes }: { recipes: Recipe[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");

  const selectedRecipes = useMemo(
    () => recipes.filter((r) => selected.has(r.id)),
    [recipes, selected]
  );

  const matrix = useMemo(() => buildMatrix(selectedRecipes), [selectedRecipes]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={createShoppingListAction} className="space-y-6">
      <input type="hidden" name="name" value={name} />
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="recipeIds" value={id} />
      ))}

      <Field label="Lista neve" hint="Üresen hagyva ma dátumos név lesz">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="pl. Heti nagybevásárlás"
        />
      </Field>

      {recipes.length === 0 ? (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Még nincs recepted</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                Létrehozhatsz üres listát, vagy előbb{" "}
                <Link
                  href="/receptek/uj"
                  className="text-[var(--color-primary)] font-medium hover:underline"
                >
                  hozz létre egy receptet
                </Link>
                .
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Section
            title={`Receptek (${selected.size} / ${recipes.length})`}
          >
            <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
              {recipes.map((r) => {
                const isSel = selected.has(r.id);
                return (
                  <li key={r.id}>
                    <label
                      className={
                        "flex items-center gap-3 rounded-2xl border shadow-sm p-4 cursor-pointer transition " +
                        (isSel
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/40"
                          : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/40")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(r.id)}
                        className="h-5 w-5 rounded accent-[var(--color-primary)]"
                      />
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <ChefHat className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[15px] truncate">{r.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
                          {r.servings} adag · {r.ingredients.length} hozzávaló
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                    </label>
                  </li>
                );
              })}
            </ul>
          </Section>

          {matrix.rows.length > 0 && (
            <Section
              title={`Alapanyag mátrix (${matrix.rows.length} tétel)`}
              action={
                <Table2
                  className="w-4 h-4 text-[var(--color-muted-foreground)]"
                  strokeWidth={1.75}
                />
              }
            >
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                      <tr>
                        <th className="text-left px-3 py-2.5 sticky left-0 z-10 bg-[var(--color-muted)] font-semibold uppercase tracking-wider text-[10px]">
                          Alapanyag
                        </th>
                        <th className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">
                          Össz
                        </th>
                        <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]">
                          Egys.
                        </th>
                        {matrix.recipes.map((r) => (
                          <th
                            key={r.id}
                            className="text-right px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px] max-w-[6rem]"
                            title={r.name}
                          >
                            <div className="truncate">{r.name}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {matrix.rows.map((row) => (
                        <tr key={row.key}>
                          <td className="px-3 py-2 sticky left-0 z-10 bg-[var(--color-card)] font-medium whitespace-nowrap">
                            {row.name}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap">
                            {row.totalQty}
                          </td>
                          <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                            {row.unit}
                          </td>
                          {matrix.recipes.map((r) => {
                            const cell = row.perRecipe.get(r.id);
                            return (
                              <td
                                key={r.id}
                                className="px-3 py-2 text-right text-[var(--color-muted-foreground)] tabular-nums whitespace-nowrap"
                              >
                                {cell ? cell.qty : ""}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mt-2 px-1">
                Vízszintesen görgethető. Kompatibilis egységek (g/kg, ml/l) automatikusan összevonva.
              </p>
            </Section>
          )}
        </>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          size="lg"
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={selected.size === 0 && !name.trim()}
          className="flex-1"
        >
          Létrehozás
        </Button>
        <Button href="/bevasarlas" variant="secondary" size="lg">
          Mégse
        </Button>
      </div>
    </form>
  );
}
