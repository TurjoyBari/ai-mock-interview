"use client";

import { Keyboard, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewMode } from "@/types";

interface InterviewModeSwitchProps {
  mode: InterviewMode;
  onChange: (mode: InterviewMode) => void;
  disabled?: boolean;
  className?: string;
}

export function InterviewModeSwitch({
  mode,
  onChange,
  disabled,
  className,
}: InterviewModeSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Interview mode"
      className={cn(
        "inline-flex items-center rounded-xl border border-border/60 bg-muted/40 p-1",
        className
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === "voice"}
        onClick={() => onChange("voice")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
          mode === "voice"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <Mic className="h-3.5 w-3.5" />
        Voice Mode
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === "text"}
        onClick={() => onChange("text")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
          mode === "text"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <Keyboard className="h-3.5 w-3.5" />
        Text Mode
      </button>
    </div>
  );
}
