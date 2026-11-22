# Story 10.12 – Revolut havi nézet (valódi augusztusi képernyőképek)

**Állapot:** kész (2026-11-22)

## Igény
A user 13 Revolut-képernyőképet (augusztus 5–31.) tölt fel; az oldal ezekből a tételeket olvassa ki.

## Mérés (13 kép × 3 méret, `OCR_DIR=<mappa> OCR_JITTER=0.9,1,1.1`)
| | előtte | utána |
|---|---|---|
| hibátlan tétel | 40/51 (78%, 1 méret) | 150/153 (98%) |
| összeg | 50/51 | 153/153 |
| dátum | 40/51 | 153/153 |
| hamis tétel | 24 | 1 |

A régi képkészlet (`tests/fixtures/ocr`) változatlan: 57/99, 3 hamis.
A képek nem kerültek a repóba (személyes pénzügyi adat); a mérő `OCR_DIR` kapcsolóval külső mappát is olvas.

## Elfogadási feltételek
- AC1: A Revolut fejléce (állapotsor, egyenleg, „aug. 15., 3:53”, hónap-fülek) nem tétel; az egyenleg időpontja az első
  napfejléc előtti tételek napja. A „aug. 15. -155 000 Ft” napfejléc a napi összeggel dátum, nem tétel.
- AC2: Elveszett tizedesvessző: „-16 67716 Ft” → 16 677 (az idő után álló szám nem érintett).
- AC3: Összeg nélküli sor („Bankkártya hitelesítése”) után a név nem ragad a következő tételre.
- AC4: Névtisztítás: ikon-zaj nagybetűs név előtt („oS MAV”, „Mm BILLA”, „NM FOXPOST”), „emo, …”,
  „BILLA BILLA” → „BILLA”, „Trio 8. Fornetti” → „Trio & Fornetti”, „Visszatérítés tőle: MÁV” → „MÁV” (bevétel).
- AC5: Hónapnév-elírás: „aua. 16.” → aug. 16.

## Tesztek
| Teszt | Típus |
|---|---|
| `tests/lib/bank-ocr-revolut-honap.test.ts` – AC1–AC4 (valódi tesseract-szöveg) | unit |
| `scripts/ocr/ocr.bench.ts` `OCR_DIR` – 13 kép mérése | kézi mérés |
