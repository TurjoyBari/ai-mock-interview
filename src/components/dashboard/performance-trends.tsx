"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardRange, DashboardTrendPoint } from "@/types/dashboard";

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

const SERIES = [
  { key: "overall", label: "Overall", color: "hsl(var(--primary))" },
  { key: "confidence", label: "Confidence", color: "#0d9488" },
  { key: "communication", label: "Communication", color: "#2563eb" },
  { key: "technical", label: "Technical", color: "#ca8a04" },
  { key: "behavioral", label: "Behavioral", color: "#dc2626" },
] as const;

interface PerformanceTrendsProps {
  data: DashboardTrendPoint[];
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
  loading?: boolean;
}

export function PerformanceTrends({
  data,
  range,
  onRangeChange,
  loading,
}: PerformanceTrendsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Performance Trends</CardTitle>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onRangeChange(r.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                range === r.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            Updating trends…
          </div>
        ) : !data.length ? (
          <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <p>No completed interviews in this range.</p>
            <p className="text-xs">Finish a mock interview to unlock score trends.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient
                    key={s.key}
                    id={`grad-${s.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
              />
              <Legend />
              {SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  fill={`url(#grad-${s.key})`}
                  strokeWidth={2}
                  animationDuration={600}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
