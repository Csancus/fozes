# Story 1.3: Heti teljes mentés privát R2 bucketbe

**Epic:** 1 (Alapok és üzemeltetés) · **Méret:** S · **Kockázat:** HIGH (érzékeny adat a mentésben) · **Állapot:** kész (2026-11-08, 6d8b91c)
**Forrás:** Csanád, 2026-11-08: „legyen egy heti mentés akkor a cloudfare-be”.

## Felhasználói történet

**Mint** az app gazdája **szeretnék** saját mentést az adatokról **azért, hogy** ne csak az Upstash backupjára kelljen hagyatkoznom.

## Háttér

Az `eletapp` bucket publikus (a képek nyilvános URL-ről jönnek), ezért a mentés – ami jelszó-hasheket és pénzügyi adatokat tartalmaz – külön, privát bucketbe (`eletapp-backup`) megy.

## Elfogadási kritériumok

1. **AC1** — Vasárnap 03:00 UTC a cron a Redis összes kulcsát (típussal, nyers értékkel) `backups/YYYY-MM-DD.json`-ba írja.
2. **AC2** — A Redisből csak olvas.
3. **AC3** — `CRON_SECRET` nélkül sosem fut (401).
4. **AC4** — Hiányzó bucket/R2 beállításnál érthető hibával (500) áll le, semmit nem ír.

## Megvalósítás

- `src/app/api/cron/backup/route.ts`, `vercel.json` (`0 3 * * 0`); env: `R2_BACKUP_BUCKET`, `CRON_SECRET`, `R2_*`.
- Első éles futás: 2026-11-08, 520 kulcs, ~254 KB.

## Tesztek

| AC | Teszt |
|---|---|
| AC3, AC4 | `tests/ops/cron.test.ts › Story 1.3 – mentés cron` |
| AC1, AC2 | kézi: éles futás eredménye (fájl az `eletapp-backup`-ban) |

## Nyitott kérdések / kockázatok

- Visszatöltés még nincs megírva → Story 1.5.
