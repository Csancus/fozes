"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * A modálokat a <body>-ba teszi (Story 8.4). Csempe stílusban a kártyák `backdrop-filter`-t
 * kapnak, ami a bennük lévő `position: fixed` elemeket a kártyához köti – mobilon a modál így
 * a kártya közepére kerülne, a képernyőn kívülre, a fejléc és az alsó menü alá.
 */
export function BodyPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  if (!mounted) return null;
  return createPortal(children, document.body);
}
