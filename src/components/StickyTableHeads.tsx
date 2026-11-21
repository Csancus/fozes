"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Story 10.8 – rögzített táblázat-fejléc. A `.sticky-table` dobozok vízszintesen
 * görgetnek, így bennük a CSS `position: sticky` az oldal görgetésére nem működik.
 * Ehelyett a fejléc-cellákat annyival toljuk lejjebb (`--thead-y`), amennyivel a doboz
 * teteje az oldal (szintén ragadós) fejléce alá csúszott – a táblázat aljáig.
 * Oldalváltáskor nullázzuk.
 */
export function StickyTableHeads() {
  const pathname = usePathname();
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const pageHeader = document.querySelector<HTMLElement>("header.sticky");
      const top = pageHeader ? Math.max(0, pageHeader.getBoundingClientRect().bottom) : 0;
      // Egy oldalon jellemzően egy ilyen táblázat van; az számít, amelyiknek a teteje az oldal
      // fejléce alá csúszott. A változót a <html>-en tároljuk (azon nincs hydration-ellenőrzés),
      // így a React által renderelt elemek attribútumaihoz nem nyúlunk.
      let y = 0;
      document.querySelectorAll<HTMLElement>(".sticky-table").forEach((box) => {
        const thead = box.querySelector("thead");
        if (!thead) return;
        const r = box.getBoundingClientRect();
        const h = thead.getBoundingClientRect().height;
        if (r.top < top && r.bottom > top) y = Math.max(0, Math.min(top - r.top, r.height - h * 2));
      });
      document.documentElement.style.setProperty("--thead-y", `${Math.round(y)}px`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // új sor, szűrés, oszlop-összecsukás → más a magasság
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.style.removeProperty("--thead-y");
    };
  }, [pathname]);
  return null;
}
