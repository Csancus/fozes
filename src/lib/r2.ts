import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { newId } from "./redis";

// Cloudflare R2 (S3-kompatibilis, zero egress). Ha nincs beállítva env, a hívó
// visszaesik az inline (Redisbe ágyazott) tárolásra.
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET;
const PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

export function isR2Configured(): boolean {
  return Boolean(
    ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET && PUBLIC_BASE_URL
  );
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY_ID!,
        secretAccessKey: SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};

// data:URL feltöltése R2-be → publikus URL (vagy null, ha nincs konfig / hiba).
export async function uploadDataUrl(
  dataUrl: string,
  prefix: string
): Promise<string | null> {
  if (!isR2Configured()) return null;
  const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!m) return null;
  const mime = m[1];
  const buffer = Buffer.from(m[2], "base64");
  const ext = EXT[mime] ?? "bin";
  const key = `${prefix}/${newId()}.${ext}`;
  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return `${PUBLIC_BASE_URL}/${key}`;
  } catch {
    return null;
  }
}

// Segéd: ha az érték data:URL és R2 elérhető, feltölti és a publikus URL-t adja
// vissza; egyébként az eredeti értéket (inline fallback).
export async function offloadImage(
  value: string | null | undefined,
  prefix: string
): Promise<string | null> {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (!v.startsWith("data:")) return v; // már URL (vagy nem kép-data)
  if (!isR2Configured()) return v; // nincs R2 → marad inline
  const url = await uploadDataUrl(v, prefix);
  return url ?? v; // hiba esetén inline fallback
}
