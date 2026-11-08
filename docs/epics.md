# Epicek és storyk

**Utolsó frissítés:** 2026-11-08 · Állapotok: ✅ kész · 🟡 kód kész, éles beállítás hiányzik · ⏳ következő · 📋 backlog

Minden story külön fájl a [stories/](stories/) mappában (történet, elfogadási kritériumok, megvalósítás, tesztek).
Új story a [sablonból](stories/_template.md) indul. A tesztek (`tests/`) a story és az AC számára hivatkoznak
(`describe("Story 2.2 – …")`, `it("AC3: …")`). A „visszamenőleges” storyk a 2026-11-08 előtt elkészült funkciókat
írják le utólag, tömörebben.

Kicsi app, kicsi folyamat: nincs sprint, nincs readiness-riport. Szabály: **minden változáshoz story (vagy egy
meglévő story bővítése) és teszt**, ahol a logika tesztelhető. Részletek: [AGENTS.md](../AGENTS.md).

### Epic 1 – Alapok és üzemeltetés
| Story | Cím | Állapot |
|---|---|---|
| [1.1](stories/story-1.1-projektvaz-es-deploy.md) | Projektváz, Upstash Redis, Vercel deploy (visszamenőleges) | ✅ |
| [1.2](stories/story-1.2-adatbazis-keep-alive.md) | Az adatbázis ne törlődjön inaktivitás miatt (keep-alive cron) | ✅ |
| [1.3](stories/story-1.3-heti-mentes-r2.md) | Heti teljes mentés privát R2 bucketbe | ✅ |
| [1.4](stories/story-1.4-tesztek-es-story-folyamat.md) | Tesztinfrastruktúra és story-folyamat | ✅ |
| [1.5](stories/story-1.5-visszatoltes-mentesbol.md) | Visszatöltés mentésből (szkript + próba) | 📋 |

### Epic 2 – Fiók, háztartás, biztonság
| Story | Cím | Állapot |
|---|---|---|
| [2.1](stories/story-2.1-fiok-belepes-haztartas.md) | Regisztráció, belépés, közös háztartás (visszamenőleges) | ✅ |
| [2.2](stories/story-2.2-meghivok-es-tagok.md) | Lejáró, visszavonható meghívók és tag eltávolítása | ✅ |
| [2.3](stories/story-2.3-belepes-vedelem.md) | Belépés-védelem: próbálkozási limit, semleges hibaüzenet | ✅ |
| [2.4](stories/story-2.4-elfelejtett-jelszo.md) | Elfelejtett jelszó: tulajdonosi link + email (Resend) | 🟡 email: Resend kulcs kell |
| [2.5](stories/story-2.5-nyitott-regisztracio-vedelme.md) | Nyitott regisztráció védelme (limitek, csapda-mező, erősebb jelszó) | ✅ |
| [2.6](stories/story-2.6-privat-csatolmanyok.md) | Privát csatolmányok (képek, PDF-ek csak belépve) | 📋 |

### Epic 3 – Főzés (visszamenőleges)
| Story | Cím | Állapot |
|---|---|---|
| [3.1](stories/story-3.1-receptek.md) | Receptek: alapanyagok, skálázás, kategóriák, főzés-mód | ✅ |
| [3.2](stories/story-3.2-spajz-es-helyek.md) | Spájz, tárolási helyek, mértékegységek, lejárat | ✅ |
| [3.3](stories/story-3.3-bevasarlas-es-vasarlas.md) | Bevásárlólista, számla-beolvasás, vásárlások | ✅ |
| [3.4](stories/story-3.4-katalogus-vonalkod.md) | Termékkatalógus, vonalkód, OpenFoodFacts | ✅ |
| [3.5](stories/story-3.5-fozes-naplo-koltseg.md) | „Elkészítettem” napló és költségbecslés | ✅ |

### Epic 4 – Költségek (visszamenőleges)
| Story | Cím | Állapot |
|---|---|---|
| [4.1](stories/story-4.1-koltsegkezelo.md) | Költségkezelő: kiadás/bevétel, kategóriák, ismétlődők, áttekintés | ✅ |

### Epic 5 – Teendők és napi áttekintő (visszamenőleges)
| Story | Cím | Állapot |
|---|---|---|
| [5.1](stories/story-5.1-teendok.md) | Teendők: kanban, alteendők, ismétlődés, címkék, /ma | ✅ |

### Epic 6 – Bakancslista és utazások (visszamenőleges)
| Story | Cím | Állapot |
|---|---|---|
| [6.1](stories/story-6.1-bakancslista-utazasok.md) | Bakancslista (OCR, Meglepetés), utazások | ✅ |

### Epic 7 – Jegyzetek és napló (visszamenőleges)
| Story | Cím | Állapot |
|---|---|---|
| [7.1](stories/story-7.1-jegyzetek-naplo.md) | Jegyzetek és napló csatolmányokkal | ✅ |
