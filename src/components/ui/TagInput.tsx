"use client";

import { useMemo, useRef, useState } from "react";
import { Tag, X } from "lucide-react";

// Címke-mező chipekkel és javaslatokkal a már használt címkékből.
// A form felé egy rejtett, vesszővel összefűzött input megy (name).
export function TagInput({
  name,
  initial = [],
  suggestions = [],
  placeholder = "címke…",
}: {
  name: string;
  initial?: string[];
  suggestions?: string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const has = (v: string) => tags.some((t) => t.toLowerCase() === v.trim().toLowerCase());

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    return suggestions
      .filter((s) => !has(s))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, suggestions, tags]);

  function add(raw: string) {
    const v = raw.trim();
    if (!v || has(v)) {
      setText("");
      return;
    }
    // Ha már létezik ilyen címke más írásmóddal, azt az írásmódot használjuk.
    const known = suggestions.find((s) => s.toLowerCase() === v.toLowerCase());
    setTags((cur) => [...cur, known ?? v]);
    setText("");
  }

  return (
    <div>
      <input type="hidden" name={name} value={tags.join(", ")} />
      <div
        onClick={() => ref.current?.focus()}
        className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[var(--color-ring)] transition"
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-muted-foreground)]"
          >
            <Tag className="w-3 h-3" />
            {t}
            <button
              type="button"
              aria-label={`${t} eltávolítása`}
              onClick={(e) => {
                e.stopPropagation();
                setTags((cur) => cur.filter((x) => x !== t));
              }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--color-foreground)]/10"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={ref}
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) {
              v.split(",").forEach((part) => add(part));
              return;
            }
            setText(v);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text) {
              setTags((cur) => cur.slice(0, -1));
            }
          }}
          aria-label="Címke hozzáadása"
          placeholder={tags.length === 0 ? placeholder : "továbbiak…"}
          className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none"
        />
      </div>

      {focused && matches.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                add(s);
                ref.current?.focus();
              }}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--color-border)] px-2 py-0.5 text-[12px] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            >
              <Tag className="w-3 h-3" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
