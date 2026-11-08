import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Az Upstash Free Tier 14 nap inaktivitás után automatikusan törli az
// adatbázist (2026 novemberében ez meg is történt). A Vercel cron
// (vercel.json) kétnaponta meghívja ezt a route-ot, ami ír egy kulcsot,
// így az adatbázis sosem lesz "inaktív".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date().toISOString();
  await redis.set("system:keepalive", now);
  return NextResponse.json({ ok: true, at: now });
}
