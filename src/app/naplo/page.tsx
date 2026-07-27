import { requireUser } from "@/lib/auth";
import { listJournalEntries } from "@/lib/data";
import type { JournalEntry } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { LinkCard } from "@/components/ui/Card";
import {
  NotebookPen,
  Plus,
  Image as ImageIcon,
  Paperclip,
  Mic,
} from "lucide-react";

function fmtDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function groupByDate(entries: JournalEntry[]): [string, JournalEntry[]][] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }
  return Array.from(map.entries());
}

export default async function NaploPage() {
  const me = await requireUser();
  const entries = await listJournalEntries(me.householdId);
  const groups = groupByDate(entries);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Napló"
        subtitle="Gondolatok, élmények — napról napra"
        back="/"
        action={
          <Button href="/naplo/uj" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Új
          </Button>
        }
      />

      {entries.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={NotebookPen}
            title="Még nincs bejegyzés"
            description="Írd le vagy mondd el, mi történt egy adott napon — szöveggel, fotóval, hanggal."
            action={
              <Button href="/naplo/uj" leftIcon={<Plus className="w-4 h-4" />}>
                Első bejegyzés
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map(([date, group]) => (
            <section key={date}>
              <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-2 px-1">
                {fmtDate(date)}
              </h2>
              <div className="space-y-2">
                {group.map((e) => (
                  <LinkCard key={e.id} href={`/naplo/${e.id}`} className="p-3">
                    <div className="flex items-center gap-3">
                      {e.photos[0] ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[var(--color-muted)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={e.photos[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <NotebookPen className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[15px] truncate">
                          {e.title || "Napló-bejegyzés"}
                        </p>
                        {e.body && (
                          <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-1">
                            {e.body}
                          </p>
                        )}
                        {(e.photos.length > 0 || e.files.length > 0 || e.transcript) && (
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
                            {e.photos.length > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <ImageIcon className="w-3 h-3" /> {e.photos.length}
                              </span>
                            )}
                            {e.files.length > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Paperclip className="w-3 h-3" /> {e.files.length}
                              </span>
                            )}
                            {e.transcript && (
                              <span className="inline-flex items-center gap-0.5">
                                <Mic className="w-3 h-3" /> Leirat
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </LinkCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
