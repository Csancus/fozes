// Story 10.1 – opcionális szerveroldali képfelismerés Claude-dal (vision + strukturált
// JSON-kimenet). Csak akkor él, ha be van állítva az ANTHROPIC_API_KEY; különben
// (vagy hibánál) a böngészős tesseract-út fut.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { ParsedTx } from "../bank-ocr";
import { isoDay } from "./postprocess";
import type { SavedGuess } from "./saved-guess";

/** A kliens 1600 px-re kicsinyít; ez a felső határ a biztonság kedvéért. */
export const MAX_VISION_BYTES = 4 * 1024 * 1024;

export type VisionKind = "expenses" | "saved" | "note";
export type VisionMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** Olcsó, gyors, képet jól olvasó modell; env-ből felülírható. */
export const DEFAULT_VISION_MODEL = "claude-haiku-5-5";
export function visionModel(): string {
  return process.env.OCR_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;
}
export function visionEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

const ExpensesSchema = z.object({
  transactions: z.array(
    z.object({
      kind: z.enum(["expense", "income"]),
      amount: z.number(),
      merchant: z.string(),
      day: z.string(),
      note: z.string(),
    })
  ),
});
const SavedSchema = z.object({
  title: z.string(),
  kind: z.string(),
  location: z.string(),
  links: z.array(z.string()),
  note: z.string(),
});
const NoteSchema = z.object({ text: z.string() });

function expensesPrompt(today: string): string {
  return [
    "The image is either a screenshot of a Hungarian banking app's transaction list or a photo of a shop receipt (blokk/nyugta).",
    `Today is ${today}.`,
    "Extract the transactions:",
    "- Banking list: one item per transaction. merchant = the shop or counterparty name exactly as shown (never the category line, time or card text).",
    "- Receipt: exactly ONE expense with the grand total (ÖSSZESEN / FIZETENDŐ / VÉGÖSSZEG), the shop name from the top, and the receipt date.",
    "- amount: positive number in HUF, rounded to whole forints. Thousands separators are spaces or dots, decimals use a comma (\"-4 990,00 Ft\" = 4990).",
    "- kind: \"income\" only if the amount is marked with + (incoming money), otherwise \"expense\".",
    "- day: YYYY-MM-DD. Resolve \"Ma\" (today), \"Tegnap\" (yesterday), \"nov. 17.\" etc. relative to today; without a year use the most recent past date.",
    "- Skip account balances (Egyenleg), totals of a period, ads and pending-hold summaries.",
    "- note: empty, unless there is a useful detail such as a foreign-currency amount.",
    "If nothing can be read, return an empty list.",
  ].join("\n");
}

function savedPrompt(typeIds: { id: string; name: string }[]): string {
  return [
    "The image is a screenshot (e.g. Instagram post, Google Maps card, website, article, film or book page) that the user wants to save to a bucket list.",
    "Return:",
    "- title: the name of the place / thing (e.g. the restaurant or sight name), not a caption sentence or a username.",
    `- kind: one of these ids: ${typeIds.map((t) => `${t.id} (${t.name})`).join(", ")}. Use "egyeb" if nothing fits.`,
    "- location: the address or city if visible, otherwise an empty string.",
    "- links: every URL or bare domain visible, each starting with https://.",
    "- note: a short Hungarian summary of useful details (opening hours, price, why it is interesting), max 300 characters.",
  ].join("\n");
}

const NOTE_PROMPT = [
  "Transcribe all text in the image exactly, keeping line breaks and list markers.",
  "The text is usually Hungarian - keep the accents (á, é, í, ó, ö, ő, ú, ü, ű). If handwriting is unclear, give your best reading.",
  "Do not add explanations.",
].join("\n");

export type VisionImage = { data: Buffer; mediaType: VisionMediaType };
export type VisionOutput =
  | { kind: "expenses"; transactions: ParsedTx[] }
  | { kind: "saved"; saved: SavedGuess }
  | { kind: "note"; text: string };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeTransactions(raw: z.infer<typeof ExpensesSchema>, now: Date): ParsedTx[] {
  const today = isoDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return raw.transactions
    .map((t) => ({
      kind: t.kind === "income" ? ("income" as const) : ("expense" as const),
      amount: Math.round(Math.abs(Number(t.amount) || 0)),
      merchant: String(t.merchant ?? "").trim().slice(0, 60),
      day: DAY_RE.test(t.day) ? t.day : today,
      note: String(t.note ?? "").trim().slice(0, 200),
    }))
    .filter((t) => t.amount > 0 && t.merchant)
    .slice(0, 100);
}

export function sanitizeSaved(raw: z.infer<typeof SavedSchema>, typeIds: string[]): SavedGuess {
  const links = raw.links
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\/\S+$/i.test(u) || /^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(u))
    .map((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`))
    .slice(0, 5)
    .map((url) => ({ url, label: "" }));
  const kind = typeIds.includes(raw.kind) ? raw.kind : typeIds.includes("egyeb") ? "egyeb" : typeIds[0] ?? "egyeb";
  return {
    title: raw.title.trim().slice(0, 120),
    kind,
    location: raw.location.trim().slice(0, 120),
    links,
    note: raw.note.trim().slice(0, 2000),
  };
}

/**
 * Egy kép feldolgozása Claude-dal. null, ha a modell elutasította, vagy nem jött
 * értelmezhető válasz – ilyenkor a hívó a tesseract-útra vált.
 */
export async function extractWithVision(
  kind: VisionKind,
  image: VisionImage,
  opts: { now?: Date; types?: { id: string; name: string }[]; client?: Anthropic } = {}
): Promise<VisionOutput | null> {
  const client = opts.client ?? new Anthropic();
  const now = opts.now ?? new Date();
  const today = isoDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const types = opts.types ?? [];
  const prompt = kind === "expenses" ? expensesPrompt(today) : kind === "saved" ? savedPrompt(types) : NOTE_PROMPT;
  const imageBlock = {
    type: "image" as const,
    source: { type: "base64" as const, media_type: image.mediaType, data: image.data.toString("base64") },
  };
  const base = {
    model: visionModel(),
    max_tokens: 8000,
    messages: [{ role: "user" as const, content: [imageBlock, { type: "text" as const, text: prompt }] }],
  };

  if (kind === "expenses") {
    const res = await client.messages.parse({
      ...base,
      output_config: { effort: "low", format: zodOutputFormat(ExpensesSchema) },
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    return { kind, transactions: sanitizeTransactions(res.parsed_output, now) };
  }
  if (kind === "saved") {
    const res = await client.messages.parse({
      ...base,
      output_config: { effort: "low", format: zodOutputFormat(SavedSchema) },
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    return { kind, saved: sanitizeSaved(res.parsed_output, types.map((t) => t.id)) };
  }
  const res = await client.messages.parse({
    ...base,
    output_config: { effort: "low", format: zodOutputFormat(NoteSchema) },
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) return null;
  return { kind, text: res.parsed_output.text.trim().slice(0, 20000) };
}
