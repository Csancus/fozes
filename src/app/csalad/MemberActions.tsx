"use client";

import { useState, useTransition } from "react";
import { KeyRound, UserMinus, Copy, Check } from "lucide-react";
import { ownerResetLinkAction, removeMemberAction } from "./actions";

// Story 2.2 + 2.4 – a tulajdonos műveletei egy tagon.
export function MemberActions({ memberId, memberName, isSelf }: { memberId: string; memberName: string; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nem sikerült.");
      }
    });

  return (
    <div className="px-4 pb-3 -mt-1 space-y-2">
      <div className="flex flex-wrap gap-3 text-xs">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(async () => setLink((await ownerResetLinkAction(memberId)).url))}
          className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
        >
          <KeyRound className="w-3.5 h-3.5" /> Jelszó-visszaállító link
        </button>
        {!isSelf && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`Biztosan eltávolítod ${memberName} tagot? Azonnal kijelentkeztetjük, és nem látja többé a közös adatokat.`)) {
                run(() => removeMemberAction(memberId));
              }
            }}
            className="inline-flex items-center gap-1 text-red-600 hover:underline"
          >
            <UserMinus className="w-3.5 h-3.5" /> Eltávolítás
          </button>
        )}
      </div>
      {link && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] break-all bg-[var(--color-muted)] rounded px-2 py-1.5 select-all">{link}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="shrink-0"
              aria-label="Link másolása"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-[var(--color-muted-foreground)]">1 óráig érvényes, egyszer használható. Csak neki küldd el.</p>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
