# Story 10.10 – Saját legördülő a táblázatokban

**Állapot:** kész (2026-11-22)

## Igény
A legördülők (projekt, kategória stb.) natív rendszer-menüként nyíltak, ami főleg sötét módban csúnya volt.

## Elfogadási feltételek
- AC1: A gyors / képes rögzítés és a tétel-tábla minden legördülője (Típus, Kategória, Jelleg, Fizetés, Ki(nek),
  Projekt, Csoport) az app stílusát követő saját listát nyit, világos és sötét módban is (tömör háttér, kerek sarkok,
  kijelölt sor pipával, kategóriánál/projektnél színes pötty).
- AC2: 7-nél több opciónál a lista tetején keresőmező van; gépelés + Enter kiválasztja az első találatot.
- AC3: Billentyűzettel kezelhető (↑/↓, Enter, Esc, Tab); kattintás a listán kívül bezárja.
- AC4: Kategóriánál és projektnél a lista alján „+ Új …” sor nyitja a létrehozó ablakot.
- AC5: Képernyő alján felfelé nyílik; oldalgörgetéskor a gombbal együtt mozog.

## Megvalósítás
`src/components/ui/Dropdown.tsx`; a `CategorySelect` és `ProjectSelect` erre épül; a `BatchEntry` és `ExpenseTable`
natív `<select>`-jei lecserélve. Mellékhatás: a natív menü nem fogja el a billentyűzetet, így a nyitott lista +
Print Screen sem akad össze.

## Tesztek
| Teszt | Típus |
|---|---|
| AC1–AC5 | kézi + helyi Playwright-próba sötét módban (kategória kereséssel, új projekt létrehozása) |
