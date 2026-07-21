"use client";

import { useRef, useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { catColor } from "@/lib/expense-visuals";
import { KIND_VISUAL, linkKind } from "@/lib/saved-visuals";
import { SAVED_KINDS, SAVED_KIND_LABEL } from "@/lib/types";
import type { SavedItem, SavedKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  Image as ImageIcon,
  X,
  RefreshCcw,
  Plus,
  Link2,
  MapPin,
  Video,
  Paperclip,
  FileText,
  Music,
  File as FileIcon,
  Gift,
} from "lucide-react";
import Link from "next/link";

const MAX_DIM = 1200;
const COVER_QUALITY = 0.82;
const MAX_FILE_MB = 4;

type FileEntry = {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl?: string; // csak új fájloknál
};
type LinkEntry = { url: string; label: string };

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      const s = MAX_DIM / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/webp", COVER_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function fileIcon(mime: string) {
  if (mime.startsWith("audio/")) return Music;
  if (mime === "application/pdf") return FileText;
  if (mime.startsWith("image/")) return ImageIcon;
  return FileIcon;
}

export function SavedForm({
  action,
  initial,
  members = [],
  myId,
  hasSurprisePw = false,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: SavedItem | null;
  members?: { id: string; name: string }[];
  myId?: string;
  hasSurprisePw?: boolean;
}) {
  const [kind, setKind] = useState<SavedKind>(initial?.kind ?? "etterem");
  const [surpriseFor, setSurpriseFor] = useState<string>(
    initial?.surpriseFor ?? ""
  );
  // Csak a többi tag közül lehet választani (magamat nincs értelme kizárni).
  const otherMembers = members.filter((m) => m.id !== myId);
  const [cover, setCover] = useState<string | null>(initial?.imageUrl ?? null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [links, setLinks] = useState<LinkEntry[]>(initial?.links ?? []);
  const [files, setFiles] = useState<FileEntry[]>(
    initial?.files.map((f) => ({ ...f })) ?? []
  );
  const coverRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverBusy(true);
    try {
      setCover(await compressImage(file));
    } catch {
      alert("Nem sikerült beolvasni a képet.");
    } finally {
      setCoverBusy(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    for (const file of picked) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        alert(
          `"${file.name}" túl nagy (${fmtSize(file.size)}). Max ${MAX_FILE_MB} MB — nagyobb médiához inkább ments linket.`
        );
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        setFiles((cur) => [
          ...cur,
          {
            id: uid(),
            name: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size,
            dataUrl,
          },
        ]);
      } catch {
        alert(`"${file.name}" beolvasása nem sikerült.`);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function addLink() {
    setLinks((cur) => [...cur, { url: "", label: "" }]);
  }
  function setLink(i: number, patch: Partial<LinkEntry>) {
    setLinks((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function removeLink(i: number) {
    setLinks((cur) => cur.filter((_, idx) => idx !== i));
  }

  return (
    <form action={action} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="imageUrl" value={cover ?? ""} />
      <input
        type="hidden"
        name="links"
        value={JSON.stringify(links.filter((l) => l.url.trim()))}
      />
      <input type="hidden" name="files" value={JSON.stringify(files)} />
      <input type="hidden" name="surpriseFor" value={surpriseFor} />

      {/* Típus */}
      <div>
        <span className="block text-sm font-medium mb-2">Típus</span>
        <div className="flex flex-wrap gap-2">
          {SAVED_KINDS.map((k) => {
            const vis = KIND_VISUAL[k];
            const col = catColor(vis.color);
            const Icon = vis.icon;
            const active = kind === k;
            return (
              <button
                type="button"
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 text-[13px] font-medium border transition",
                  active
                    ? cn(col.soft, col.text, "border-transparent ring-2", col.ring)
                    : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    active ? col.text : "text-[var(--color-muted-foreground)]"
                  )}
                />
                {SAVED_KIND_LABEL[k]}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Cím / név" required>
        <Input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          placeholder="pl. Rézmál Bisztró, Lofoten túra, Sapiens könyv"
          autoFocus={!initial}
        />
      </Field>

      <Field label="Hol / cím" hint="Város, cím vagy hely — nem kötelező">
        <Input
          name="location"
          defaultValue={initial?.location ?? ""}
          placeholder="pl. Budapest, II. kerület"
        />
      </Field>

      {/* Borítókép */}
      <div>
        <span className="block text-sm font-medium mb-2">Kép</span>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          onChange={onCover}
          className="hidden"
          id="saved-cover"
        />
        {cover ? (
          <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="Borító" className="w-full h-48 object-cover" />
            <div className="absolute top-2 right-2 flex gap-2">
              <label
                htmlFor="saved-cover"
                className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75 cursor-pointer"
                aria-label="Kép cseréje"
              >
                <RefreshCcw className="w-4 h-4" />
              </label>
              <button
                type="button"
                onClick={() => setCover(null)}
                className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75"
                aria-label="Kép eltávolítása"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="saved-cover"
            className="flex items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] cursor-pointer transition"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">{coverBusy ? "Feltöltés…" : "Kép választása"}</span>
          </label>
        )}
      </div>

      {/* Linkek */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Linkek</span>
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1 text-[13px] text-[var(--color-primary)] font-medium"
          >
            <Plus className="w-4 h-4" /> Link
          </button>
        </div>
        {links.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Videó, Google Maps, cikk vagy bármilyen URL.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((l, i) => {
              const lk = l.url ? linkKind(l.url) : "generic";
              const LIcon =
                lk === "maps" ? MapPin : lk === "youtube" ? Video : Link2;
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-3 text-[var(--color-muted-foreground)]">
                    <LIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={l.url}
                      onChange={(e) => setLink(i, { url: e.target.value })}
                      inputMode="url"
                      placeholder="https://…"
                      className="h-10"
                    />
                    <Input
                      value={l.label}
                      onChange={(e) => setLink(i, { label: e.target.value })}
                      placeholder="Címke (nem kötelező)"
                      className="h-9 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="mt-1.5 h-9 w-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-500/10"
                    aria-label="Link törlése"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fájlok */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Fájlok</span>
          <label
            htmlFor="saved-files"
            className="inline-flex items-center gap-1 text-[13px] text-[var(--color-primary)] font-medium cursor-pointer"
          >
            <Paperclip className="w-4 h-4" /> Csatolás
          </label>
        </div>
        <input
          ref={fileRef}
          id="saved-files"
          type="file"
          multiple
          accept="application/pdf,audio/*,image/*,.pdf,.mp3,.m4a,.wav,.ogg"
          onChange={onFiles}
          className="hidden"
        />
        {files.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            PDF, hangfájl, kép — max {MAX_FILE_MB} MB / fájl.
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => {
              const FIcon = fileIcon(f.mime);
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
                    <FIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {fmtSize(f.size)}
                      {!f.dataUrl && " · mentve"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((cur) => cur.filter((x) => x.id !== f.id))
                    }
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-500/10"
                    aria-label="Fájl törlése"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Field label="Jegyzet">
        <Textarea
          name="note"
          defaultValue={initial?.note ?? ""}
          placeholder="Miért mented el? Mit érdemes tudni róla?"
        />
      </Field>

      <Field label="Címkék" hint="Vesszővel elválasztva">
        <Input
          name="tags"
          defaultValue={initial?.tags.join(", ") ?? ""}
          placeholder="pl. hétvége, olcsó, randi"
        />
      </Field>

      {/* Meglepetés */}
      {otherMembers.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!surpriseFor}
              onChange={(e) =>
                setSurpriseFor(
                  e.target.checked ? otherMembers[0].id : ""
                )
              }
              className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Gift className="w-4 h-4 text-[var(--color-primary)]" />
                Meglepetés — rejtsd el valaki elől
              </span>
              <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                A kiválasztott tag csak egy szürke „Meglepetés" kártyát lát, a
                tartalmat a közös jelszóval tudja feloldani.
              </span>
            </span>
          </label>

          {surpriseFor && (
            <div className="mt-3 pl-7 space-y-2">
              <select
                value={surpriseFor}
                onChange={(e) => setSurpriseFor(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              >
                {otherMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} elől
                  </option>
                ))}
              </select>
              {!hasSurprisePw && (
                <p className="text-xs text-amber-600">
                  Még nincs Meglepetés-jelszó beállítva.{" "}
                  <Link href="/csalad" className="font-medium underline">
                    Állítsd be a Család oldalon
                  </Link>
                  , különben nem lehet feloldani.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth>
        {initial ? "Mentés" : "Hozzáadás a listához"}
      </Button>
    </form>
  );
}
