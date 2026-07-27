import { requireUser } from "@/lib/auth";
import { getJournalEntry, getJournalFile } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  Pencil,
  Trash2,
  FileText,
  Music,
  Download,
  Bookmark,
  Mic,
} from "lucide-react";
import { deleteJournalAction } from "../actions";

function fmtDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(d);
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const entry = await getJournalEntry(me.householdId, id);
  if (!entry) notFound();

  const blobs = await Promise.all(
    entry.files.map(async (f) => ({
      meta: f,
      dataUrl: f.url ?? (await getJournalFile(me.householdId, id, f.id)),
    }))
  );

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title={entry.title || "Napló-bejegyzés"}
        subtitle={fmtDate(entry.date)}
        back="/naplo"
        action={
          <Link
            href={`/naplo/${id}/szerkesztes`}
            aria-label="Szerkesztés"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <Pencil className="w-4.5 h-4.5" />
          </Link>
        }
      />

      {entry.savedItemId && (
        <Link
          href={`/bakancslista/${entry.savedItemId}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium"
        >
          <Bookmark className="w-4 h-4" /> Bakancslista-tételből
        </Link>
      )}

      {entry.photos.length > 0 && (
        <div
          className={cn(
            "mt-5 grid gap-2",
            entry.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {entry.photos.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-muted)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p}
                alt=""
                className="w-full object-cover"
                style={{ aspectRatio: entry.photos.length === 1 ? "4/3" : "1/1" }}
              />
            </div>
          ))}
        </div>
      )}

      {entry.body && (
        <p className="mt-5 text-[15px] whitespace-pre-wrap leading-relaxed">
          {entry.body}
        </p>
      )}

      {blobs.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] px-1">
            Csatolmányok
          </h2>
          {blobs.map(({ meta, dataUrl }) => {
            if (!dataUrl) {
              return (
                <div
                  key={meta.id}
                  className="text-xs text-[var(--color-muted-foreground)] px-1"
                >
                  {meta.name} — nem elérhető
                </div>
              );
            }
            if (meta.mime.startsWith("video/")) {
              return (
                <div
                  key={meta.id}
                  className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-black"
                >
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video controls src={dataUrl} className="w-full" />
                </div>
              );
            }
            if (meta.mime.startsWith("audio/")) {
              return (
                <div
                  key={meta.id}
                  className="rounded-xl border border-[var(--color-border)] p-3"
                >
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4 text-[var(--color-muted-foreground)]" />{" "}
                    {meta.name}
                  </p>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={dataUrl} className="w-full" />
                </div>
              );
            }
            const Icon = meta.mime === "application/pdf" ? FileText : Download;
            return (
              <a
                key={meta.id}
                href={dataUrl}
                download={meta.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 hover:border-[var(--color-primary)]/40 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meta.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {fmtSize(meta.size)}
                  </p>
                </div>
                <Download className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
              </a>
            );
          })}
        </section>
      )}

      {entry.transcript && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-2 px-1 flex items-center gap-1.5">
            <Mic className="w-3 h-3" /> Leirat
          </h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--color-muted-foreground)]">
            {entry.transcript}
          </p>
        </section>
      )}

      <form action={deleteJournalAction} className="mt-8">
        <input type="hidden" name="id" value={entry.id} />
        <Button
          type="submit"
          variant="ghost"
          fullWidth
          className="text-red-600 hover:text-red-700"
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Törlés
        </Button>
      </form>
    </main>
  );
}
