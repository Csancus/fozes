# Story 10.3: Korábbi, hasonló nevű tétel átvétele + duplikáció-szűrés + alapszemély

**Epic:** 10 (Képfelismerés) · **Méret:** S · **Kockázat:** LOW
**Állapot:** kész (2026-11-20)
**Forrás:** user, 2026-11-20 – „nézze meg hogy volt-e már olyan nevű megnevezés tétel … vagy ahhoz nagyon hasonló. és írja át arra és a kategóriát is update-elje be és a többi paramétert … a Ki(kinek) oszlop ezentúl default Csanád legyen”; „ha a képekről beolvasott tételek között duplikáció van, akkor azt szűrje ki”

## Elfogadási kritériumok

1. **AC1** — Képből beolvasott tételnél, ha az elmúlt 13 hónapban volt azonos irányú, azonos vagy nagyon hasonló nevű tétel (ékezet, kis-nagybetű, bolt-/terminálszám nem számít; ≥ 0,82 hasonlóság), a megnevezés a korábbira cserélődik, és átjön a legutóbbi ilyen tétel kategóriája, fizetési módja, ki(nek)-je, projektje, csoportja és jellege.
2. **AC2** — A „Ki(nek)” alapértéke új soroknál (Gyors rögzítés és Kép alapján): a belépett felhasználó saját személye név alapján, különben „Csanád”. A korábbi tételből átvett érték ezt felülírja.
3. **AC3** — Több kép között az azonos tétel (irány + összeg + dátum + hasonló név) csak egyszer marad, a kihagyottak számát kiírjuk. Egy képen belül nem szűrünk (két azonos vásárlás valódi lehet).

## Megvalósítás

- `src/lib/merchant-match.ts`: `buildMerchantProfiles`, `matchMerchant`, `defaultPersonId`, `dedupeAcrossImages`.
- `src/app/koltsegek/kep/ExpenseOcrImport.tsx`, `kep/page.tsx`, `gyors/page.tsx`, `gyors/BatchEntry.tsx` (`defaultPersonId` prop).

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC3 | `tests/lib/merchant-match.test.ts` |
