import { requireUser } from "@/lib/auth";
import {
  getSavedItem,
  getSavedFile,
  hasSurprisePassword,
  ensureDefaultSavedTypes,
} from "@/lib/data";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SurpriseUnlock } from "../SurpriseUnlock";
import { SavedCover } from "../SavedCover";
import { unlockSurpriseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { catColor } from "@/lib/expense-visuals";
import { savedIcon, resolveType, linkKind } from "@/lib/saved-visuals";
import { cn } from "@/lib/cn";
import {
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  Link2,
  MapPin,
  Video,
  FileText,
  Music,
  Download,
  ExternalLink,
  Map as MapIcon,
} from "lucide-react";
import { toggleDoneAction, deleteSavedAction } from "../actions";

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default async function SavedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const item = await getSavedItem(me.householdId, id);
  if (!item) notFound();

  // Meglepetés: az érintett tag csak feloldás után látja a tartalmat.
  const session = await getSession();
  if (item.surpriseFor === me.userId && !session.surpriseUnlocked) {
    const hasSurprisePw = await hasSurprisePassword(me.householdId);
    return (
      <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
        <PageHeader title="Meglepetés" back="/bakancslista" />
        <SurpriseUnlock
          hasSurprisePw={hasSurprisePw}
          unlockAction={unlockSurpriseAction}
        />
      </main>
    );
  }

  const blobs = await Promise.all(
    item.files.map(async (f) => ({
      meta: f,
      dataUrl: await getSavedFile(me.householdId, id, f.id),
    }))
  );

  const types = await ensureDefaultSavedTypes(me.householdId);
  const vis = resolveType(types, item.kind);
  const col = catColor(vis.color);
  const KindIcon = savedIcon(vis.icon);

  const mapsQuery = item.location || item.title;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title={vis.name}
        back="/bakancslista"
        action={
          <Link
            href={`/bakancslista/${id}/szerkesztes`}
            aria-label="Szerkesztés"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <Pencil className="w-4.5 h-4.5" />
          </Link>
        }
      />

      {item.imageUrl && <SavedCover src={item.imageUrl} alt={item.title} />}

      <div className="mt-5 flex items-start gap-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
          <KindIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight">{item.title}</h1>
          {item.location && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {item.location}
            </p>
          )}
        </div>
      </div>

      {/* Done toggle */}
      <form action={toggleDoneAction} className="mt-4">
        <input type="hidden" name="id" value={item.id} />
        {item.done ? (
          <Button type="submit" variant="secondary" fullWidth leftIcon={<RotateCcw className="w-4 h-4" />}>
            Visszarakás a listára
          </Button>
        ) : (
          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-emerald-600 text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 transition active:scale-[0.98]"
          >
            <Check className="w-4 h-4" /> Megcsináltam / kész
          </button>
        )}
      </form>

      {item.location && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition"
        >
          <MapIcon className="w-4 h-4" /> Térképen
        </a>
      )}

      {item.note && (
        <p className="mt-5 text-[15px] whitespace-pre-wrap leading-relaxed">
          {item.note}
        </p>
      )}

      {item.links.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-2 px-1">
            Linkek
          </h2>
          <ul className="space-y-2">
            {item.links.map((l, i) => {
              const lk = linkKind(l.url);
              const LIcon = lk === "maps" ? MapPin : lk === "youtube" ? Video : Link2;
              let host = l.url;
              try {
                host = new URL(l.url).host.replace(/^www\./, "");
              } catch {}
              return (
                <li key={i}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 hover:border-[var(--color-primary)]/40 transition"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
                      <LIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {l.label || host}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {l.url}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {blobs.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] px-1">
            Fájlok
          </h2>
          {blobs.map(({ meta, dataUrl }) => {
            if (!dataUrl) {
              return (
                <div key={meta.id} className="text-xs text-[var(--color-muted-foreground)] px-1">
                  {meta.name} — nem elérhető
                </div>
              );
            }
            if (meta.mime.startsWith("image/")) {
              return (
                <div key={meta.id} className="rounded-xl overflow-hidden border border-[var(--color-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dataUrl} alt={meta.name} className="w-full object-contain" />
                </div>
              );
            }
            if (meta.mime.startsWith("audio/")) {
              return (
                <div key={meta.id} className="rounded-xl border border-[var(--color-border)] p-3">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4 text-[var(--color-muted-foreground)]" /> {meta.name}
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
                  <p className="text-xs text-[var(--color-muted-foreground)]">{fmtSize(meta.size)}</p>
                </div>
                <Download className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
              </a>
            );
          })}
        </section>
      )}

      {item.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {item.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <form action={deleteSavedAction} className="mt-8">
        <input type="hidden" name="id" value={item.id} />
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
