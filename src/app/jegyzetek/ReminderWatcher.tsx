"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";

type Reminder = { id: string; at: number; title: string };

const SEEN_KEY = "jegyzetek:ertesitve";
const TICK_MS = 30_000;

function seen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function remember(keys: Set<string>) {
  try {
    // Csak az utolsó 100 kulcsot tartjuk meg.
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...keys].slice(-100)));
  } catch {
    /* privát mód — nem baj */
  }
}

// Böngésző-értesítés a lejáró emlékeztetőkről, amíg az app nyitva van.
// (Push-szerver / cron nélkül ennél többet nem tudunk ingyen — ezért a lista
// tetején és a főoldalon is látszanak az esedékes emlékeztetők.)
export function ReminderWatcher({ reminders }: { reminders: Reminder[] }) {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const check = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const now = Date.now();
    const known = seen();
    let changed = false;
    for (const r of reminders) {
      const key = `${r.id}:${r.at}`;
      if (r.at > now || known.has(key)) continue;
      known.add(key);
      changed = true;
      try {
        new Notification("Emlékeztető", {
          body: r.title,
          tag: key,
          icon: "/icon.svg",
        });
      } catch {
        /* pl. iOS Safari — csendben kihagyjuk */
      }
    }
    if (changed) remember(known);
  }, [reminders]);

  useEffect(() => {
    if (permission !== "granted") return;
    check();
    const t = window.setInterval(check, TICK_MS);
    return () => window.clearInterval(t);
  }, [permission, check]);

  async function ask() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (permission === null || permission === "granted" || reminders.length === 0) {
    return null;
  }

  if (permission === "denied") {
    return (
      <p className="mt-4 text-xs text-[var(--color-muted-foreground)] flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5" />
        Az értesítések le vannak tiltva ehhez az oldalhoz — az esedékes
        emlékeztetők akkor is megjelennek itt fent.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={ask}
      className="mt-4 w-full flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-4 h-11 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition"
    >
      <BellRing className="w-4 h-4" />
      Értesítés kérése az emlékeztetőkről
      <span className="ml-auto text-xs">amíg nyitva van az app</span>
    </button>
  );
}
