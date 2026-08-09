"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { cn } from "@/lib/cn";
import { CAT_HEX } from "@/lib/expense-visuals";
import type { Note } from "@/lib/types";
import { Bell, BellOff, Gift, Pin } from "lucide-react";

// Keep-szerű, visszafogott paletta a jegyzet-kártyákhoz.
export const NOTE_COLORS = [
  "amber",
  "emerald",
  "sky",
  "rose",
  "violet",
  "orange",
  "teal",
  "indigo",
  "pink",
  "zinc",
];

// epoch ms → a <input type="datetime-local"> által várt helyi idejű string.
function toLocalInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// A helyi idejű mezőt a böngészőben váltjuk epoch ms-re, hogy a szerver
// időzónája (UTC a Vercelen) ne tolja el az emlékeztetőt.
function fromLocalInput(v: string): number | null {
  if (!v) return null;
  const ts = new Date(v).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function atHour(daysFromNow: number, hour: number): number {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

export function NoteForm({
  action,
  initial,
  members = [],
  otherMembers = [],
  hasSurprisePw = false,
  myId,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: Note | null;
  members?: { id: string; name: string }[];
  otherMembers?: { id: string; name: string }[];
  hasSurprisePw?: boolean;
  myId?: string;
}) {
  const [body, setBody] = useState(initial?.body ?? "");
  const [color, setColor] = useState(initial?.color ?? "amber");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [reminder, setReminder] = useState<string>(
    initial?.reminderAt ? toLocalInput(initial.reminderAt) : ""
  );
  const [ownerId, setOwnerId] = useState<string>(
    initial?.ownerId ?? myId ?? ""
  );
  const [surpriseFor, setSurpriseFor] = useState<string>(
    initial?.surpriseFor ?? ""
  );

  const reminderAt = fromLocalInput(reminder);

  return (
    <form action={action} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="body" value={body} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="pinned" value={pinned ? "1" : ""} />
      <input type="hidden" name="reminderAt" value={reminderAt ?? ""} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="surpriseFor" value={surpriseFor} />

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Cím">
            <Input
              name="title"
              defaultValue={initial?.title ?? ""}
              placeholder="pl. Bevásárlás szombatra"
              autoFocus={!initial}
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          aria-pressed={pinned}
          title={pinned ? "Rögzítés feloldása" : "Rögzítés felülre"}
          className={cn(
            "h-11 w-11 rounded-xl border flex items-center justify-center transition shrink-0",
            pinned
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          )}
        >
          <Pin className={cn("w-4.5 h-4.5", pinned && "fill-current")} />
        </button>
      </div>

      <div>
        <span className="block text-sm font-medium mb-1.5">Tartalom</span>
        <RichTextEditor
          value={initial?.body ?? ""}
          onChange={setBody}
          minHeight={220}
          placeholder="Írj ide bármit…"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
          Pipálható listához az eszköztár pipás lista-ikonja; utána a sor elején
          lévő négyzetre kattintva pipálhatsz — a jegyzet-kártyán is.
        </p>
      </div>

      {/* Szín */}
      <div>
        <span className="block text-sm font-medium mb-2">Szín</span>
        <div className="flex flex-wrap gap-2">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition",
                color === c
                  ? "border-[var(--color-foreground)] scale-110"
                  : "border-transparent"
              )}
              style={{ background: CAT_HEX[c] ?? "#71717a" }}
            />
          ))}
        </div>
      </div>

      {/* Emlékeztető */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Bell className="w-4 h-4 text-[var(--color-primary)]" />
          Emlékeztető
        </span>
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          Az esedékes emlékeztetők a jegyzetek tetején és a főoldalon jelennek
          meg. Ha engedélyezed az értesítést, a böngésző is szól — amíg az app
          nyitva van.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickTime label="Ma este 18:00" onPick={() => setReminder(toLocalInput(atHour(0, 18)))} />
          <QuickTime label="Holnap 9:00" onPick={() => setReminder(toLocalInput(atHour(1, 9)))} />
          <QuickTime label="Jövő héten" onPick={() => setReminder(toLocalInput(atHour(7, 9)))} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="datetime-local"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className="flex-1"
          />
          {reminder && (
            <button
              type="button"
              onClick={() => setReminder("")}
              className="h-11 w-11 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] shrink-0"
              aria-label="Emlékeztető törlése"
            >
              <BellOff className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Field label="Címkék" hint="Vesszővel elválasztva">
        <Input
          name="tags"
          defaultValue={initial?.tags.join(", ") ?? ""}
          placeholder="pl. munka, otthon, ötlet"
        />
      </Field>

      {members.length > 0 && (
        <Field label="Kié a jegyzet?">
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="">Közös</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Meglepetés — elrejtés egy tag elől (mint a bakancslistán) */}
      {otherMembers.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!surpriseFor}
              onChange={(e) =>
                setSurpriseFor(e.target.checked ? otherMembers[0].id : "")
              }
              className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Gift className="w-4 h-4 text-[var(--color-primary)]" />
                Rejtsd el valaki elől
              </span>
              <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                A kiválasztott tag csak egy szürke „Meglepetés” kártyát lát, a
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

      <SubmitButton size="lg" fullWidth>
        {initial ? "Mentés" : "Jegyzet mentése"}
      </SubmitButton>
    </form>
  );
}

function QuickTime({
  label,
  onPick,
}: {
  label: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="h-9 px-3 rounded-xl border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
    >
      {label}
    </button>
  );
}
