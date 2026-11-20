"use server";

// Story 10.1 – server action a Claude-os képfelismeréshez. Belépett felhasználó,
// méret- és típuskorlát, Redis-es rate-limit; bármilyen hibánál ok:false, és a
// kliens a böngészős tesseract-útra vált.
import { requireUser } from "../auth";
import { ensureDefaultSavedTypes } from "../data";
import { hit, LIMITS } from "../rate-limit";
import {
  extractWithVision,
  MAX_VISION_BYTES,
  visionEnabled,
  type VisionKind,
  type VisionMediaType,
  type VisionOutput,
} from "./vision";

export type VisionResponse =
  | ({ ok: true } & VisionOutput)
  | { ok: false; reason: "disabled" | "bad_input" | "too_large" | "rate_limited" | "error" };

const TYPES: VisionMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const KINDS: VisionKind[] = ["expenses", "saved", "note"];

export async function visionOcrAction(fd: FormData): Promise<VisionResponse> {
  const me = await requireUser();
  if (!visionEnabled()) return { ok: false, reason: "disabled" };

  const kind = String(fd.get("kind") ?? "") as VisionKind;
  const file = fd.get("image");
  if (!KINDS.includes(kind) || !(file instanceof Blob)) return { ok: false, reason: "bad_input" };
  const mediaType = file.type as VisionMediaType;
  if (!TYPES.includes(mediaType)) return { ok: false, reason: "bad_input" };
  if (file.size === 0) return { ok: false, reason: "bad_input" };
  if (file.size > MAX_VISION_BYTES) return { ok: false, reason: "too_large" };

  const perUser = await hit(`ocr-vision:${me.userId}`, LIMITS.ocrVisionUser.limit, LIMITS.ocrVisionUser.windowSec);
  const perHousehold = await hit(
    `ocr-vision-day:${me.householdId}`,
    LIMITS.ocrVisionHouseholdDay.limit,
    LIMITS.ocrVisionHouseholdDay.windowSec
  );
  if (!perUser.ok || !perHousehold.ok) return { ok: false, reason: "rate_limited" };

  try {
    const types =
      kind === "saved"
        ? (await ensureDefaultSavedTypes(me.householdId)).map((t) => ({ id: t.id, name: t.name }))
        : undefined;
    const out = await extractWithVision(
      kind,
      { data: Buffer.from(await file.arrayBuffer()), mediaType },
      { types }
    );
    if (!out) return { ok: false, reason: "error" };
    return { ok: true, ...out };
  } catch (err) {
    console.error("visionOcrAction", err instanceof Error ? err.message : err);
    return { ok: false, reason: "error" };
  }
}
