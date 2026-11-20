#!/usr/bin/env bash
# Story 10.1 – mérés-futtató: OCR_* változókat ad tovább a bench-nek, és csak az összesítőt írja ki.
# Példa: bash scripts/ocr/sweep.sh OCR_STAGE=baseline OCR_JITTER=0.9,1,1.1
out="${TMPDIR:-/tmp}/ocr-sweep-$$.json"
env "$@" OCR_OUT="$out" npx vitest run --config scripts/ocr/vitest.ocr.config.mts >/dev/null 2>&1
node -e "
const r=require(process.argv[1]);
console.log(process.argv.slice(2).join(' ')||'(alap)', JSON.stringify(r.summary));
const by={};for(const x of r.rows){(by[x['kép']]??=[]).push(x)}
for(const [k,v] of Object.entries(by))console.log('   '+k.padEnd(22)+v.map(x=>x.karakter+' '+(x['tétel']??x['kulcsszó']??([x['cím'],x.hely,x.link,x['típus']].filter(y=>y!=='ok').join('|')||'ok'))+(x.menet>1?'*':'')).join('  '));
" "$out" "$@"
rm -f "$out"
