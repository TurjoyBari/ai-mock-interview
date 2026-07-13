import type { ReactNode } from "react";

export function highlightText(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, index) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-sm bg-primary/20 px-0.5 text-foreground"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}
