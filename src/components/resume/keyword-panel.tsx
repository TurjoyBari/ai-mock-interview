"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeAnalysis } from "@/types";

function KeywordGroup({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "success" | "warning" | "outline" | "secondary";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None detected</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge key={item} variant={variant}>
                {item}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KeywordAnalysisPanel({
  analysis,
}: {
  analysis: ResumeAnalysis;
}) {
  const keywords = analysis.keywordAnalysis;
  if (!keywords) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <KeywordGroup title="Strong keywords" items={keywords.strong} variant="success" />
      <KeywordGroup title="Weak keywords" items={keywords.weak} variant="warning" />
      <KeywordGroup title="Missing keywords" items={keywords.missing} variant="outline" />
      <KeywordGroup
        title="Suggested keywords"
        items={keywords.suggested}
        variant="secondary"
      />
    </div>
  );
}
