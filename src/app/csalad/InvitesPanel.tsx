"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InviteLink } from "./InviteLink";
import { createInviteAction, revokeInviteAction } from "./actions";

type Item = { token: string; createdAt: number; expiresAt: number };

function fmtDate(ms: number) {
  return new Date(ms).toLocaleString("hu-HU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Story 2.2 – meghívók: létrehozás, aktív lista lejárattal, visszavonás.
export function InvitesPanel({ invites, householdName }: { invites: Item[]; householdName: string }) {
  const [fresh, setFresh] = useState<{ url: string; expiresAt: number } | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {fresh ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Új meghívó – egyszer használható, {fmtDate(fresh.expiresAt)}-ig érvényes. Csak annak küldd el, akit be akarsz engedni.
          </p>
          <InviteLink url={fresh.url} householdName={householdName} />
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                setFresh(await createInviteAction());
              } catch (e) {
                setError(e instanceof Error ? e.message : "Nem sikerült.");
              }
            })
          }
        >
          Új meghívó link
        </Button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {invites.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">Aktív meghívók ({invites.length})</p>
          <ul className="space-y-1.5">
            {invites.map((i) => (
              <li key={i.token} className="flex items-center gap-2 text-xs bg-[var(--color-muted)] rounded-lg px-3 py-2">
                <span className="font-mono truncate flex-1">…{i.token.slice(-6)}</span>
                <span className="text-[var(--color-muted-foreground)] shrink-0">lejár: {fmtDate(i.expiresAt)}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(() => revokeInviteAction(i.token))}
                  className="inline-flex items-center gap-1 text-red-600 hover:underline shrink-0"
                  aria-label="Meghívó visszavonása"
                >
                  <X className="w-3.5 h-3.5" /> Visszavonás
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
