import { requireUser } from "@/lib/auth";
import { getShoppingList } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { UNITS, fmt } from "@/lib/units";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  toggleItemAction,
  deleteShoppingListAction,
  addItemAction,
  removeItemAction,
} from "../actions";
import type { ShoppingListItem } from "@/lib/types";

export default async function ShoppingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const list = await getShoppingList(me.householdId, id);
  if (!list) notFound();

  const toBuyRaw = list.items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.need > 0);
  const haveRaw = list.items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.need === 0);
  toBuyRaw.sort((a, b) => a.it.name.localeCompare(b.it.name, "hu"));
  haveRaw.sort((a, b) => a.it.name.localeCompare(b.it.name, "hu"));

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title={list.name} back="/bevasarlas" />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/bevasarlas/${list.id}/szamla`}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-2 text-sm font-medium"
        >
          Számla hozzáfűzése
        </Link>
      </div>

      {list.items.length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Ez a lista üres.
        </p>
      )}

      {toBuyRaw.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Venni kell
          </h2>
          <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {toBuyRaw.map(({ it, i }) => (
              <ItemRow key={i} item={it} index={i} listId={list.id} />
            ))}
          </ul>
        </section>
      )}

      {haveRaw.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Van itthon
          </h2>
          <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            {haveRaw.map(({ it, i }) => (
              <li
                key={i}
                className="px-4 py-3 flex items-center justify-between text-sm gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-500 line-through truncate">
                    {it.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    kell {fmt(it.qty, it.unit)} · itthon {fmt(it.have, it.unit)}
                  </div>
                </div>
                <span className="text-xs text-emerald-600">megvan</span>
                <form action={removeItemAction}>
                  <input type="hidden" name="listId" value={list.id} />
                  <input type="hidden" name="itemIndex" value={i} />
                  <button
                    type="submit"
                    aria-label="Törlés"
                    className="text-zinc-400 hover:text-red-600 px-2 py-1"
                  >
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
          Kézi tétel hozzáadása
        </h2>
        <form
          action={addItemAction}
          className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3"
        >
          <input type="hidden" name="listId" value={list.id} />
          <div>
            <label className="text-sm text-zinc-500">Név</label>
            <input
              type="text"
              name="name"
              required
              placeholder="pl. kenyér"
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-500">Mennyiség</label>
              <input
                type="number"
                name="qty"
                step="any"
                min="0"
                defaultValue={1}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-500">Egység</label>
              <select
                name="unit"
                defaultValue="db"
                className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
          >
            Hozzáadás
          </button>
        </form>
      </section>

      <form action={deleteShoppingListAction} className="mt-8">
        <input type="hidden" name="id" value={list.id} />
        <button className="text-sm text-red-600 hover:underline">
          Lista törlése
        </button>
      </form>
    </main>
  );
}

function ItemRow({
  item,
  index,
  listId,
}: {
  item: ShoppingListItem;
  index: number;
  listId: string;
}) {
  return (
    <li className="flex items-stretch">
      <form action={toggleItemAction} className="flex-1">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="itemIndex" value={index} />
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span
            className={`h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center text-xs ${
              item.checked
                ? "bg-zinc-900 dark:bg-zinc-50 border-zinc-900 dark:border-zinc-50 text-zinc-50 dark:text-zinc-900"
                : "border-zinc-400 dark:border-zinc-600"
            }`}
          >
            {item.checked ? "✓" : ""}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className={`font-medium truncate ${
                item.checked ? "line-through text-zinc-400" : ""
              }`}
            >
              {item.name}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              <span>{fmt(item.need, item.unit)}</span>
              {item.have > 0 && (
                <span>
                  {" "}
                  · itthon {fmt(item.have, item.unit)} (kell összesen{" "}
                  {fmt(item.qty, item.unit)})
                </span>
              )}
            </div>
          </div>
        </button>
      </form>
      <form action={removeItemAction} className="flex items-center pr-2">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="itemIndex" value={index} />
        <button
          type="submit"
          aria-label="Törlés"
          className="text-zinc-400 hover:text-red-600 px-2 py-1"
        >
          ×
        </button>
      </form>
    </li>
  );
}
