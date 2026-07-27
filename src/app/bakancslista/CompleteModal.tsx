"use client";

import { X, Check } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { JournalFields } from "../naplo/JournalFields";
import { completeSavedItemAction, toggleDoneAction } from "./actions";

// A Bakancslista "megcsináltuk" popupja — a Napló közös mezőkészletét
// (JournalFields) ágyazza be, mentéskor a tétel kész-re áll ÉS egy
// összekapcsolt Napló-bejegyzés jön létre. Alul egy kevésbé hangsúlyos
// gyors-út is van, ami a részletek kihagyásával csak kipipálja a tételt.
export function CompleteModal({
  itemId,
  itemTitle,
  onClose,
}: {
  itemId: string;
  itemTitle: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[var(--color-card)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">Megcsináltuk!</h2>
            <p className="text-xs text-[var(--color-muted-foreground)] truncate">
              {itemTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] shrink-0"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={completeSavedItemAction} className="mt-4 space-y-6">
          <input type="hidden" name="id" value={itemId} />
          <JournalFields initial={{ title: itemTitle }} />
          <SubmitButton size="lg" fullWidth pendingText="Mentés…">
            Mentés a Naplóba
          </SubmitButton>
        </form>

        <form action={toggleDoneAction} onSubmit={onClose} className="mt-3">
          <input type="hidden" name="id" value={itemId} />
          <button
            type="submit"
            className="w-full text-center text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] underline underline-offset-2 py-1"
          >
            Csak kipipálom, részletek nélkül
          </button>
        </form>
      </div>
    </div>
  );
}
