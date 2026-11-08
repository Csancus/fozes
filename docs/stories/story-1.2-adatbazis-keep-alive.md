# Story 1.2: Az adatbázis ne törlődjön inaktivitás miatt

**Epic:** 1 (Alapok és üzemeltetés) · **Méret:** S · **Kockázat:** HIGH (adatvesztés) · **Állapot:** kész (2026-11-08, 43708a5)
**Forrás:** Csanád, 2026-11-08: „legyen akkor 2 naponta a cron ami fut”.

## Felhasználói történet

**Mint** az app gazdája **szeretném**, hogy az ingyenes Upstash adatbázis ne törlődjön, ha két hétig nem használom, **azért, hogy** ne veszítsem el a pénzügyi adataimat.

## Háttér

Az Upstash Free Tier 14 nap inaktivitás után automatikusan törli az adatbázist. 2026 novemberében ez megtörtént (`hot-lizard-135413`), a belépés `ENOTFOUND` hibával állt; backupból sikerült visszaállítani.

## Elfogadási kritériumok

1. **AC1** — Kétnaponta (06:00 UTC) a Vercel cron meghívja a `/api/cron/keepalive` route-ot, ami a `system:keepalive` kulcsba időbélyeget ír (a felhasználói adatokhoz nem nyúl).
2. **AC2** — Ha be van állítva `CRON_SECRET`, titok nélkül 401.

## Megvalósítás

- `src/app/api/cron/keepalive/route.ts`, `vercel.json` (`0 6 */2 * *`)

## Tesztek

| AC | Teszt |
|---|---|
| AC1, AC2 | `tests/ops/cron.test.ts › Story 1.2 – keep-alive cron` |

## Nyitott kérdések / kockázatok

- Hosszú távon egyszerűbb: Upstash Pay as you go (nincs inaktivitás-törlés).
