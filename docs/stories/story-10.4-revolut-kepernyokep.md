# Story 10.4: Revolut-képernyőkép a gyors rögzítéshez

**Epic:** 10 (Képfelismerés) · **Méret:** S · **Kockázat:** LOW (csak a parser)
**Állapot:** kész (2026-11-20)
**Forrás:** user, 2026-11-20 – Revolut-kép: „ott a név és mindig a Ft összeget olvassa be. Bakeshop 1730 Ft a , mögötti tizedes forint nem kell. Kfc 3315 Ft.”

## Elfogadási kritériumok

1. **AC1** — A forint-összeg fillérjét levágjuk, nem kerekítjük („-3 315,62 Ft” → 3315). Ez minden képes felismerésre vonatkozik.
2. **AC2** — A másodlagos deviza-összeg (Kč, EUR, €, USD…) nem tétel és nem zavarja a nevet; a kétsoros név („McCarthy's Irish” + „Pub”) egyben.
3. **AC3** — Saját számlák közti pénzváltás („HUF → CZK”) és az aprópénz-megtakarítás nem tétel; a fenti egyenleg sem.

## Megvalósítás

- `src/lib/bank-ocr.ts`: `FOREIGN_AMOUNT_RE`, `NON_TX_RE`, névfolytatás; `src/lib/ocr/postprocess.ts`: `parseHufNumber` levágás.

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC3 | `tests/lib/bank-ocr-erste.test.ts › Story 10.4 – Revolut képernyőkép` |
| AC1 | `tests/lib/ocr-postprocess.test.ts` (2 350,50 → 2350) |
