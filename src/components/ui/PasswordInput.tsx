"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)] pointer-events-none" />
      <Input {...props} type={show ? "text" : "password"} className={"pl-10 pr-11 " + (className ?? "")} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
        aria-pressed={show}
        className="touch-hit absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
