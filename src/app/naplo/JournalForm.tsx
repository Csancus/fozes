import { SubmitButton } from "@/components/ui/SubmitButton";
import { JournalFields } from "./JournalFields";
import type { JournalEntry } from "@/lib/types";

export function JournalForm({
  action,
  initial,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: JournalEntry | null;
}) {
  return (
    <form action={action} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <JournalFields initial={initial} />
      <SubmitButton size="lg" fullWidth pendingText="Mentés…">
        {initial ? "Mentés" : "Bejegyzés mentése"}
      </SubmitButton>
    </form>
  );
}
