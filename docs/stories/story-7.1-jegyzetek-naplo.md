# Story 7.1: Jegyzetek és napló

**Epic:** 7 (Jegyzetek és napló) · **Állapot:** kész (2026-07-27 – 2026-08) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** felhasználó **szeretnék** jegyzeteket és naplót vezetni csatolmányokkal.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Jegyzetek és naplóbejegyzések rich-text szöveggel és csatolmányokkal.

## Megvalósítás

- `src/app/jegyzetek/*`, `src/app/naplo/*`

## Tesztek

Automata teszt még nincs: a logika főleg UI és Redis-olvasás/írás (`src/lib/data.ts`). Ha a modul változik, a változáshoz teszt jár.

## Megjegyzések

- A csatolmányok jelenleg publikus URL-en érhetők el – Story 2.6.
