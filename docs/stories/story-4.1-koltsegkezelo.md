# Story 4.1: Költségkezelő

**Epic:** 4 (Költségek) · **Állapot:** kész (2026-07-18 – 2026-08) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** háztartás **szeretnénk** követni a kiadásainkat és bevételeinket **azért, hogy** lássuk, mire megy el a pénz.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Kiadás és bevétel egy űrlapon és gyors (szerkeszthető) táblázatban; kategóriák ikonokkal, boltok, fizetési mód, személy, projekt, csoport.
2. **AC2** — Ismétlődő tételek, felülvizsgálat-jelölő, duplikáció-figyelés, bankszámla-kivonat OCR.
3. **AC3** — Áttekintő dashboard, célok; hónap/csoport/felülvizsgálat indexek a gyors betöltéshez.

## Megvalósítás

- `src/app/koltsegek/*`, `src/lib/expense-visuals.ts`, `src/lib/bank-ocr.ts`, `src/lib/data.ts`

## Tesztek

Automata teszt még nincs: a logika főleg UI és Redis-olvasás/írás (`src/lib/data.ts`). Ha a modul változik, a változáshoz teszt jár.

## Megjegyzések

- A legfontosabb adat (a user szerint „nagyon fontos, nem veszíthetjük el”) – mentés: Story 1.3.
