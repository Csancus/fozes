import { NextResponse } from "next/server";
import { isR2Configured, uploadDataUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

// IDEIGLENES diagnosztika: R2 env + valódi feltöltés teszt. Ellenőrzés után törlendő.
export async function GET() {
  const info = {
    configured: isR2Configured(),
    bucket: process.env.R2_BUCKET ?? null,
    publicBase: process.env.R2_PUBLIC_BASE_URL ?? null,
    hasAccountId: Boolean(process.env.R2_ACCOUNT_ID),
    hasAccessKey: Boolean(process.env.R2_ACCESS_KEY_ID),
    hasSecret: Boolean(process.env.R2_SECRET_ACCESS_KEY),
  };
  let testUrl: string | null = null;
  if (info.configured) {
    const png1x1 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    testUrl = await uploadDataUrl(png1x1, "diag");
  }
  return NextResponse.json({ ...info, testUrl });
}
