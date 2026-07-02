import type { Unit } from "./types";

export const UNITS: Unit[] = ["db", "g", "dkg", "kg", "ml", "dl", "l", "csomag", "csipet", "ek", "kk"];

const TO_BASE: Record<Unit, { base: "g" | "ml" | "db" | "other"; factor: number }> = {
  g: { base: "g", factor: 1 },
  dkg: { base: "g", factor: 10 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  dl: { base: "ml", factor: 100 },
  l: { base: "ml", factor: 1000 },
  db: { base: "db", factor: 1 },
  csomag: { base: "other", factor: 1 },
  csipet: { base: "other", factor: 1 },
  ek: { base: "other", factor: 1 },
  kk: { base: "other", factor: 1 },
};

export function toBase(qty: number, unit: Unit) {
  const t = TO_BASE[unit];
  return { base: t.base, value: qty * t.factor };
}

export function canCompare(a: Unit, b: Unit) {
  return TO_BASE[a].base === TO_BASE[b].base && TO_BASE[a].base !== "other";
}

export function fromBase(value: number, unit: Unit) {
  return value / TO_BASE[unit].factor;
}

export function fmt(qty: number, unit: Unit): string {
  const q = Math.round(qty * 100) / 100;
  return `${q} ${unit}`;
}
