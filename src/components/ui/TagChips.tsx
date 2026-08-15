import { Tag } from "lucide-react";
import { cn } from "@/lib/cn";

// Címke-chipek. Az öröklött (listáról jövő) címkék szaggatott kerettel,
// hogy látszódjon: nem a tételen vannak, hanem felülről kapja.
export function TagChips({
  tags = [],
  inherited = [],
  size = "sm",
  className,
}: {
  tags?: string[];
  inherited?: string[];
  size?: "sm" | "md";
  className?: string;
}) {
  const own = tags.filter(Boolean);
  const extra = inherited.filter((t) => t && !own.includes(t));
  if (own.length === 0 && extra.length === 0) return null;

  const base =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 gap-0.5"
      : "text-[12px] px-2 py-0.5 gap-1";
  const icon = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {own.map((t) => (
        <span
          key={`o-${t}`}
          className={cn(
            "inline-flex items-center rounded-full bg-[var(--color-muted)] font-medium text-[var(--color-muted-foreground)]",
            base
          )}
        >
          <Tag className={icon} />
          {t}
        </span>
      ))}
      {extra.map((t) => (
        <span
          key={`i-${t}`}
          title="A listától örökölt címke"
          className={cn(
            "inline-flex items-center rounded-full border border-dashed border-[var(--color-border)] font-medium text-[var(--color-muted-foreground)]",
            base
          )}
        >
          <Tag className={icon} />
          {t}
        </span>
      ))}
    </span>
  );
}
