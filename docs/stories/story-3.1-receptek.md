# Story 3.1: Receptek: alapanyagok, skálázás, kategóriák, főzés-mód

**Epic:** 3 (Főzés) · **Állapot:** kész (2026-07-02 – 2026-07-03) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** szakács **szeretném** a receptjeimet egy helyen, alapanyagokkal **azért, hogy** gyorsan főzzek és vásároljak.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Recept alapanyagai szövegből beolvashatók („50 dkg liszt” → mennyiség, egység, név; ismeretlen egységnél db).
2. **AC2** — Recept skálázható adagszámra; kcal/fehérje, nehézség, címkék, kategória (leves/főétel/sütemény), borítókép.
3. **AC3** — Főzés-mód, duplikálás, archiválás; keresés és szűrők; külön megtekintő és szerkesztő nézet.

## Megvalósítás

- `src/app/receptek/*`, `src/lib/ingredient-parse.ts`, `src/lib/recipe-labels.ts`

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `tests/lib/ingredient-parse.test.ts › Story 3.1 – alapanyag-parser` |
