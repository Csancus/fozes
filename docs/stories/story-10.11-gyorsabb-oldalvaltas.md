# Story 10.11 – Gyorsabb oldalváltás

**Állapot:** kész (2026-11-22)

## Igény
Lassan töltenek be az oldalak váltáskor.

## Mérés (helyi éles build, Redis-mock 50 ms késleltetéssel kérésenként)
| Oldal | előtte | utána |
|---|---|---|
| /koltsegek | 769 ms | 372 ms |
| /koltsegek/tabla | 700 ms | 379 ms |
| /koltsegek/gyors | 621 ms | 372 ms |
| /koltsegek/kep | 554 ms | 359 ms |
| /koltsegek/attekintes | 624 ms | 256 ms |

Böngészőben: első látogatásnál a töltő ~100 ms-on belül megjelenik (eddig a kattintás után semmi nem
történt, amíg a szerver végzett); 30 mp-en belüli visszalépés ~80–100 ms.

## Elfogadási feltételek
- AC1: Minden oldalváltásnál azonnal visszajelzés van (gyökér `loading.tsx` → a dinamikus oldalak töltő-váza
  előre letöltődik, a kattintás rögtön vált).
- AC2: A költség-oldalak alapérték-ellenőrzése egy hálózati körben fut (`ensureCostDefaults`), a varázsló-állapot
  és az ismétlődő tételek futtatása párhuzamosan a többi lekéréssel.
- AC3: A 30 mp-en belül újra megnyitott oldal a kliens-gyorsítótárból jön (`staleTimes.dynamic = 30`); mentés után
  a server actionök `revalidatePath`-ja üríti.

## Nyitott
Élesben a függvények `iad1`-ben (USA) futnak (`x-vercel-id: fra1::iad1`). Ha az Upstash-adatbázis EU-ban van,
minden Redis-kérés átmegy az óceánon → `vercel.json`-ba `"regions": ["fra1"]` tovább gyorsítana.

## Tesztek
| Teszt | Típus |
|---|---|
| `tests/lib/cost-defaults.test.ts` – Story 10.11 AC2 | unit |
| AC1, AC3 | kézi + helyi Playwright-mérés |
