"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { buildMatrix } from "@/lib/matrix";
import { createShoppingListAction } from "../actions";

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

      <div>
        <label className="text-sm text-zinc-500">Név</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bevásárlás (dátum)"
          className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        />
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 text-sm text-zinc-500">
          Nincsen recept.{" "}
          <Link
            href="/receptek/uj"
            className="underline text-zinc-700 dark:text-zinc-300"
          >
            Hozz létre egyet.
          </Link>
        </div>
      ) : (
        <>
          <div>
            <div className="text-sm text-zinc-500 mb-2">
              Válassz recepteket ({selected.size} / {recipes.length})
            </div>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              {recipes.map((r) => (
                <li key={r.id}>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="h-5 w-5 accent-zinc-900 dark:accent-zinc-50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {r.servings} adag · {r.ingredients.length} hozzávaló
                      </div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {matrix.rows.length > 0 && (
            <div>
              <div className="text-sm text-zinc-500 mb-2">
                Alapanyag mátrix — {matrix.rows.length} tétel
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <table className="text-xs w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                    <tr>
                      <th className="text-left px-2 py-2 sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-800/50 font-medium">
                        Alapanyag
                      </th>
                      <th className="text-right px-2 py-2 font-medium whitespace-nowrap">
                        Össz
                      </th>
                      <th className="text-left px-2 py-2 font-medium">
                        Egys.
                      </th>
                      {matrix.recipes.map((r) => (
                        <th
                          key={r.id}
                          className="text-right px-2 py-2 font-medium max-w-[6rem]"
                          title={r.name}
                        >
                          <div className="truncate">{r.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {matrix.rows.map((row) => (
                      <tr key={row.key}>
                        <td className="px-2 py-1.5 sticky left-0 z-10 bg-white dark:bg-zinc-900 font-medium whitespace-nowrap">
                          {row.name}
                        </td>
                        <td className="px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                          {row.totalQty}
                        </td>
                        <td className="px-2 py-1.5 text-zinc-500">
                          {row.unit}
                        </td>
                        {matrix.recipes.map((r) => {
                          const cell = row.perRecipe.get(r.id);
                          return (
                            <td
                              key={r.id}
                              className="px-2 py-1.5 text-right text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
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
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Vízszintesen görgethető. Kompatibilis egységek (g/kg, ml/l)
                automatikusan összevonva.
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
          disabled={selected.size === 0 && !name.trim()}
        >
          Bevásárlólista létrehozás
        </button>
        <Link
          href="/bevasarlas"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
        >
          Mégse
        </Link>
      </div>
    </form>
  );
}
