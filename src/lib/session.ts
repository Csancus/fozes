import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
  householdId?: string;
  email?: string;
  name?: string;
};

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD || "dev-only-insecure-fallback-password-change-me-32ch",
  cookieName: "fozes_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
