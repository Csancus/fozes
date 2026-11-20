# Story 9.1: „Aktuális” oldal naptárral (nap / hét / hónap)

**Epic:** 9 (Aktuális és naptár) · **Méret:** M · **Kockázat:** LOW (csak olvasás, URL-paraméterek)
**Állapot:** kész (2026-11-20)
**Forrás:** user, 2026-11-20 – „a Ma oldalon legyen calendar lehetőség is ahol bármelyik napot ki tudom választani vagy hetet vagy hónapot … lehetne Aktuális a neve, default a ma tölt be”

## Felhasználói történet

**Mint** családtag **szeretném** a teendőket bármelyik napra, hétre vagy hónapra lebontva látni, **azért, hogy** előre tudjak tervezni, ne csak a mát lássam.

## Elfogadási kritériumok

1. **AC1** — Az oldal neve „Aktuális” (menü + cím). Az `/ma` paraméter nélkül a mai napot tölti be a régi logikával (lejárt + ma + holnap). Hibás paraméter esetén is a mai nap jön.
2. **AC2** — Nap / Hét / Hónap nézet (`?nap=YYYY-MM-DD`, `?het=<hétfő>`, `?ho=YYYY-MM`). Ilyenkor azok a teendők látszanak, amelyek határideje az időszakba esik (nyitott és kész is); a számlálók: Lejárt / Nyitott / Kész.
3. **AC3** — Előző/következő léptetés, „Ma / Ez a hét / Ez a hónap” visszaugrás, olvasható időszak-címke.
4. **AC4** — Naptár: hétfővel kezdődő havi rács, a nyitott teendős napokon pötty (a lejártaknál piros); egy napra kattintva az adott nézetben arra ugrik, a hónap nevére kattintva az egész hónapra.

## Megvalósítás

- `src/lib/period.ts`: időszak-számítás, URL, címke, naptárrács.
- `src/app/ma/PeriodPicker.tsx`: nézetváltó, léptetés, naptár.
- `src/app/ma/page.tsx`: `searchParams` alapján szűr; `Sidebar.tsx`: „Aktuális”.

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC4 | `tests/lib/period.test.ts › Story 9.1 – Aktuális: nap / hét / hónap` |
| UI | kézi |
