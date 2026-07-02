"use client";

import { useState, type KeyboardEvent } from "react";
import type { Recipe } from "@/lib/types";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABEL } from "@/lib/types";
import { stringifyIngredients } from "@/lib/ingredient-parse";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save, X, Plus } from "lucide-react";
import { COST_OPTIONS, DIFFICULTY_OPTIONS } from "@/lib/recipe-labels";
import { RecipeImageInput } from "./RecipeImageInput";

export function RecipeForm({
  action,
  initial,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: Recipe;
}) {
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");

  function addTag(raw: string) {
    const t = raw.trim().replace(/,+$/, "").trim();
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagDraft("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      e.preventDefault();
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <form action={action} className="space-y-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Borítókép">
        <RecipeImageInput initial={initial?.imageUrl ?? null} />
      </Field>

      <Field label="Név" required>
        <Input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="pl. Palacsinta"
        />
      </Field>

      <Field label="Kategória">
        <Select
          name="category"
          defaultValue={initial?.category ?? ""}
        >
          <option value="">— nincs —</option>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {RECIPE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Költség">
          <Select name="cost" defaultValue={initial?.cost ?? ""}>
            <option value="">— nincs —</option>
            {COST_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nehézség">
          <Select name="difficulty" defaultValue={initial?.difficulty ?? ""}>
            <option value="">— nincs —</option>
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Adag">
          <Input
            name="servings"
            type="number"
            min="1"
            inputMode="numeric"
            defaultValue={initial?.servings ?? 4}
          />
        </Field>
        <Field label="Kcal/adag">
          <Input
            name="caloriesPerServing"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="450"
            defaultValue={initial?.caloriesPerServing ?? ""}
          />
        </Field>
        <Field label="Fehérje g/adag">
          <Input
            name="proteinPerServing"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            placeholder="28"
            defaultValue={initial?.proteinPerServing ?? ""}
          />
        </Field>
      </div>

      <Field
        label="Hozzávalók"
        hint="Soronként egy, formátum: mennyiség egység név (pl. 500 g liszt). Egységek: db, g, dkg, kg, ml, dl, l, csomag, csipet, ek, kk."
      >
        <Textarea
          name="ingredients"
          rows={8}
          defaultValue={initial ? stringifyIngredients(initial.ingredients) : ""}
          placeholder={"500 g liszt\n2 db tojás\n1 dl tej\n1 csipet só"}
          className="font-mono text-sm"
        />
      </Field>

      <Field label="Elkészítés">
        <Textarea
          name="instructions"
          rows={8}
          defaultValue={initial?.instructions ?? ""}
          placeholder="Írd le lépésről lépésre…"
        />
      </Field>

      <Field label="Címkék" hint="Nyomj Entert egy címke hozzáadásához">
        <div className="space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-0.5 text-[11px] font-medium leading-5 bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    aria-label={`${t} eltávolítása`}
                    onClick={() => removeTag(t)}
                    className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-primary)]/15 transition"
                  >
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                  <input type="hidden" name="tags" value={t} />
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder="pl. leves, gyors, vegán"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => addTag(tagDraft)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Hozzáad
            </Button>
          </div>
        </div>
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
