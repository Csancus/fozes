# Story 10.15 – Új csoport / fizetési mód / ki(nek) a legördülőből

**Állapot:** kész (2026-11-22)

## Igény
A gyors / képes rögzítésben és a tétel-táblában a Csoport, Fizetés és Ki(nek) legördülőből is lehessen új elemet
felvenni (mint a kategóriánál és a projektnél).

## Elfogadási feltételek
- AC1: A három legördülő alján „+ Új csoport… / Új fizetési mód… / Új személy…” sor; a név megadása után az elem
  létrejön, bekerül a listába és a sorban kiválasztódik (az oldal többi sorában is azonnal elérhető).
- AC2: Alapértékek: fizetési mód = kártya, szürke; személy = kék; csoport = lila (a Beállításokban módosítható).
- AC3: A Ki(nek) és a Csoport oszlop akkor is elérhető, ha még nincs egy elem sem.

## Tesztek
| Teszt | Típus |
|---|---|
| AC1–AC3 | kézi + helyi Playwright-próba (mindhárom elem létrehozása a gyors rögzítésben) |
