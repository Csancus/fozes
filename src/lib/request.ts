import { headers } from "next/headers";

/** A kérés kliens IP-címe (Vercel: x-forwarded-for első eleme). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim() || "unknown";
}

/** Abszolút alap-URL a linkekhez (meghívó, jelszó-visszaállítás). */
export async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "fozes.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
