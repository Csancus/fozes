import type { Recipe } from "@/lib/types";
import { stringifyIngredients } from "@/lib/ingredient-parse";

export function RecipeForm({
  action,
  initial,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: Recipe;
}) {
  return (
    <form action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Név">
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Adag (fő)">
        <input
          name="servings"
          type="number"
          min="1"
          defaultValue={initial?.servings ?? 4}
          className={inputClass}
        />
      </Field>

      <Field label="Hozzávalók (soronként egy)">
        <textarea
          name="ingredients"
          rows={8}
          defaultValue={initial ? stringifyIngredients(initial.ingredients) : ""}
          placeholder={`Példa:\n500 g liszt\n2 db tojás\n1 dl tej\n1 csipet só`}
          className={`${inputClass} font-mono text-sm`}
        />
        <p className="text-xs text-zinc-500 mt-1">
          Formátum: <code>mennyiség egység név</code> (pl. 500 g liszt). Egységek: db, g, dkg, kg, ml, dl, l, csomag, csipet, ek, kk.
        </p>
      </Field>

      <Field label="Elkészítés">
        <textarea
          name="instructions"
          rows={6}
          defaultValue={initial?.instructions ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Címkék (vesszővel elválasztva)">
        <input
          name="tags"
          defaultValue={initial?.tags.join(", ") ?? ""}
          placeholder="pl. leves, gyors, vegán"
          className={inputClass}
        />
      </Field>

      <button className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-3 font-medium">
        Mentés
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
