# Story 1.1: Projektváz, Upstash Redis, Vercel deploy

**Epic:** 1 (Alapok és üzemeltetés) · **Állapot:** kész (2026-07-02) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** fejlesztő **szeretnék** egy egyszerű, olcsón üzemeltethető Next.js appot **azért, hogy** gyorsan tudjak új modulokat építeni.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Next.js 16 (App Router, server actionök), Vercel deploy a `main` ágról.
2. **AC2** — Minden adat Upstash Redisben, JSON-értékekkel; kulcs-séma: `src/lib/redis.ts › key` (háztartásonként `hh:<id>:…`).
3. **AC3** — Az adatbázis a csanad.peter.czarth@gmail.com Upstash-fiókjában van (console.upstash.com/redis), nem a Vercel Storage-ban.
4. **AC4** — Képek/fájlok Cloudflare R2-ben (`eletapp` bucket, publikus), R2 nélkül inline fallback.
5. **AC5** — PWA (manifest, ikon), téma-választó, reszponzív sidebar + alsó navigáció.

## Megvalósítás

- `src/lib/redis.ts`, `src/lib/r2.ts`, `src/app/layout.tsx`, `next.config.ts`

## Tesztek

Automata teszt még nincs: a logika főleg UI és Redis-olvasás/írás (`src/lib/data.ts`). Ha a modul változik, a változáshoz teszt jár.

## Megjegyzések

- 2026-11-08: a Free Tier adatbázist az Upstash 14 nap inaktivitás után törölte; backupból visszaállítva (új endpoint). Lásd Story 1.2.
