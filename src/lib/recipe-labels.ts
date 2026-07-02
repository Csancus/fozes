import type { RecipeCost, RecipeDifficulty } from "./types";

export const COST_OPTIONS = [
  { value: "cheap", label: "Olcsó" },
  { value: "average", label: "Átlagos" },
  { value: "expensive", label: "Drága" },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Könnyű" },
  { value: "medium", label: "Közepes" },
  { value: "hard", label: "Nehéz" },
] as const;

export const COST_LABEL: Record<RecipeCost, string> = {
  cheap: "Olcsó",
  average: "Átlagos",
  expensive: "Drága",
};

export const DIFFICULTY_LABEL: Record<RecipeDifficulty, string> = {
  easy: "Könnyű",
  medium: "Közepes",
  hard: "Nehéz",
};

export const COST_VALUES: RecipeCost[] = ["cheap", "average", "expensive"];
export const DIFFICULTY_VALUES: RecipeDifficulty[] = ["easy", "medium", "hard"];

export function isRecipeCost(v: string): v is RecipeCost {
  return (COST_VALUES as string[]).includes(v);
}

export function isRecipeDifficulty(v: string): v is RecipeDifficulty {
  return (DIFFICULTY_VALUES as string[]).includes(v);
}
