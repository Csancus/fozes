# Story 3.3: Bevásárlólista, számla-beolvasás, vásárlások

**Epic:** 3 (Főzés) · **Állapot:** kész (2026-07-02) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** bevásárló **szeretnék** listát a receptekből és a számlámból **azért, hogy** gyorsan és pontosan vásároljak.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Bevásárlólista kézi tételekkel és recept-alapanyag mátrix nézettel.
2. **AC2** — Számla hozzáfűzése szövegből, PDF-ből vagy fotóból (OCR), tételek párosítása.
3. **AC3** — Vásárlások rögzítése lejárattal; statisztika oldal.

## Megvalósítás

- `src/app/bevasarlas/*`, `src/app/vasarlas/*`, `src/app/statisztika/*`, `src/lib/matrix.ts`

## Tesztek

Automata teszt még nincs: a logika főleg UI és Redis-olvasás/írás (`src/lib/data.ts`). Ha a modul változik, a változáshoz teszt jár.
