"use client";

import { useRef, useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import type { Task, Project, TaskList, TaskStatus, Trip } from "@/lib/types";
import { SHARED_OWNER, TASK_STATUSES } from "@/lib/types";
import { STATUS_VISUAL } from "@/lib/task-visuals";
import { createTaskListInline } from "./actions";
import {
  Image as ImageIcon,
  X,
  RefreshCcw,
  Plus,
  Paperclip,
  FileText,
  Music,
  File as FileIcon,
  Check,
  ListTodo,
} from "lucide-react";

const MAX_DIM = 1400;
const COVER_QUALITY = 0.82;
const MAX_FILE_MB = 4;

type FileEntry = {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl?: string;
};
type SubEntry = { id: string; title: string; done: boolean };

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
    let w = img.naturalWidth,
      h = img.naturalHeight;
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

function ProjectOptions({ projects }: { projects: Project[] }) {
  const taskish = projects.filter((p) => p.scope !== "expense");
  const expenseOnly = projects.filter((p) => p.scope === "expense");
  return (
    <>
      {taskish.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
      {expenseOnly.length > 0 && (
        <optgroup label="Költség-projektek">
          {expenseOnly.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

export function TaskForm({
  action,
  initial,
  members = [],
  projects = [],
  lists = [],
  trips = [],
  defaultListId,
  myId,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: Task | null;
  members?: { id: string; name: string }[];
  projects?: Project[];
  lists?: TaskList[];
  trips?: Trip[];
  defaultListId?: string;
  myId?: string;
}) {
  const [ownerId, setOwnerId] = useState<string>(
    initial?.ownerId ?? myId ?? ""
  );
  const [cover, setCover] = useState<string | null>(initial?.imageUrl ?? null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>(
    initial?.files.map((f) => ({ ...f })) ?? []
  );
  const [subs, setSubs] = useState<SubEntry[]>(
    initial?.subtasks.map((s) => ({ ...s })) ?? []
  );
  const coverRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  // A listak helyben bovithetok ("+ Uj lista..."), ezert lokal allapotban vannak.
  const [listOptions, setListOptions] = useState<TaskList[]>(lists);
  const [listId, setListId] = useState<string>(initial?.listId ?? defaultListId ?? "");
  const [newList, setNewList] = useState<{ name: string; parent: string } | null>(null);
  const [creating, setCreating] = useState(false);

  async function createList() {
    if (!newList || !newList.name.trim() || creating) return;
    setCreating(true);
    try {
      const parent = newList.parent;
      const created = await createTaskListInline({
        name: newList.name,
        projectId: parent.startsWith("project:") ? parent.slice(8) : null,
        tripId: parent.startsWith("trip:") ? parent.slice(5) : null,
      });
      if (created) {
        setListOptions((cur) => [...cur, created]);
        setListId(created.id);
      }
      setNewList(null);
    } finally {
      setCreating(false);
    }
  }

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
        alert(`"${file.name}" túl nagy. Max ${MAX_FILE_MB} MB / fájl.`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        setFiles((cur) => [
          ...cur,
          { id: uid(), name: file.name, mime: file.type || "application/octet-stream", size: file.size, dataUrl },
        ]);
      } catch {
        alert(`"${file.name}" beolvasása nem sikerült.`);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function addSub() {
    setSubs((cur) => [...cur, { id: uid(), title: "", done: false }]);
  }
  function setSub(id: string, patch: Partial<SubEntry>) {
    setSubs((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeSub(id: string) {
    setSubs((cur) => cur.filter((s) => s.id !== id));
  }

  return (
    <form action={action} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="imageUrl" value={cover ?? ""} />
      <input type="hidden" name="files" value={JSON.stringify(files)} />
      <input
        type="hidden"
        name="subtasks"
        value={JSON.stringify(subs.filter((s) => s.title.trim()))}
      />

      <Field label="Mit kell megcsinálni?" required>
        <Input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          placeholder="pl. Autó műszaki vizsga"
          autoFocus={!initial}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Határidő" hint="nem kötelező">
          <Input type="date" name="dueDate" defaultValue={initial?.dueDate ?? ""} />
        </Field>
        {members.length > 0 && (
          <Field label="Kié a teendő?">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            >
              <option value="">Nincs felelős</option>
              <option value={SHARED_OWNER}>Közös (mindenkié)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field label="Lista" hint="melyik teendő-listába kerüljön">
        <select
          value={listId}
          onChange={(e) => {
            if (e.target.value === "__new") {
              setNewList({ name: "", parent: "" });
              return;
            }
            setListId(e.target.value);
          }}
          className="w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
        >
          <option value="">— Nincs (önálló teendő) —</option>
          {listOptions.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          <option value="__new">+ Új lista…</option>
        </select>
      </Field>

      {/* Új lista modál — az űrlap elhagyása nélkül */}
      {newList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xl">
            <p className="mb-3 flex items-center gap-2 font-semibold">
              <ListTodo className="w-4 h-4 text-[var(--color-primary)]" /> Új teendő-lista
            </p>
            <Input
              autoFocus
              value={newList.name}
              onChange={(e) => setNewList({ ...newList, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createList();
                }
                if (e.key === "Escape") setNewList(null);
              }}
              placeholder="pl. Csomagolás"
            />
            {(projects.length > 0 || trips.length > 0) && (
              <select
                value={newList.parent}
                onChange={(e) => setNewList({ ...newList, parent: e.target.value })}
                className="mt-3 w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              >
                <option value="">Mihez tartozik? — Önálló</option>
                {projects.length > 0 && (
                  <optgroup label="Projekt">
                    {projects.map((p) => (
                      <option key={p.id} value={"project:" + p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {trips.length > 0 && (
                  <optgroup label="Utazás">
                    {trips.map((t) => (
                      <option key={t.id} value={"trip:" + t.id}>
                        {t.year} · {t.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewList(null)}
                className="h-11 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)]"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={createList}
                disabled={!newList.name.trim() || creating}
                className="h-11 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium disabled:opacity-50"
              >
                {creating ? "Létrehozás…" : "Létrehozás"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Státusz (nem kötelező — alapból Teendő) */}
      <div>
        <span className="block text-sm font-medium mb-2">Státusz</span>
        <div className="grid grid-cols-4 gap-2">
          {TASK_STATUSES.map((s) => {
            const v = STATUS_VISUAL[s];
            const Icon = v.icon;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "h-14 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                  status === s
                    ? cn("border-transparent", v.soft, v.text)
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <Icon className="w-4 h-4" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Címkék" hint="vesszővel elválasztva — pl. sürgős, otthon">
        <Input
          name="tags"
          defaultValue={initial?.tags?.join(", ") ?? ""}
          placeholder="sürgős, ügyintézés"
        />
      </Field>

      {projects.length > 0 && (
        <Field label="Projekt" hint="nem kötelező">
          <select
            name="projectId"
            defaultValue={initial?.projectId ?? ""}
            className="w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="">— Nincs —</option>
            <ProjectOptions projects={projects} />
          </select>
        </Field>
      )}

      <Field label="Leírás">
        <Textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Részletek, amit érdemes tudni…"
        />
      </Field>

      {/* Alteendők */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Alteendők</span>
          <button
            type="button"
            onClick={addSub}
            className="inline-flex items-center gap-1 text-[13px] text-[var(--color-primary)] font-medium"
          >
            <Plus className="w-4 h-4" /> Alteendő
          </button>
        </div>
        {subs.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Bontsd kisebb, pipálható lépésekre.
          </p>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSub(s.id, { done: !s.done })}
                  className={cn(
                    "w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition",
                    s.done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-[var(--color-border)] text-transparent"
                  )}
                  aria-label="Kész"
                >
                  <Check className="w-4 h-4" />
                </button>
                <Input
                  value={s.title}
                  onChange={(e) => setSub(s.id, { title: e.target.value })}
                  placeholder="Alteendő…"
                  className={cn("h-10", s.done && "line-through opacity-60")}
                />
                <button
                  type="button"
                  onClick={() => removeSub(s.id)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-500/10 shrink-0"
                  aria-label="Törlés"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kép */}
      <div>
        <span className="block text-sm font-medium mb-2">Kép</span>
        <input ref={coverRef} type="file" accept="image/*" onChange={onCover} className="hidden" id="task-cover" />
        {cover ? (
          <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="w-full h-48 object-cover" />
            <div className="absolute top-2 right-2 flex gap-2">
              <label htmlFor="task-cover" className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75 cursor-pointer" aria-label="Csere">
                <RefreshCcw className="w-4 h-4" />
              </label>
              <button type="button" onClick={() => setCover(null)} className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75" aria-label="Eltávolítás">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <label htmlFor="task-cover" className="flex items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] cursor-pointer transition">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">{coverBusy ? "Feltöltés…" : "Kép választása"}</span>
          </label>
        )}
      </div>

      {/* Fájlok */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Fájlok</span>
          <label htmlFor="task-files" className="inline-flex items-center gap-1 text-[13px] text-[var(--color-primary)] font-medium cursor-pointer">
            <Paperclip className="w-4 h-4" /> Csatolás
          </label>
        </div>
        <input ref={fileRef} id="task-files" type="file" multiple accept="application/pdf,audio/*,image/*,.pdf,.mp3,.m4a,.wav,.ogg" onChange={onFiles} className="hidden" />
        {files.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">PDF, hangfájl, kép — max {MAX_FILE_MB} MB / fájl.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => {
              const FIcon = fileIcon(f.mime);
              return (
                <li key={f.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
                    <FIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{fmtSize(f.size)}{!f.dataUrl && " · mentve"}</p>
                  </div>
                  <button type="button" onClick={() => setFiles((cur) => cur.filter((x) => x.id !== f.id))} className="h-9 w-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-500/10" aria-label="Törlés">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SubmitButton size="lg" fullWidth>
        {initial ? "Mentés" : "Teendő hozzáadása"}
      </SubmitButton>
    </form>
  );
}
