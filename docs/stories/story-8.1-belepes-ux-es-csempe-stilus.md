# Story 8.1: Középre igazított belépés oldal + üveges csempe stílus

**Epic:** 8 (Megjelenés és UX) · **Méret:** S · **Kockázat:** LOW (csak UI, a globális stílus kapcsolóval jön)
**Állapot:** kész (2026-11-20)
**Forrás:** tulajdonos, 2026-11-20: „a belépés oldal nincs középre igazítva. legyen jobb a UX. és már nem főzés a neve hanem élet portál”; „legyen egy új design stílus opció … ez a csempés … az üveges csempék a lényeg, nem a szín”

## Felhasználói történet

**Mint** felhasználó **szeretném**, hogy a belépés oldal rendezett és egyértelmű legyen, és választhassak egy üveges-csempés megjelenést **azért, hogy** kellemesebb legyen használni az appot.

## Háttér

A layout minden oldalon `md:pl-64` helyet hagyott a sidebarnak, a belépésnél is, ahol sidebar nincs, ezért az űrlap jobbra csúszott. Az oldal még „Főzés” néven futott.

## Elfogadási kritériumok

1. **AC1** — Belépés / jelszócsere oldalon nincs sidebar-hely, az űrlap vízszintesen középen van (`AppShell` + `isAuthRoute`).
2. **AC2** — Az oldal neve „Élet Portál” (iránytű ikon, modul-chipek); meghívó-szöveg és jelszó-email is „Élet Portál”.
3. **AC3** — UX: fül-specifikus cím, jelszó megjelenítése/elrejtése, beküldés közben pörgő gomb, hibás belépésnél az email megmarad, a fókusz a következő kitöltendő mezőn van, ikonos hiba/siker-sáv, az „Elfelejtett jelszó” lap visszalinkkel.
4. **AC4** — A témaváltóban „Stílus: Sima / Üveges csempe” kapcsoló. A csempe bármelyik témaszínnel, világos és sötét módban is működik: áttetsző, elmosott kártyák, nagyobb lekerekítés, mély árnyék, témaszínű lebegő színfoltok, átmenetes pill gombok. Böngészőben megmarad (`localStorage.style`), villanás nélkül töltődik.

## Megvalósítás

- `src/components/AppShell.tsx`, `src/lib/auth-routes.ts`, `src/app/layout.tsx`: auth-oldalon nincs sidebar-padding
- `src/app/belepes/page.tsx`, `actions.ts`: új belépés oldal, email visszaadása hibánál
- `src/components/ui/PasswordInput.tsx`: jelszó-szem gomb
- `src/app/globals.css` (`:root[data-style="csempe"]`), `src/components/ThemeSwitcher.tsx`, `src/lib/theme-script.ts`
- Megjegyzés: a csempe-blokkban nincs `color-mix()`, mert a Next (Turbopack) CSS-feldolgozója csendben eldobta az egész blokkot.

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `tests/lib/auth-routes.test.ts › Story 8.1 – belépés oldal elrendezése` |
| AC1–AC4 | kézi: böngészőben 2026-11-20 (belépés, regisztráció hibával, türkiz + csempe) |
