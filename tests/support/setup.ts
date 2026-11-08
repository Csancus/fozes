import { beforeEach, vi } from "vitest";
import { fakeRedis } from "./fake-redis";

// Minden teszt a memóriás Redist kapja a valódi Upstash helyett. A kulcs-
// sémát (key, newId, slug) a valódi modulból vesszük át.
vi.mock("@/lib/redis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/redis")>();
  return { ...actual, redis: fakeRedis, getRedis: () => fakeRedis };
});

beforeEach(() => {
  fakeRedis.reset();
  fakeRedis.now = () => Date.now();
});
