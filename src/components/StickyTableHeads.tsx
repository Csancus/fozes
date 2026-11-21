"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Story 10.8 – rögzített táblázat-fejléc. A `.sticky-table` dobozok vízszintesen
 * görgetnek, így bennük a CSS `position: sticky` az oldal görgetésére nem működik.
 *
 * Megoldás: amikor a táblázat feje az oldal (ragadós) fejléce alá csúszik, egy
 * `position: fixed` másolatot mutatunk közvetlenül az oldal fejléce alatt. Függőleges
 * görgetéskor ez nem mozog (nincs görgetésenkénti JS-tologatás → nem szaggat); csak a
 * megjelenése/eltűnése és a vízszintes görgetés követése JS. A másolat gombjai az
 * eredeti fejléc gombjait nyomják meg (oszlop-összecsukás).
 */
type Entry = { box: HTMLElement; clone: HTMLDivElement; sig: string; onScroll: () => void };

export function StickyTableHeads() {
  const pathname = usePathname();
  useEffect(() => {
    const entries = new Map<HTMLElement, Entry>();
    let raf = 0;

    const create = (box: HTMLElement): Entry => {
      const clone = document.createElement("div");
      clone.className = "sticky-table-clone";
      clone.setAttribute("aria-hidden", "true");
      clone.style.display = "none";
      clone.addEventListener("click", (e) => {
        const btn = (e.target as Element).closest("button");
        if (!btn) return;
        const idx = Array.from(clone.querySelectorAll("button")).indexOf(btn);
        box.querySelectorAll<HTMLButtonElement>("thead button")[idx]?.click();
      });
      document.body.appendChild(clone);
      const onScroll = () => {
        clone.scrollLeft = box.scrollLeft;
      };
      box.addEventListener("scroll", onScroll, { passive: true });
      return { box, clone, sig: "", onScroll };
    };

    const destroy = (en: Entry) => {
      en.box.removeEventListener("scroll", en.onScroll);
      en.clone.remove();
      entries.delete(en.box);
    };

    const rebuild = (en: Entry, table: HTMLTableElement, thead: HTMLTableSectionElement) => {
      const t = document.createElement("table");
      t.className = table.className;
      t.style.width = `${table.getBoundingClientRect().width}px`;
      t.style.tableLayout = "fixed";
      const copy = thead.cloneNode(true) as HTMLTableSectionElement;
      const src = thead.querySelectorAll("th");
      copy.querySelectorAll("th").forEach((th, i) => {
        const w = src[i]?.getBoundingClientRect().width ?? 0;
        th.style.width = `${w}px`;
        th.style.minWidth = `${w}px`;
        th.style.maxWidth = `${w}px`;
      });
      t.appendChild(copy);
      en.clone.replaceChildren(t);
    };

    const update = () => {
      raf = 0;
      const pageHeader = document.querySelector<HTMLElement>("header.sticky");
      const top = pageHeader ? Math.max(0, pageHeader.getBoundingClientRect().bottom) : 0;

      const boxes = new Set(document.querySelectorAll<HTMLElement>(".sticky-table"));
      for (const en of [...entries.values()]) if (!boxes.has(en.box)) destroy(en);

      boxes.forEach((box) => {
        const table = box.querySelector("table");
        const thead = table?.querySelector("thead");
        if (!table || !thead) return;
        const en = entries.get(box) ?? create(box);
        entries.set(box, en);
        const r = box.getBoundingClientRect();
        const headH = thead.getBoundingClientRect().height;
        const show = r.top + 4 < top && r.bottom > top + headH * 2;
        if (!show) {
          en.clone.style.display = "none";
          return;
        }
        const sig = `${thead.innerHTML}|${Math.round(table.getBoundingClientRect().width)}|${Math.round(r.width)}`;
        if (sig !== en.sig) {
          rebuild(en, table, thead);
          en.sig = sig;
        }
        const cs = getComputedStyle(box);
        Object.assign(en.clone.style, {
          display: "block",
          top: `${top}px`,
          left: `${r.left}px`,
          width: `${r.width}px`,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
        });
        en.clone.scrollLeft = box.scrollLeft;
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // új sor, szűrés, oszlop-összecsukás → más a fejléc / a magasság
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      for (const en of [...entries.values()]) destroy(en);
    };
  }, [pathname]);
  return null;
}
