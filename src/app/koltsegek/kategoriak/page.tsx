import { requireUser } from "@/lib/auth";
import {
  listExpenseCategories,
  ensureDefaultExpenseCategories,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { catColor, catIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { CategoryForm } from "./CategoryForm";
import { createCategoryAction, deleteCategoryAction } from "../actions";

export default async function CategoriesPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  const categories = await listExpenseCategories(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Kategóriák"
        subtitle="Kiadás-csoportok"
        back="/koltsegek"
      />

      <Section title="Meglévő" className="mt-6">
        <ul className="space-y-2">
          {categories.map((c) => {
            const col = catColor(c.color);
            const Icon = catIcon(c.icon);
            return (
              <li key={c.id}>
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        col.soft,
                        col.text
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="flex-1 min-w-0 font-medium truncate">
                      {c.name}
                    </p>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        aria-label="Törlés"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Új kategória" className="mt-8">
        <Card className="p-5">
          <CategoryForm action={createCategoryAction} />
        </Card>
      </Section>
    </main>
  );
}
