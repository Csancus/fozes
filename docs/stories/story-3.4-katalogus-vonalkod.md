# Story 3.4: Termékkatalógus, vonalkód, OpenFoodFacts

**Epic:** 3 (Főzés) · **Állapot:** kész (2026-07-02) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** vásárló **szeretném** a termékeket vonalkóddal felvenni **azért, hogy** ne kelljen mindent begépelni.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Háztartásonkénti termékkatalógus, vonalkód-olvasó.
2. **AC2** — Ismeretlen vonalkódnál OpenFoodFacts-lekérdezés (név, márka, tápérték, kép).

## Megvalósítás

- `src/app/katalogus/*`, `src/app/api/openfoodfacts/[barcode]/route.ts`

## Tesztek

Automata teszt még nincs: a logika főleg UI és Redis-olvasás/írás (`src/lib/data.ts`). Ha a modul változik, a változáshoz teszt jár.
