import { requireUser } from "@/lib/auth";
import { getCookedMeal } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteCookedMealAction } from "../actions";
import {
  Star,
  Trash2,
  BookOpen,
  Calendar,
  Coins,
  ImageOff,
} from "lucide-react";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function EtelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const meal = await getCookedMeal(me.householdId, id);
  if (!meal) notFound();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title={meal.recipeName} back="/etelek" />

      <div className="mt-5 space-y-4 animate-fade-up">
        <Card className="overflow-hidden">
          <div className="aspect-video w-full bg-[var(--color-muted)] flex items-center justify-center">
            {meal.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={meal.photo}
                alt={meal.recipeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageOff className="w-10 h-10 text-[var(--color-muted-foreground)]" />
            )}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            <span>{formatDate(meal.cookedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-amber-500" strokeWidth={1.75} fill="currentColor" />
            <span className="inline-flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4"
                  strokeWidth={1.75}
                  fill={i < meal.rating ? "currentColor" : "none"}
                />
              ))}
            </span>
            <span className="text-[var(--color-muted-foreground)] text-xs ml-1">
              ({meal.rating}/5)
            </span>
          </div>
          {meal.ingredientCost != null && (
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <span>Becsült alapanyag-költség:</span>
              <Badge tone="primary">
                {meal.ingredientCost.toLocaleString("hu-HU")} Ft
              </Badge>
            </div>
          )}
          {meal.recipeId && (
            <Link
              href={`/receptek/${meal.recipeId}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              <BookOpen className="w-4 h-4" />
              <span>Recept megnyitása</span>
            </Link>
          )}
        </Card>

        {meal.notes && (
          <Card className="p-4">
            <p className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-2">
              Jegyzet
            </p>
            <p className="text-sm whitespace-pre-wrap text-[var(--color-foreground)]">
              {meal.notes}
            </p>
          </Card>
        )}

        <form
          action={deleteCookedMealAction}
          className="mt-6 flex justify-center"
        >
          <input type="hidden" name="id" value={meal.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 transition active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bejegyzés törlése</span>
          </button>
        </form>
      </div>
    </main>
  );
}
