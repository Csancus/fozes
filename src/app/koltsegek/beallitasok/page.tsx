import { requireUser } from "@/lib/auth";
import {
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listPaymentMethods,
  ensureDefaultPaymentMethods,
  listPersons,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { catColor, catIcon, payIcon } from "@/lib/expense-visuals";
import { PAYMENT_KIND_LABEL } from "@/lib/types";
import { cn } from "@/lib/cn";
import { X, Users } from "lucide-react";
import { CategoryForm } from "./CategoryForm";
import { PaymentMethodForm } from "./PaymentMethodForm";
import { PersonForm } from "./PersonForm";
import {
  createCategoryAction,
  deleteCategoryAction,
  createPaymentMethodAction,
  deletePaymentMethodAction,
  createPersonAction,
  deletePersonAction,
} from "../actions";

export default async function BeallitasokPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  const [categories, paymentMethods, persons] = await Promise.all([
    listExpenseCategories(me.householdId),
    listPaymentMethods(me.householdId),
    listPersons(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Beállítások"
        subtitle="Kategóriák, kártyák, személyek"
        back="/koltsegek"
      />

      {/* Kategóriák */}
      <Section title="Kategóriák" className="mt-6">
        <ul className="space-y-2">
          {categories.map((c) => {
            const col = catColor(c.color);
            const Icon = catIcon(c.icon);
            return (
              <li key={c.id}>
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="flex-1 min-w-0 font-medium truncate">{c.name}</p>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" aria-label="Törlés">
                        <X className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
        <Card className="mt-3 p-5">
          <CategoryForm action={createCategoryAction} />
        </Card>
      </Section>

      {/* Fizetési módok */}
      <Section title="Fizetési módok / kártyák" className="mt-10">
        <ul className="space-y-2">
          {paymentMethods.map((pm) => {
            const col = catColor(pm.color);
            const Icon = payIcon(pm.kind);
            return (
              <li key={pm.id}>
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {pm.name}
                        {pm.last4 && (
                          <span className="text-[var(--color-muted-foreground)] tabular-nums"> ··{pm.last4}</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {PAYMENT_KIND_LABEL[pm.kind]}
                      </p>
                    </div>
                    <form action={deletePaymentMethodAction}>
                      <input type="hidden" name="id" value={pm.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" aria-label="Törlés">
                        <X className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
        <Card className="mt-3 p-5">
          <PaymentMethodForm action={createPaymentMethodAction} />
        </Card>
      </Section>

      {/* Személyek */}
      <Section title="Ki költötte (személyek)" className="mt-10">
        {persons.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-2 px-1 mb-3">
            <Users className="w-4 h-4" /> Még nincs személy — add hozzá pl. Anikó, Csanád.
          </p>
        ) : (
          <ul className="space-y-2">
            {persons.map((p) => {
              const col = catColor(p.color);
              return (
                <li key={p.id}>
                  <Card className="p-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0", col.dot)}>
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                      <p className="flex-1 min-w-0 font-medium truncate">{p.name}</p>
                      <form action={deletePersonAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" aria-label="Törlés">
                          <X className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
        <Card className="mt-3 p-5">
          <PersonForm action={createPersonAction} />
        </Card>
      </Section>
    </main>
  );
}
