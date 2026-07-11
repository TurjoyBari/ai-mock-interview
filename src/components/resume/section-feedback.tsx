"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeSectionFeedback } from "@/types";

const STATUS_VARIANT: Record<
  ResumeSectionFeedback["status"],
  "success" | "secondary" | "warning" | "destructive"
> = {
  strong: "success",
  adequate: "secondary",
  weak: "warning",
  missing: "destructive",
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function SectionFeedbackCard({
  title,
  feedback,
}: {
  title: string;
  feedback?: ResumeSectionFeedback;
}) {
  if (!feedback) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={STATUS_VARIANT[feedback.status]}>
            {feedback.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <ListBlock title="Strengths" items={feedback.strengths} />
        <ListBlock title="Weaknesses" items={feedback.weaknesses} />
        <ListBlock title="Missing" items={feedback.missing} />
        <ListBlock title="Suggested improvements" items={feedback.improvements} />
      </CardContent>
    </Card>
  );
}
