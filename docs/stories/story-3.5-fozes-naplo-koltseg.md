# Story 3.5: „Elkészítettem” napló és költségbecslés

**Epic:** 3 (Főzés) · **Állapot:** kész (2026-07-02) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** szakács **szeretném** látni, mikor mit főztem és mennyibe kerül egy recept **azért, hogy** tervezni tudjak.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Főzés-napló fotóval és csillagos értékeléssel receptenként.
2. **AC2** — Recept költségbecslés a spájz-árak alapján: egységátváltással, több egyező tételnél átlagárral; ár vagy összehasonlítható egység nélkül nincs becslés.

## Megvalósítás

- `src/app/etelek/*`, `src/app/fozes/*`, `src/lib/cost.ts`

## Tesztek

| AC | Teszt |
|---|---|
| AC2 | `tests/lib/cost.test.ts › Story 3.5 – költségbecslés` |
