"use client";

import { useRef, useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { VoiceRecorder, type RecordedAudio } from "@/components/ui/VoiceRecorder";
import type { JournalEntry } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  Image as ImageIcon,
  X,
  Paperclip,
  FileText,
  Music,
  Video as VideoIcon,
  File as FileIcon,
} from "lucide-react";

const MAX_DIM = 1200;
const COVER_QUALITY = 0.82;
const MAX_FILE_MB = 8; // videó/hang miatt kicsit nagyobb, mint a bakancslistás fájloknál

type FileEntry = {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl?: string;
  url?: string | null;
};

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function defaultToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  if (mime.startsWith("video/")) return VideoIcon;
  if (mime === "application/pdf") return FileText;
  if (mime.startsWith("image/")) return ImageIcon;
  return FileIcon;
}

// A Napló bejegyzés közös, kontrollált mezőkészlete — a Napló saját
// form-jában ÉS a Bakancslista "megcsináltuk" popupjában is ugyanez fut.
// Rejtett inputokba szerializál (photos/files/transcript JSON), a dátum/cím/
// leírás sima name-es mezők — a szülő <form action=...> gyűjti be mindet.
export function JournalFields({
  initial,
}: {
  initial?: Partial<JournalEntry> | null;
}) {
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>(
    initial?.files?.map((f) => ({ ...f })) ?? []
  );
  const [transcript, setTranscript] = useState(initial?.transcript ?? "");
  const photoRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setPhotoBusy(true);
    for (const file of picked) {
      try {
        const compressed = await compressImage(file);
        setPhotos((cur) => [...cur, compressed]);
      } catch {
        alert(`"${file.name}" nem sikerült beolvasni.`);
      }
    }
    setPhotoBusy(false);
    if (photoRef.current) photoRef.current.value = "";
  }

  function removePhoto(i: number) {
    setPhotos((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    for (const file of picked) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        alert(
          `"${file.name}" túl nagy (${fmtSize(file.size)}). Max ${MAX_FILE_MB} MB.`
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

  function removeFile(id: string) {
    setFiles((cur) => cur.filter((f) => f.id !== id));
  }

  function onRecorded(audio: RecordedAudio) {
    setFiles((cur) => [
      ...cur,
      {
        id: audio.id,
        name: audio.name,
        mime: audio.mime,
        size: audio.size,
        dataUrl: audio.dataUrl,
      },
    ]);
  }

  function onTranscript(text: string) {
    setTranscript((cur) => (cur ? `${cur}\n\n${text}` : text));
  }

  return (
    <div className="space-y-6">
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      <input type="hidden" name="files" value={JSON.stringify(files)} />
      <input type="hidden" name="transcript" value={transcript} />

      <Field label="Dátum" required>
        <Input
          type="date"
          name="date"
          required
          defaultValue={initial?.date ?? defaultToday()}
        />
      </Field>

      <Field label="Alkalom neve" hint="Nem kötelező">
        <Input
          name="title"
          defaultValue={initial?.title ?? ""}
          placeholder="pl. Kirándulás a Dobogókőre"
        />
      </Field>

      <Field label="Leírás">
        <Textarea
          name="body"
          defaultValue={initial?.body ?? ""}
          placeholder="Mi történt, milyen volt?"
        />
      </Field>

      {/* Fotók */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Fotók</span>
          <label
            htmlFor="journal-photos"
            className="inline-flex items-center gap-1 text-[13px] text-[var(--color-primary)] font-medium cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            {photoBusy ? "Feltöltés…" : "Kép hozzáadása"}
          </label>
        </div>
        <input
          ref={photoRef}
          id="journal-photos"
          type="file"
          accept="image/*"
          multiple
          onChange={onPhotos}
          className="hidden"
        />
        {photos.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Egy vagy több kép a történtekről.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden border border-[var(--color-border)] aspect-square bg-[var(--color-muted)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="Kép eltávolítása"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videó / egyéb csatolmány */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Videó / csatolmány</span>
          <label
            htmlFor="journal-files"
            className="inline-flex items-center gap-1 text-[13px] text-[var(--color-primary)] font-medium cursor-pointer"
          >
            <Paperclip className="w-4 h-4" /> Csatolás
          </label>
        </div>
        <input
          ref={fileRef}
          id="journal-files"
          type="file"
          multiple
          accept="video/*,audio/*,application/pdf,image/*"
          onChange={onFiles}
          className="hidden"
        />
        {files.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Videó, jegy, PDF vagy bármi más — max {MAX_FILE_MB} MB / fájl.
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
                    onClick={() => removeFile(f.id)}
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

      {/* Hangjegyzet */}
      <div>
        <span className="block text-sm font-medium mb-2">Hangjegyzet</span>
        <VoiceRecorder onRecorded={onRecorded} onTranscript={onTranscript} />
      </div>

      <Field
        label="Leirat"
        hint="A hangfelvétel(ek) gépi leirata — szabadon szerkesztheted"
      >
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Ha felveszel egy hangjegyzetet, ide kerül az élő leirat."
          className={cn(!transcript && "text-[var(--color-muted-foreground)]")}
        />
      </Field>
    </div>
  );
}
