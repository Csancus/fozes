# Story 10.6: Képes rögzítés – képsáv felül, tételek időrendben

**Epic:** 10 (Képfelismerés) · **Méret:** XS · **Kockázat:** LOW
**Állapot:** kész (2026-11-21)
**Forrás:** user, 2026-11-21 – „a képek ne foglaljanak helyet a képernyő bal oldalán hanem valahol felül vagy alul legyenek … időrendben kerüljenek be a tételek, legalul a legrégebbi. most összevissza van”

## Elfogadási kritériumok

1. **AC1** — A feltöltött képek bélyegképei a táblázat fölött, egy vízszintesen görgethető sávban vannak (nem bal oldali oszlopban), így a táblázat teljes szélességű.
2. **AC2** — A több képről beolvasott tételek dátum szerint csökkenő sorrendben: legfelül a legfrissebb, legalul a legrégebbi. Azonos napon a képen belüli sorrend marad; a feltöltés sorrendje nem számít.

## Megvalósítás

- `src/app/koltsegek/kep/ExpenseOcrImport.tsx`: elrendezés + `sortNewestFirst` a duplikáció-szűrés után.
- `src/lib/merchant-match.ts`: `sortNewestFirst`.

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | kézi (UI) |
| AC2 | `tests/lib/merchant-match.test.ts › Story 10.6` |
