# Story 10.7: Táblázat-oszlopok egyenkénti összecsukása

**Epic:** 10 · **Méret:** S · **Kockázat:** LOW (UI)
**Állapot:** kész (2026-11-21)
**Forrás:** user, 2026-11-21 – „/koltsegek/tabla itt vagy a gyors rögzítésnél lehessen összecsukni minden oszlopot egyesével, hogy kis képernyőn is helytakarékos maradhasson. összecsuk és kinyit is legyen.”

## Elfogadási kritériumok

1. **AC1** — A Tétel-táblában (`/koltsegek/tabla`) és a Gyors rögzítésben (a képes rögzítésben is) minden oszlop fejlécében van összecsukó gomb (›‹).
2. **AC2** — Az összecsukott oszlop keskeny csík (28 px) marad függőleges felirattal; a fejlécére koppintva kinyílik. Az adat megmarad, mentéskor is benne van.
3. **AC3** — Az állapot táblázatonként megmarad (localStorage: `cols-collapsed:gyors`, `cols-collapsed:tabla`). Az „Oszlopok” kapcsoló (teljes elrejtés) változatlan.

## Megvalósítás

- `src/components/ui/ColumnToggle.tsx`: `useCollapsedColumns`, `ColHead`, `COLLAPSED_W`.
- `BatchEntry.tsx`, `ExpenseTable.tsx`: fejlécek + cellák; `globals.css`: `td.col-collapsed`.

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC3 | kézi: helyi Playwright 375 px-en (összecsuk, kinyit, újratöltés után megmarad) |
