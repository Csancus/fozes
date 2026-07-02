import { requireUser } from "@/lib/auth";
import { getShoppingList } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { UNITS, fmt } from "@/lib/units";
import { notFound } from "next/navigation";
import { Check, X, Plus, Receipt, Trash2 } from "lucide-react";
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

  const remaining = toBuyRaw.filter(({ it }) => !it.checked).length;

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title={list.name}
        subtitle={
          remaining > 0
            ? `${remaining} venni való`
            : list.items.length === 0
              ? "Üres lista"
              : "Minden megvan"
        }
        back="/bevasarlas"
        action={
          <Button
            href={`/bevasarlas/${list.id}/szamla`}
            variant="soft"
            size="sm"
            leftIcon={<Receipt className="w-4 h-4" />}
          >
            Számla
          </Button>
        }
      />

      <div className="mt-5 space-y-6 animate-fade-up">
        {toBuyRaw.length > 0 && (
          <Section title="Venni kell">
            <ul className="space-y-2">
              {toBuyRaw.map(({ it, i }) => (
                <ItemRow
                  key={i}
                  item={it}
                  index={i}
                  listId={list.id}
                />
              ))}
            </ul>
          </Section>
        )}

        {haveRaw.length > 0 && (
          <Section title="Van itthon">
            <ul className="space-y-2">
              {haveRaw.map(({ it, i }) => (
                <li key={i}>
                  <Card className="p-3.5 opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium truncate line-through text-[var(--color-muted-foreground)]">
                          {it.name}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                          kell {fmt(it.qty, it.unit)} · itthon{" "}
                          {fmt(it.have, it.unit)}
                        </p>
                      </div>
                      <form action={removeItemAction}>
                        <input type="hidden" name="listId" value={list.id} />
                        <input type="hidden" name="itemIndex" value={i} />
                        <button
                          type="submit"
                          aria-label="Törlés"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)] transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {list.items.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Ez a lista üres. Adj hozzá tételeket kézzel, vagy fűzz hozzá
              számlát.
            </p>
          </Card>
        )}

        <Section title="Kézi tétel hozzáadása">
          <Card className="p-4">
            <form action={addItemAction} className="space-y-3">
              <input type="hidden" name="listId" value={list.id} />
              <Field label="Név">
                <Input name="name" required placeholder="pl. kenyér" />
              </Field>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <Field label="Mennyiség">
                    <Input
                      type="number"
                      name="qty"
                      step="any"
                      min="0"
                      defaultValue={1}
                      required
                    />
                  </Field>
                </div>
                <div className="col-span-6">
                  <Field label="Egység">
                    <Select name="unit" defaultValue="db">
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
              <Button
                type="submit"
                fullWidth
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Hozzáad
              </Button>
            </form>
          </Card>
        </Section>

        <Button
          href={`/bevasarlas/${list.id}/szamla`}
          variant="soft"
          fullWidth
          leftIcon={<Receipt className="w-4 h-4" />}
        >
          Számla hozzáfűzése
        </Button>

        <form action={deleteShoppingListAction} className="pt-4">
          <input type="hidden" name="id" value={list.id} />
          <button
            type="submit"
            className="mx-auto flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Lista törlése
          </button>
        </form>
      </div>
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
    <li>
      <Card className={item.checked ? "opacity-60" : ""}>
        <div className="flex items-stretch">
          <form action={toggleItemAction} className="flex-1">
            <input type="hidden" name="listId" value={listId} />
            <input type="hidden" name="itemIndex" value={index} />
            <button
              type="submit"
              className="w-full flex items-center gap-3 p-3.5 text-left rounded-2xl hover:bg-[var(--color-muted)]/40 transition"
            >
              <span
                className={
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition " +
                  (item.checked
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm shadow-orange-500/25"
                    : "border-2 border-[var(--color-input)] bg-[var(--color-card)] text-transparent")
                }
              >
                <Check className="w-4.5 h-4.5" strokeWidth={2.5} />
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={
                    "font-medium text-[15px] truncate " +
                    (item.checked
                      ? "line-through text-[var(--color-muted-foreground)]"
                      : "")
                  }
                >
                  {item.name}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
                  {fmt(item.need, item.unit)}
                  {item.have > 0 && (
                    <span className="ml-1 opacity-80">
                      · itthon {fmt(item.have, item.unit)}
                    </span>
                  )}
                </p>
              </div>
            </button>
          </form>
          <form
            action={removeItemAction}
            className="flex items-center pr-2"
          >
            <input type="hidden" name="listId" value={listId} />
            <input type="hidden" name="itemIndex" value={index} />
            <button
              type="submit"
              aria-label="Törlés"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      </Card>
    </li>
  );
}
