# Story 10.9 – Új projekt helyben, a táblázatokból

**Állapot:** kész (2026-11-22)

## Igény
A képes rögzítésnél (/koltsegek/kep), a gyors rögzítésnél és a tétel-táblában (/koltsegek/tabla) ugyanúgy lehessen
új projektet felvenni a projektlistába, ahogy kategóriát.

## Elfogadási feltételek
- AC1: A Projekt oszlop legördülőjében van „+ Új projekt…” opció; a felugró ablakban megadott névvel létrejön a projekt
  (hatókör: Költségek, szín: lila), bekerül a listába és a sorban ki is választódik.
- AC2: A Projekt oszlop akkor is elérhető, ha még egy projekt sincs (az oszlopválasztóból elrejthető).
- AC3: Az új projekt az ugyanazon oldalon lévő többi sor legördülőjében is azonnal megjelenik.

## Megvalósítás
- `createProjectInline(name)` server action (`src/app/koltsegek/actions.ts`).
- `useNamedCreator` általános modál; `useCategoryCreator` és `useProjectCreator` erre épül.
- `ProjectSelect` komponens; bekötve a `BatchEntry`-be (gyors + képes rögzítés) és az `ExpenseTable`-be.

## Tesztek
| Teszt | Típus |
|---|---|
| AC1–AC3 | kézi (tisztán UI; a mentés a meglévő `createProject`-et hívja) |
