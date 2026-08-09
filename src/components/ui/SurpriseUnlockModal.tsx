"use client";

import { useActionState, useEffect } from "react";
import { Gift, Loader2, X } from "lucide-react";

export type UnlockState = { ok: boolean; error?: string } | undefined;
export type UnlockAction = (
  prev: UnlockState,
  fd: FormData
) => Promise<UnlockState>;

// Közös „Meglepetés" feloldó modál — a háztartás egy jelszavával oldható,
// a feloldás a munkamenetre szól (session.surpriseUnlocked).
// Használja: Bakancslista lista, Jegyzetek lista.
export function SurpriseUnlockModal({
  hasSurprisePw,
  unlockAction,
  onClose,
  title = "Meglepetés feloldása",
}: {
  hasSurprisePw: boolean;
  unlockAction: UnlockAction;
  onClose: () => void;
  title?: string;
}) {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(
    unlockAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--color-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Add meg a közös Meglepetés-jelszót.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasSurprisePw ? (
          <form action={formAction} className="mt-4 space-y-3">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              type="password"
              name="password"
              autoFocus
              placeholder="Jelszó"
              className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            {state?.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
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
          <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
            Még nincs Meglepetés-jelszó beállítva. A háztartás egyik tagja tudja
            beállítani a Család oldalon.
          </p>
        )}
      </div>
    </div>
  );
}
