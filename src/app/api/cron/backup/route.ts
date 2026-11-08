import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Heti teljes mentés: a Redis összes kulcsát (típussal, nyers értékkel) egy
// JSON fájlba írja egy PRIVÁT R2 bucketbe (R2_BACKUP_BUCKET). Szándékosan nem
// a képes, publikus bucketbe megy, mert jelszó-hasheket és pénzügyi adatokat
// tartalmaz. Csak olvas a Redisből, semmit nem módosít vagy töröl.
//
// Fájl: backups/YYYY-MM-DD.json  — formátum:
//   { createdAt, keyCount, data: { [key]: { type, value } } }
//   string → nyers string, set → string[], list → string[],
//   hash → { mező: érték }, zset → [tag, pontszám, tag, pontszám, ...]

export const maxDuration = 60;

export async function GET(req: Request) {
  // Itt kötelező a CRON_SECRET: a mentés minden adatot végigolvas, ne
  // hívhassa meg bárki kívülről.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const bucket = process.env.R2_BACKUP_BUCKET;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!bucket || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { ok: false, error: "R2_BACKUP_BUCKET / R2 hitelesítés nincs beállítva" },
      { status: 500 }
    );
  }

  // Nyers értékek kellenek (nincs JSON-parse), hogy a mentés hűen visszatölthető legyen.
  const redis = Redis.fromEnv({ automaticDeserialization: false });

  const keys: string[] = [];
  let cursor: string | number = 0;
  do {
    const [next, batch]: [string | number, string[]] = await redis.scan(cursor, {
      match: "*",
      count: 1000,
    });
    keys.push(...batch);
    cursor = next;
  } while (String(cursor) !== "0");

  const data: Record<string, { type: string; value: unknown }> = {};
  const CHUNK = 200;
  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);

    const tp = redis.pipeline();
    for (const k of chunk) tp.type(k);
    const types = (await tp.exec()) as string[];

    const vp = redis.pipeline();
    chunk.forEach((k, j) => {
      switch (types[j]) {
        case "string": vp.get(k); break;
        case "set": vp.smembers(k); break;
        case "list": vp.lrange(k, 0, -1); break;
        case "hash": vp.hgetall(k); break;
        case "zset": vp.zrange(k, 0, -1, { withScores: true }); break;
        default: vp.exists(k); // ismeretlen típus: helykitöltő
      }
    });
    const values = await vp.exec();

    chunk.forEach((k, j) => {
      data[k] = { type: types[j], value: values[j] };
    });
  }

  const now = new Date();
  const body = JSON.stringify({
    createdAt: now.toISOString(),
    keyCount: keys.length,
    data,
  });
  const objectKey = `backups/${now.toISOString().slice(0, 10)}.json`;

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: "application/json",
    })
  );

  return NextResponse.json({
    ok: true,
    file: objectKey,
    keyCount: keys.length,
    bytes: Buffer.byteLength(body),
  });
}
