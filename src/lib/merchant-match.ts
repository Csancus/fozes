// Story 10.3 – a kiolvasott megnevezést a korábbi tételekhez igazítjuk: ha volt már
// ugyanilyen vagy nagyon hasonló nevű tétel, annak a nevét és a paramétereit
// (kategória, fizetés, ki(nek), projekt, csoport, jelleg) vesszük át.

import type { Expense, ExpenseNature, Person } from "./types";

export type MerchantProfile = {
  merchant: string;
  kind: Expense["kind"];
  categoryId: string;
  paymentMethodId: string;
  personId: string;
  projectId: string;
  groupId: string;
  nature: ExpenseNature;
  count: number;
  lastAt: number;
};

/** Összehasonlításhoz: kisbetű, ékezet nélkül, csak betű/szám, végéről a bolt-/terminálszám le. */
export function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/(\s\d{2,})+$/, "")
    .replace(/^\d{1,2}(?=[a-z]{3})/, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** 0–1 hasonlóság két (normalizált) név között. */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  // az egyik a másik eleje szóhatáron („lidl” ↔ „lidl igazan megeri”, „perem” ↔ „perem bisztro”)
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 4 && (long.startsWith(short + " ") || long.endsWith(" " + short))) return 0.92;
  const lev = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  // első szavak egyezése (márkanév) erős jel, ha legalább 4 betű
  const fa = a.split(" ")[0];
  const fb = b.split(" ")[0];
  const firstWord = fa.length >= 4 && fa === fb ? 0.85 : 0;
  return Math.max(lev, firstWord);
}

export const MATCH_THRESHOLD = 0.82;

/** Megnevezésenként a legutóbbi tétel paraméterei + előfordulás (a legfrissebb nyer). */
export function buildMerchantProfiles(expenses: Expense[]): MerchantProfile[] {
  const byKey = new Map<string, MerchantProfile>();
  for (const e of expenses) {
    const name = e.merchant?.trim();
    if (!name) continue;
    const key = `${e.kind}:${normName(name)}`;
    const cur = byKey.get(key);
    if (cur) cur.count += 1;
    if (cur && e.spentAt <= cur.lastAt) continue;
    byKey.set(key, {
      merchant: name,
      kind: e.kind,
      categoryId: e.categoryId ?? "",
      paymentMethodId: e.paymentMethodId ?? "",
      personId: e.personId ?? "",
      projectId: e.projectId ?? "",
      groupId: e.groupId ?? "",
      nature: e.nature,
      count: cur?.count ?? 1,
      lastAt: e.spentAt,
    });
  }
  return [...byKey.values()];
}

/** A legjobban hasonlító korábbi megnevezés (azonos irányú), vagy null. */
export function matchMerchant(
  name: string,
  kind: Expense["kind"],
  profiles: MerchantProfile[]
): MerchantProfile | null {
  const n = normName(name);
  if (n.length < 2) return null;
  let best: { p: MerchantProfile; s: number } | null = null;
  for (const p of profiles) {
    if (p.kind !== kind) continue;
    const s = similarity(n, normName(p.merchant));
    if (s < MATCH_THRESHOLD) continue;
    if (!best || s > best.s || (s === best.s && p.count > best.p.count)) best = { p, s };
  }
  return best?.p ?? null;
}

/**
 * A „Ki(nek)” alapértéke: a belépett felhasználó saját személye (név-egyezés),
 * különben „Csanád” (a user kérése, Story 10.3), különben üres.
 */
export function defaultPersonId(persons: Person[], userName?: string): string {
  const fold = (s: string) => normName(s);
  if (userName) {
    const tokens = fold(userName).split(" ").filter((t) => t.length >= 3);
    const mine = persons.find((p) => {
      const pn = fold(p.name);
      return pn && tokens.some((t) => pn === t || pn.split(" ").includes(t));
    });
    if (mine) return mine.id;
  }
  return persons.find((p) => fold(p.name).split(" ").includes("csanad"))?.id ?? "";
}

/**
 * Képek közötti duplikáció szűrése (Story 10.3): átfedő képernyőképeknél ugyanaz a
 * tétel (irány + összeg + dátum + hasonló név) csak egyszer marad. Egy képen BELÜL
 * nem szűrünk – ott két azonos vásárlás valódi lehet.
 */
export function dedupeAcrossImages<
  T extends { kind: string; amount: string; merchant: string; spentAt: string },
>(groups: T[][]): { rows: T[]; removed: number } {
  const kept: { row: T; img: number }[] = [];
  let removed = 0;
  groups.forEach((rows, img) => {
    for (const row of rows) {
      const n = normName(row.merchant);
      const dup = kept.some(
        (k) =>
          k.img !== img &&
          k.row.kind === row.kind &&
          k.row.amount === row.amount &&
          k.row.spentAt === row.spentAt &&
          similarity(normName(k.row.merchant), n) >= MATCH_THRESHOLD
      );
      if (dup) removed += 1;
      else kept.push({ row, img });
    }
  });
  return { rows: kept.map((k) => k.row), removed };
}
