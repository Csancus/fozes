"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "./Button";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

// Submit gomb, ami a form beküldése közben pörgő ikont mutat (useFormStatus).
export function SubmitButton({
  children,
  pendingText = "Mentés…",
  leftIcon,
  variant,
  size,
  fullWidth,
  disabled,
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  leftIcon?: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={pending || disabled}
      leftIcon={
        pending ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon
      }
      className={className}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
