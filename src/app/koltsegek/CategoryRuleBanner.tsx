import { Lightbulb } from "lucide-react";

// Emlékeztető szabály a rögzítő képernyőkön.
export function CategoryRuleBanner() {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-3 text-sm text-amber-900 dark:text-amber-200">
      <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
      <p>
        Szabály: ha <strong>élelmiszer</strong>, de <strong>kimozdulás</strong>{" "}
        kapcsán, akkor <strong>Szórakozás</strong> kategória legyen.
      </p>
    </div>
  );
}
