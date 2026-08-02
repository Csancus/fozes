"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Link2Off,
  Eraser,
} from "lucide-react";

type Cmd = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  run: (exec: (c: string, v?: string) => void) => void;
  state?: string; // queryCommandState kulcs az aktív állapothoz
  block?: string; // formatBlock érték az aktív állapothoz
};

const COMMANDS: Cmd[][] = [
  [
    {
      key: "bold",
      label: "Félkövér",
      icon: Bold,
      run: (e) => e("bold"),
      state: "bold",
    },
    {
      key: "italic",
      label: "Dőlt",
      icon: Italic,
      run: (e) => e("italic"),
      state: "italic",
    },
    {
      key: "underline",
      label: "Aláhúzott",
      icon: Underline,
      run: (e) => e("underline"),
      state: "underline",
    },
    {
      key: "strike",
      label: "Áthúzott",
      icon: Strikethrough,
      run: (e) => e("strikeThrough"),
      state: "strikeThrough",
    },
  ],
  [
    {
      key: "h2",
      label: "Címsor",
      icon: Heading2,
      run: (e) => e("formatBlock", "<h2>"),
      block: "h2",
    },
    {
      key: "h3",
      label: "Alcím",
      icon: Heading3,
      run: (e) => e("formatBlock", "<h3>"),
      block: "h3",
    },
    {
      key: "quote",
      label: "Idézet",
      icon: Quote,
      run: (e) => e("formatBlock", "<blockquote>"),
      block: "blockquote",
    },
  ],
  [
    {
      key: "ul",
      label: "Felsorolás",
      icon: List,
      run: (e) => e("insertUnorderedList"),
      state: "insertUnorderedList",
    },
    {
      key: "ol",
      label: "Számozott lista",
      icon: ListOrdered,
      run: (e) => e("insertOrderedList"),
      state: "insertOrderedList",
    },
  ],
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Írj ide bármit…",
  minHeight = 160,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef(value);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [empty, setEmpty] = useState(
    () => !initial.current.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
  );

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML === "<br>" ? "" : el.innerHTML;
    setEmpty(!html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim());
    onChange(html);
  }, [onChange]);

  const refreshActive = useCallback(() => {
    const el = ref.current;
    if (!el || typeof document === "undefined") return;
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
    const next: Record<string, boolean> = {};
    let block = "";
    try {
      block = String(document.queryCommandValue("formatBlock") ?? "").toLowerCase();
    } catch {
      block = "";
    }
    for (const group of COMMANDS) {
      for (const c of group) {
        if (c.state) {
          try {
            next[c.key] = document.queryCommandState(c.state);
          } catch {
            next[c.key] = false;
          }
        } else if (c.block) {
          next[c.key] = block === c.block;
        }
      }
    }
    setActive(next);
  }, []);

  // A kezdeti tartalmat CSAK mountkor írjuk be. (dangerouslySetInnerHTML-lel a
  // React minden újrarendereléskor visszaírná a kezdeti HTML-t → törölné a gépelést.)
  useEffect(() => {
    if (ref.current && initial.current) ref.current.innerHTML = initial.current;
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  function exec(command: string, val?: string) {
    ref.current?.focus();
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* nem támogatott — nem baj */
    }
    document.execCommand(command, false, val);
    emit();
    refreshActive();
  }

  function toggleBlock(cmd: Cmd) {
    // Ha már ilyen blokk, vissza sima bekezdésre.
    if (cmd.block && active[cmd.key]) exec("formatBlock", "<p>");
    else cmd.run(exec);
  }

  function addLink() {
    const sel = document.getSelection();
    const selected = sel ? sel.toString() : "";
    const url = window.prompt("Link címe:", "https://");
    if (!url) return;
    const href = /^(https?:|mailto:)/i.test(url.trim())
      ? url.trim()
      : `https://${url.trim().replace(/^\/+/, "")}`;
    if (!selected) {
      exec("insertHTML", `<a href="${href}">${href}</a>`);
    } else {
      exec("createLink", href);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Formázás nélküli beillesztés — nincs beragadt Word/webes HTML szemét.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emit();
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-ring)] transition",
        className
      )}
    >
      {/* Eszköztár */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
        {COMMANDS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && (
              <span className="mx-1 h-5 w-px bg-[var(--color-border)]" aria-hidden />
            )}
            {group.map((c) => (
              <ToolButton
                key={c.key}
                label={c.label}
                icon={c.icon}
                active={!!active[c.key]}
                onClick={() => (c.block ? toggleBlock(c) : c.run(exec))}
              />
            ))}
          </div>
        ))}
        <span className="mx-1 h-5 w-px bg-[var(--color-border)]" aria-hidden />
        <ToolButton label="Link" icon={Link2} onClick={addLink} />
        <ToolButton
          label="Link eltávolítása"
          icon={Link2Off}
          onClick={() => exec("unlink")}
        />
        <ToolButton
          label="Formázás törlése"
          icon={Eraser}
          onClick={() => {
            exec("removeFormat");
            exec("formatBlock", "<p>");
          }}
        />
      </div>

      {/* Szerkesztő */}
      <div className="relative">
        {empty && (
          <span className="pointer-events-none absolute left-3.5 top-3 text-[15px] text-[var(--color-muted-foreground)]">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
          onKeyUp={refreshActive}
          onMouseUp={refreshActive}
          className="rich-text px-3.5 py-3 text-[15px] leading-relaxed outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

function ToolButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={!!active}
      // A kijelölés ne vesszen el a gomb lenyomásakor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-lg transition",
        active
          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
