"use client";

import { useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { compressImageToDataUrl } from "@/lib/photo";
import { saveCookedMealAction } from "../actions";
import { Camera, Save, Star, RefreshCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

function todayInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CookedMealForm({
  recipeId,
  recipeName,
  ingredientCost,
}: {
  recipeId: string | null;
  recipeName: string;
  ingredientCost: number | null;
}) {
  const [name, setName] = useState(recipeName);
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPhoto(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kép feldolgozása sikertelen.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form action={saveCookedMealAction} className="space-y-5">
      <input type="hidden" name="recipeId" value={recipeId ?? ""} />
      <input type="hidden" name="photo" value={photo ?? ""} />
      <input type="hidden" name="rating" value={rating} />
      <input
        type="hidden"
        name="ingredientCost"
        value={ingredientCost != null ? String(ingredientCost) : ""}
      />

      <Field label="Étel neve" required>
        <Input
          name="recipeName"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="pl. Palacsinta"
        />
      </Field>

      <Field label="Fotó" hint="Kamera vagy galéria — mobilon a kamera nyílik meg.">
        <div className="space-y-3">
          {photo ? (
            <Card className="p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="Étel előnézet"
                className="max-h-72 w-auto mx-auto rounded-xl"
              />
              <label
                htmlFor="meal-photo"
                className="mt-3 inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium bg-[var(--color-muted)] hover:brightness-95 cursor-pointer transition"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Új fotó</span>
              </label>
            </Card>
          ) : (
            <label
              htmlFor="meal-photo"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-input)] bg-[var(--color-card)] p-8 text-center cursor-pointer hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary-soft)]/30 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">
                {processing ? "Kép feldolgozása..." : "Fotó készítése vagy feltöltése"}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                A kép a mentés előtt automatikusan tömörítésre kerül.
              </p>
            </label>
          )}

          <input
            id="meal-photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dátum">
          <Input
            name="cookedAt"
            type="date"
            defaultValue={todayInput()}
          />
        </Field>
        <Field label="Értékelés">
          <div
            role="radiogroup"
            aria-label="Értékelés"
            className="flex items-center gap-1 h-11 px-2 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)]"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= rating;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={n === rating}
                  onClick={() => setRating(n)}
                  className={cn(
                    "w-8 h-8 inline-flex items-center justify-center rounded-lg transition",
                    active
                      ? "text-amber-500"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                  aria-label={`${n} csillag`}
                >
                  <Star
                    className="w-5 h-5"
                    strokeWidth={1.75}
                    fill={active ? "currentColor" : "none"}
                  />
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {ingredientCost != null && (
        <Card className="p-3.5">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Becsült alapanyag-költség
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {ingredientCost.toLocaleString("hu-HU")} Ft
          </p>
        </Card>
      )}

      <Field label="Jegyzet" hint="Mit módosítottál, kinek ízlett, stb.">
        <Textarea name="notes" rows={4} placeholder="Írj néhány gondolatot…" />
      </Field>

      <Button
        type="submit"
        size="lg"
        fullWidth
        leftIcon={<Save className="w-4 h-4" />}
      >
        Mentés
      </Button>
    </form>
  );
}
