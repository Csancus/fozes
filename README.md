# Főzés

Receptek, spájz-nyilvántartás, bevásárlólista, vásárlás-import és ártörténet.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Upstash Redis (adatbázis)
- Iron-session (auth cookie)
- Vercel (deploy)

## Vercel deploy

1. Importáld a repót Vercelben: https://vercel.com/new
2. **Storage** fülön: Upstash Redis (Marketplace) integráció → automatikusan bekerül a két `UPSTASH_REDIS_REST_*` env var.
3. Add hozzá manuálisan: `SESSION_PASSWORD` (min. 32 karakteres random string, pl. `openssl rand -base64 32`).
4. Deploy.

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
