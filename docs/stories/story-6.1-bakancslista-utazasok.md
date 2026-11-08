# Story 6.1: Bakancslista és utazások

**Epic:** 6 (Bakancslista és utazások) · **Állapot:** kész (2026-07-18 – 2026-08) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** család **szeretnénk** gyűjteni, mit szeretnénk csinálni, és megtervezni az utazásainkat.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Bakancslista típusokkal, gyors táblázatos felvitellel, kép/screenshot → OCR alapú előkitöltéssel, „megcsináltuk” popup.
2. **AC2** — Meglepetés: tétel elrejtése egy tag elől, közös jelszóval feloldható.
3. **AC3** — Utazások tervvel és rich-text jegyzettel.

## Megvalósítás

- `src/app/bakancslista/*`, `src/app/utazasok/*`, `src/lib/saved-visuals.ts`, `src/lib/richtext.ts`

## Tesztek

Automata teszt még nincs: a logika főleg UI és Redis-olvasás/írás (`src/lib/data.ts`). Ha a modul változik, a változáshoz teszt jár.
