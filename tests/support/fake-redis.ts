// Memóriában futó, minimális Upstash-Redis helyettesítő a tesztekhez.
// Csak azokat a parancsokat tudja, amiket az app használ. Az Upstash SDK-hoz
// hasonlóan a nem-string értékeket JSON-ként tárolja és visszaolvasáskor
// parse-olja.

type Entry =
  | { type: "string"; value: string; expiresAt?: number }
  | { type: "set"; value: Set<string>; expiresAt?: number }
  | { type: "list"; value: string[]; expiresAt?: number };

function enc(v: unknown): string {
  return typeof v === "string" ? v : JSON.stringify(v);
}
function dec<T>(s: string): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return s as T;
  }
}

export class FakeRedis {
  private store = new Map<string, Entry>();
  now = () => Date.now();

  reset() {
    this.store.clear();
  }

  private live(key: string): Entry | undefined {
    const e = this.store.get(key);
    if (e?.expiresAt != null && e.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const e = this.live(key);
    if (!e) return null;
    if (e.type !== "string") throw new Error("WRONGTYPE");
    return dec<T>(e.value);
  }

  async mget<T = unknown>(...keys: (string | string[])[]): Promise<(T | null)[]> {
    const flat = keys.flat();
    return Promise.all(flat.map((k) => this.get<T>(k)));
  }

  async set(
    key: string,
    value: unknown,
    opts?: { ex?: number; px?: number; nx?: boolean }
  ): Promise<"OK" | null> {
    if (opts?.nx && this.live(key)) return null;
    const ms = opts?.ex != null ? opts.ex * 1000 : opts?.px;
    this.store.set(key, {
      type: "string",
      value: enc(value),
      expiresAt: ms != null ? this.now() + ms : undefined,
    });
    return "OK";
  }

  async getdel<T = unknown>(key: string): Promise<T | null> {
    const v = await this.get<T>(key);
    this.store.delete(key);
    return v;
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys.flat()) if (this.store.delete(k)) n++;
    return n;
  }

  async exists(...keys: string[]): Promise<number> {
    return keys.filter((k) => this.live(k)).length;
  }

  async incr(key: string): Promise<number> {
    const e = this.live(key);
    const n = (e && e.type === "string" ? Number(e.value) : 0) + 1;
    this.store.set(key, { type: "string", value: String(n), expiresAt: e?.expiresAt });
    return n;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const e = this.live(key);
    if (!e) return 0;
    e.expiresAt = this.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const e = this.live(key);
    if (!e) return -2;
    if (e.expiresAt == null) return -1;
    return Math.ceil((e.expiresAt - this.now()) / 1000);
  }

  private setOf(key: string): Set<string> {
    const e = this.live(key);
    if (!e) {
      const s = new Set<string>();
      this.store.set(key, { type: "set", value: s });
      return s;
    }
    if (e.type !== "set") throw new Error("WRONGTYPE");
    return e.value;
  }

  async sadd(key: string, ...members: unknown[]): Promise<number> {
    const s = this.setOf(key);
    let n = 0;
    for (const m of members.flat()) {
      const v = enc(m);
      if (!s.has(v)) {
        s.add(v);
        n++;
      }
    }
    return n;
  }

  async srem(key: string, ...members: unknown[]): Promise<number> {
    const e = this.live(key);
    if (!e || e.type !== "set") return 0;
    let n = 0;
    for (const m of members.flat()) if (e.value.delete(enc(m))) n++;
    return n;
  }

  async smembers<T = string[]>(key: string): Promise<T> {
    const e = this.live(key);
    if (!e || e.type !== "set") return [] as T;
    return [...e.value].map((v) => dec(v)) as T;
  }

  async sismember(key: string, member: unknown): Promise<number> {
    const e = this.live(key);
    return e && e.type === "set" && e.value.has(enc(member)) ? 1 : 0;
  }

  async scard(key: string): Promise<number> {
    const e = this.live(key);
    return e && e.type === "set" ? e.value.size : 0;
  }

  async lpush(key: string, ...values: unknown[]): Promise<number> {
    let e = this.live(key);
    if (!e) {
      e = { type: "list", value: [] };
      this.store.set(key, e);
    }
    if (e.type !== "list") throw new Error("WRONGTYPE");
    for (const v of values.flat()) e.value.unshift(enc(v));
    return e.value.length;
  }

  async lrange<T = string>(key: string, start: number, stop: number): Promise<T[]> {
    const e = this.live(key);
    if (!e || e.type !== "list") return [];
    const end = stop < 0 ? e.value.length + stop + 1 : stop + 1;
    return e.value.slice(start, end).map((v) => dec<T>(v));
  }

  async ltrim(key: string, start: number, stop: number): Promise<"OK"> {
    const e = this.live(key);
    if (e && e.type === "list") {
      const end = stop < 0 ? e.value.length + stop + 1 : stop + 1;
      e.value = e.value.slice(start, end);
    }
    return "OK";
  }
}

export const fakeRedis = new FakeRedis();
