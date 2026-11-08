<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Munkafolyamat: story + teszt minden változáshoz

Kicsi app, kicsi folyamat – de minden változásnak legyen nyoma és tesztje.

1. **Story:** új funkció / javítás előtt nézd meg a [docs/epics.md](docs/epics.md)-t. Ha nincs hozzá story, írj egyet a
   [sablonból](docs/stories/_template.md) (`docs/stories/story-<epic>.<n>-<rovid-nev>.md`), és vedd fel az indexbe.
   Kis változásnál elég egy meglévő story AC-listáját bővíteni.
2. **Teszt:** ahol a logika tesztelhető (lib-függvény, server action, route), írj tesztet a `tests/` alá.
   A `describe`/`it` nevében hivatkozz a storyra és az AC-re (`describe("Story 2.2 – …")`, `it("AC3: …")`), és a
   story „Tesztek” táblázatába írd be a tesztet. Tisztán UI-változásnál a story-ban jelöld „kézi” ellenőrzésként.
3. **Kapu commit előtt:** `npm run typecheck && npm test` legyen zöld.
4. **Lezárás:** a storyban állapot → `kész (<dátum>, <commit>)`, az indexben ✅.

Tesztek: Vitest, Node környezet, a Redis memóriában fut (`tests/support/fake-redis.ts`, automatikusan
mockolva a `tests/support/setup.ts`-ben). Ha új Redis-parancsot használsz, add hozzá a fake-hez is.

Adatbázis: Upstash Redis a csanad.peter.czarth@gmail.com fiókban (console.upstash.com/redis) – nem a Vercel Storage-ban.
Free Tier: keep-alive cron (Story 1.2) és heti mentés a privát `eletapp-backup` R2 bucketbe (Story 1.3).
Az `eletapp` bucket publikus – érzékeny adat nem mehet bele.
