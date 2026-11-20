"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_APPEARANCE,
  readAppearance,
  subscribeAppearance,
  type Appearance,
} from "@/lib/appearance";

/** A megjelenés-beállítások; minden kapcsoló-példány ugyanazt látja. */
export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribeAppearance, readAppearance, () => DEFAULT_APPEARANCE);
}
