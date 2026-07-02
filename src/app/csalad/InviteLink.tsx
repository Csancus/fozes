"use client";

import { useState } from "react";
import { Copy, Check, Share2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

type WithShare = Navigator & {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
};

export function InviteLink({ url, householdName }: { url: string; householdName: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Nem sikerült másolni. Kérlek jelöld ki kézzel.");
    }
  }

  async function share() {
    const nav = navigator as WithShare;
    const text = `Csatlakozz a "${householdName}" háztartáshoz a Főzés appban!`;
    if (nav.share) {
      try {
        await nav.share({ title: "Meghívó — Főzés", text, url });
        return;
      } catch {
        // user cancelled — no-op
      }
    }
    // fallback: copy
    await copy();
  }

  const encoded = encodeURIComponent(
    `Csatlakozz a "${householdName}" háztartáshoz: ${url}`
  );

  return (
    <div className="space-y-3">
      <div className="font-mono text-xs text-[var(--color-foreground)] break-all bg-[var(--color-muted)] rounded-lg px-3 py-2.5 select-all">
        {url}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={copy}
          size="sm"
          variant="soft"
          leftIcon={
            copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />
          }
        >
          {copied ? "Kimásolva" : "Link másolása"}
        </Button>

        <Button
          type="button"
          onClick={share}
          size="sm"
          leftIcon={<Share2 className="w-4 h-4" />}
        >
          Küldés / megosztás
        </Button>

        <a
          href={`https://wa.me/?text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] text-white h-9 px-3.5 text-sm font-medium hover:brightness-95 transition"
        >
          <Send className="w-4 h-4" /> WhatsApp
        </a>

        <a
          href={`mailto:?subject=${encodeURIComponent(
            "Meghívó — Főzés app"
          )}&body=${encoded}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] h-9 px-3.5 text-sm font-medium hover:border-[var(--color-primary)]/40 transition"
        >
          Email
        </a>
      </div>
    </div>
  );
}
