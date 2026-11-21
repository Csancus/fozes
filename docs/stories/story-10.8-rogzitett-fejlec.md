# Story 10.8: Rögzített táblázat-fejléc görgetéskor

**Epic:** 10 · **Méret:** S · **Kockázat:** LOW (UI)
**Állapot:** kész (2026-11-21)
**Forrás:** user, 2026-11-21 – „/koltsegek/tabla és ahol hasonló oldal van a táblázat címsora legyen rögzítve görgetésre, tehát a típus dátum megnevezés stb”

## Elfogadási kritériumok

1. **AC1** — A Tétel-táblában, a Gyors rögzítésben (és a képes rögzítésben), a bakancslista és a teendők gyors táblázatában görgetéskor az oszlopfejléc (Típus, Dátum, Megnevezés…) az oldal fejléce alatt marad, a táblázat aljáig.
2. **AC2** — A vízszintes görgetés és az oszlop-összecsukás (10.7) változatlanul működik.

## Megvalósítás

- A táblázat-dobozok vízszintesen görgetnek, így bennük a CSS `sticky` az oldal görgetését nem követi.
  Először belső függőleges görgetéssel próbáltuk, de az oldal görgetésekor a fejléc kicsúszott (helyi
  Playwright mutatta meg). A második változat görgetésenként JS-sel tolta a fejlécet – telefonon
  szaggatott (user, 2026-11-21: „kicsit szaggat görgetéskor”). Végleges: `src/components/StickyTableHeads.tsx`
  (az AppShellben) egy `position: fixed` fejléc-másolatot mutat az oldal fejléce alatt, amikor az eredeti
  kicsúszik; függőlegesen nem mozog (nem szaggat), vízszintesen a doboz görgetését követi, a gombjai az
  eredeti fejléc gombjait nyomják meg.
- `globals.css`: `.sticky-table`; a négy táblázat dobozán `sticky-table` osztály.

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC2 | kézi: helyi Playwright 375 px-en, gyors + tábla 17 sorral: a másolat teteje görgetés közben végig 69 px, vízszintes szinkron, összecsukás a másolatból, az oldal tetején rejtve |
