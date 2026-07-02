# Főzés

Receptek, spájz-nyilvántartás, bevásárlólista, vásárlás-import és ártörténet.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Upstash Redis (adatbázis)
- Iron-session (auth cookie)
- Vercel (deploy)

## Adatbázis + deploy

Az adatbázis külön van a Vercel-től, **Upstash közvetlen ingyenes fiókban** (nem a Vercel Marketplace integráció, mert az fizetős).

1. **Upstash regisztráció**: https://console.upstash.com/ → **Google OAuth**-al belépés → Create Database → Redis → Free tier (10 000 command/nap, 256 MB, kártya nélkül).
2. Másold ki az adatbázis oldaláról:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. **Vercel deploy**:
   - Importáld a repót: https://vercel.com/new
   - Project Settings → Environment Variables → add hozzá **manuálisan** a két Upstash értéket + `SESSION_PASSWORD`-öt (min. 32 karakteres random string, pl. `openssl rand -base64 32`)
   - Deploy.

## Lokál fejlesztés

```bash
cp .env.example .env.local
# töltsd ki a Redis-t + SESSION_PASSWORD-öt
npm install
npm run dev
```

## Modulok (készül)

- `/receptek` — receptek CRUD, hozzávalókkal
- `/spajz` — helyek (hűtő/fagyasztó/tartós + custom szekrény), lejárati dátum
- `/bevasarlas` — receptekből generált lista, itthon vs venni
- `/vasarlas` — blokk (szöveg/PDF) parser, tételek + árak, spájzba írás
