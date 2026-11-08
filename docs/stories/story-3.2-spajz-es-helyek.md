# Story 3.2: Spájz, tárolási helyek, mértékegységek, lejárat

**Epic:** 3 (Főzés) · **Állapot:** kész (2026-07-02) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** háztartás **szeretnénk** tudni, mi van otthon és hol **azért, hogy** ne vegyünk feleslegesen és ne romoljon meg semmi.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Tételek tárolási helyekhez (hűtő, fagyasztó, kamra, egyéni) rendelve, mennyiséggel, lejárattal, árral.
2. **AC2** — Mértékegységek közös alapra váltanak (g/dkg/kg, ml/dl/l, db); az „egyéb” egységek (csomag, ek, kk, csipet) nem hasonlíthatók.

## Megvalósítás

- `src/app/spajz/*`, `src/app/helyek/*`, `src/lib/units.ts`

## Tesztek

| AC | Teszt |
|---|---|
| AC2 | `tests/lib/units.test.ts › Story 3.2 – mértékegységek` |
