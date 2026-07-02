import type { Recipe } from "@/lib/types";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABEL } from "@/lib/types";
import { stringifyIngredients } from "@/lib/ingredient-parse";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save } from "lucide-react";
import { RecipeImageInput } from "./RecipeImageInput";

export function RecipeForm({
  action,
  initial,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: Recipe;
}) {
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

      <Field label="Címkék" hint="Vesszővel elválasztva">
        <Input
          name="tags"
          defaultValue={initial?.tags.join(", ") ?? ""}
          placeholder="pl. leves, gyors, vegán"
        />
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
