"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CompleteModal } from "./CompleteModal";
import { toggleDoneAction } from "./actions";

// A bakancslista-tétel részletező oldalán a "kész" gomb helyett ez dönt: ha
// még nincs kész, a "Megcsináltam" gomb megnyitja a CompleteModal popupot
// (dátum/leírás/fotó/hang rögzítéséhez); ha már kész, marad az egyszerű
// visszarakás + link a hozzá tartozó Napló-bejegyzésre (ha van).
export function CompletionArea({
  itemId,
  itemTitle,
  done,
  journalEntryId,
}: {
  itemId: string;
  itemTitle: string;
  done: boolean;
  journalEntryId: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (done) {
    return (
      <div className="mt-4 space-y-2">
        <form action={toggleDoneAction}>
          <input type="hidden" name="id" value={itemId} />
          <Button
            type="submit"
            variant="secondary"
            fullWidth
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Visszarakás a listára
          </Button>
        </form>
        {journalEntryId && (
          <Link
            href={`/naplo/${journalEntryId}`}
            className="flex items-center justify-center gap-1.5 h-9 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            <NotebookPen className="w-4 h-4" /> Napló bejegyzés megtekintése
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-xl bg-emerald-600 text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 transition active:scale-[0.98]"
      >
        <Check className="w-4 h-4" /> Megcsináltam / kész
      </button>
      {open && (
        <CompleteModal
          itemId={itemId}
          itemTitle={itemTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
