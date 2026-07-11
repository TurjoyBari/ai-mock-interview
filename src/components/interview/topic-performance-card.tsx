import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopicPerformanceRow } from "@/lib/interview-topics";

interface TopicPerformanceCardProps {
  rows: TopicPerformanceRow[];
}

export function TopicPerformanceCard({ rows }: TopicPerformanceCardProps) {
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Average score by interview topic — use this to focus your next practice
          session.
        </p>
        <div className="space-y-2">
          {rows.map((row) => {
            const strong = row.scoreOutOf10 >= 7;
            const weak = row.scoreOutOf10 < 5;
            return (
              <div
                key={row.topic}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{row.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.answeredCount} answered
                  </p>
                </div>
                <Badge
                  variant={strong ? "default" : weak ? "destructive" : "secondary"}
                  className="shrink-0 text-sm px-3"
                >
                  {row.scoreOutOf10}/10
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
