# Story 8.2: Világos / sötét / rendszer mód + Apple-szerű üveges csempe + görgetősávok

**Epic:** 8 (Megjelenés és UX) · **Méret:** M · **Kockázat:** LOW (csak megjelenés; a „Sima” stílus változatlan)
**Állapot:** kész (2026-11-20)
**Forrás:** tulajdonos, 2026-11-20: „legyen nappali-éjszakai beállítás, már a belépés oldalon is”; „a csempés megoldással nem vagyok elégedett, legyen ennél apple-ösebb”; görgetősávok legyenek szebbek, macOS-szerűek

## Felhasználói történet

**Mint** felhasználó **szeretném** magam választani a világos vagy sötét megjelenést (vagy hagyni a rendszerre), és egy visszafogottabb, Apple-szerű üveges stílust **azért, hogy** kellemesebb legyen az app nappal és este is.

## Elfogadási kritériumok

1. **AC1** — `html[data-mode="light"|"dark"]`, hiányában a rendszer (`prefers-color-scheme`) dönt; `localStorage.mode` = `light`/`dark`/`system`. A sötét CSS-változók (a témaszínekkel együtt) és a Tailwind `dark:` variáns is ezt követik: sötét = (rendszer sötét ÉS nincs `data-mode="light"`) VAGY `data-mode="dark"`. A `color-scheme` módonként helyes (natív vezérlők).
2. **AC2** — Villanásmentes: a `<head>`-script hidratálás előtt beállítja a `data-theme`/`data-style`/`data-mode` attribútumot, ugyanazzal a logikával, mint az `appearance.ts`.
3. **AC3** — Egyetlen ikon a színválasztók mellett (2026-11-20 módosítva, tulajdonos: „rendszer beállítás nem kell … elég 1 ikon … ha megnyomom vált ikont és beállítást”): nap = világos, hold = sötét; megnyomásra a ténylegesen látszó módból a másikba vált és elmenti. Választás előtt a rendszer adja a kezdőállapotot. Helyek: sidebar témaváltó, belépés oldal jobb felső sarka, mobilon a Család oldal „Megjelenés” szekciója. A példányok szinkronban vannak.
4. **AC4** — Üveges csempe, Apple „materials” irány: áttetsző anyag `blur(24px) saturate(180%)`, hajszálvékony szegély + felső fény, lágy nagy szórású árnyék, nagy lassú visszafogott színfoltok (sötétben a témaszínből, hogy ne legyen sáros), iOS-háttér (#f2f2f7 / közel fekete), 20px lekerekítés, tömör témaszínű gombok (AA-kontrasztú árnyalat: `--primary-strong`), iOS-szerű szegmentált vezérlők, visszafogott hover/fókusz. A témaszínt, a betűtípust és a betűméretet nem írja felül (2026-11-20: a tulajdonos kérésére kivéve az SF-tipográfia); világos és sötét módban is megy.
5. **AC5** — `prefers-reduced-motion`: nincs foltmozgás / emelkedés; `prefers-reduced-transparency`: tömör kártyák, foltok nélkül.
6. **AC6** — Görgetősávok: vékony (10px, a hüvelykujj ~5–6px), lekerekített, áttetsző hüvelykujj, átlátszó sín, nyilak nélkül, hoverre erősebb; világos/sötét módot követi; függőleges és vízszintes, oldal és belső panelek is. Chromium/Safari `::-webkit-scrollbar` (szándékosan NINCS `scrollbar-color`, mert Chrome 121+-ban az kikapcsolná a webkit-szabályokat), Firefox `scrollbar-width: thin` + `scrollbar-color` (`@supports not selector(::-webkit-scrollbar)`).

## Megvalósítás

- `src/lib/appearance.ts` – tiszta mód/téma/stílus-feloldás + kis kliens-store (`setAppearance`, `subscribeAppearance`)
- `src/lib/theme-script.ts` – head-script `data-mode`-dal
- `src/components/useAppearance.ts`, `src/components/ModeSwitcher.tsx` (új), `src/components/ThemeSwitcher.tsx` (store-ra átírva)
- `src/app/belepes/page.tsx` – mód-kapcsoló a sarokban, a saját foltok `data-plain-only`
- `src/app/csalad/page.tsx` – „Megjelenés” szekció (mobilon itt érhető el)
- `src/app/globals.css` – `@custom-variant dark`, kettős sötét ág (rendszer + kényszerített), `--primary-strong`, görgetősávok, új csempe-blokk
- Megjegyzés: továbbra sincs `color-mix()` a globals.css-ben; a kiszolgált CSS-ben ellenőrizve: csempe-szabályok, `data-mode` ágak, `dark:` variáns mindkét ága, `@supports selector(::-webkit-scrollbar)`, `prefers-reduced-transparency`.

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `tests/lib/appearance.test.ts › Story 8.2 – … › AC1: …` (4 eset) |
| AC2 | `tests/lib/appearance.test.ts › AC2: a head-script ugyanazt állítja be…`, `AC2: … nem dob hibát…` |
| AC1, AC3–AC6 | kézi, 2026-11-20, Windows Chrome: belépés oldal csempe stílussal világos + sötét módban, narancs / türkiz / kék témával, asztali (1920px) és 390px széles nézetben (iframe-ben); mód-kapcsoló kattintással; görgetősávok függőleges+vízszintes panelen világosban és sötétben. Belépés utáni oldalak (sidebar, Család) NINCSENEK képernyőn ellenőrizve (helyben nincs Redis/belépés). |
