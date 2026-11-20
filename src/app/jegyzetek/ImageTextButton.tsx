"use client";

// Story 10.1 – „Szöveg képről”: egy fotó / képernyőkép szövegét a jegyzetbe teszi.
// A képet nem tároljuk; Claude-dal olvassuk, ha be van állítva, különben a böngészőben.
import { useRef, useState } from "react";
import { Loader2, ScanText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { recognizeImage, tryVision, readPickedFiles, UNREADABLE_IMAGE_MSG } from "@/lib/ocr/client";

export function ImageTextButton({ onText }: { onText: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(file: File) {
    setBusy(true);
    setError(null);
    setStatus("Kép elemzése…");
    try {
      let text = "";
      const vision = await tryVision("note", file);
      if (vision && vision.kind === "note") {
        text = vision.text;
      } else {
        const r = await recognizeImage(file, {
          layout: "free",
          onProgress: (p) => setStatus(p.pct > 0 && p.pct < 100 ? `${p.status} ${p.pct}%` : p.status),
        });
        text = r.text;
      }
      if (text.trim()) onText(text.trim());
      else setError("Nem találtam szöveget a képen. Próbáld élesebb képpel.");
    } catch {
      setError("Nem sikerült beolvasni a képet.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const input = e.target;
          const picked = Array.from(input.files ?? []).slice(0, 1);
          if (!picked.length) return;
          // előbb memóriába, csak utána ürítjük a választót (Android, Story 10.2 AC4)
          void readPickedFiles(picked).then(({ files }) => {
            input.value = "";
            if (files[0]) void run(files[0]);
            else setError(UNREADABLE_IMAGE_MSG);
          });
        }}
      />
      <Button
        type="button"
        variant="soft"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        leftIcon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
      >
        Szöveg képről
      </Button>
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {busy ? status : error ?? "Fotóról vagy képernyőképről a jegyzet végére írja a szöveget."}
      </span>
    </div>
  );
}
