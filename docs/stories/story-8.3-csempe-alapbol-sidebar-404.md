# Story 8.3: Csempe alapból, becsukható oldalsáv, kijelentkezés, 404

**Epic:** 8 (Megjelenés és UX) · **Méret:** S · **Kockázat:** LOW (csak UI)
**Állapot:** kész (2026-11-20)
**Forrás:** user, 2026-11-20 – „az üveges csempe gombot szeretném kivenni, és minden színstílusban legyen benne default”, „a kezdő menü neve kezdőlap legyen”, „a kijelentkezés legyen elérhető a bal sidebarban is”, „lehessen becsukni a bal sidebart”, „legyen jobb a 404 oldal”

## Felhasználói történet

**Mint** felhasználó **szeretném**, ha az üveges csempe mindig látszana, az oldalsávot be tudnám csukni, onnan ki tudnék jelentkezni, és egy rossz link ne egy csupasz hibaoldalra vigyen.

## Elfogadási kritériumok

1. **AC1** — Nincs Sima / Üveges csempe kapcsoló; a `<html>` mindig `data-style="csempe"`, bármelyik témaszínnel és móddal.
2. **AC2** — A menüpont neve „Kezdőlap” (oldalsáv és alsó menü).
3. **AC3** — A bal oldalsáv alján van egy „Kijelentkezés” gomb.
4. **AC4** — Az oldalsáv fejlécében lévő gombbal becsukható. Ilyenkor a tartalom kitölti a helyét, bal lent egy gomb nyitja vissza, az állapotot pedig újratöltés után is villanás nélkül megtartja (localStorage `sidebar` → `data-sidebar="collapsed"`).
5. **AC5** — A 404 oldal megmondja, mi történt, ad egy „Vissza a kezdőlapra” gombot és modul-linkeket.
6. **AC6** — A kategória/projekt stb. színválasztóban nincs a böngésző natív RGB-ablaka (nem stílusozható, és úgyis a palettára kerekített); a paletta lekerekített négyzetekből álló rács, a kiválasztotton pipa.
7. **AC7** — Az almenüs menüpontok (Főzés, Költségek, Teendők, utazás) mellett egy nyíllal az almenü összecsukható/kinyitható; az állapotot a böngésző megjegyzi (localStorage `sidebar-groups`).

## Megvalósítás

- `src/app/layout.tsx`: `data-style="csempe"` fixen; `src/lib/appearance.ts`, `theme-script.ts`: a stílus kikerült.
- `src/components/ThemeSwitcher.tsx`: a szegmentált stílusválasztó törölve.
- `src/lib/sidebar.ts`, `src/components/Sidebar.tsx`, `AppShell.tsx`, `globals.css`: becsukás és kijelentkezés.
- `src/app/not-found.tsx`: új 404.

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `tests/lib/appearance.test.ts › Story 8.3 › AC1` |
| AC4 | `tests/lib/sidebar.test.ts › Story 8.3 – becsukható oldalsáv` |
| AC2, AC3, AC5, AC6, AC7 | kézi |
