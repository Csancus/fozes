"use client";

import { useActionState } from "react";
import { Gift, Lock, Loader2 } from "lucide-react";

type UnlockState = { ok: boolean; error?: string } | undefined;

export function SurpriseUnlock({
  hasSurprisePw,
  unlockAction,
}: {
  hasSurprisePw: boolean;
  unlockAction: (prev: UnlockState, fd: FormData) => Promise<UnlockState>;
}) {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(
    unlockAction,
    undefined
  );

  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-3xl bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)]">
        <Gift className="w-9 h-9" />
      </div>
      <h1 className="mt-5 text-xl font-bold">Meglepetés</h1>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)] max-w-xs">
        Ezt valaki elrejtette előled. A tartalom feloldásához add meg a közös
        Meglepetés-jelszót.
      </p>

      {hasSurprisePw ? (
        <form action={formAction} className="mt-6 w-full max-w-xs space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              type="password"
              name="password"
              autoFocus
              placeholder="Jelszó"
              className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-xl bg-[var(--color-primary)] text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Feloldás
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-amber-600 max-w-xs">
          Még nincs Meglepetés-jelszó beállítva. A háztartás egyik tagja tudja
          beállítani a Család oldalon.
        </p>
      )}
    </div>
  );
}
