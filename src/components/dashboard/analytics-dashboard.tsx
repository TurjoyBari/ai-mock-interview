"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Brain,
  Clock,
  Flame,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  FileText,
  Map as MapIcon,
  Lightbulb,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PerformanceTrends } from "@/components/dashboard/performance-trends";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createTopicPracticeInterview,
  deleteInterview,
  fetchDashboardAnalytics,
  retryInterview,
} from "@/lib/actions";
import { interviewSessionPath } from "@/lib/routes";
import { cn, formatDuration, formatScore } from "@/lib/utils";
import type {
  DashboardAnalytics,
  DashboardRange,
  DashboardTopicStat,
} from "@/types/dashboard";

interface AnalyticsDashboardProps {
  initialData: DashboardAnalytics;
  initialRange?: DashboardRange;
}

const LEVEL_COLORS: Record<DashboardTopicStat["level"], string> = {
  strong: "bg-emerald-500",
  average: "bg-amber-500",
  weak: "bg-red-500",
};

export function AnalyticsDashboard({
  initialData,
  initialRange = "all",
}: AnalyticsDashboardProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState<DashboardRange>(initialRange);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const isEmpty = data.allTimeInterviewCount === 0;

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.history;
    return data.history.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        h.typeLabel.toLowerCase().includes(q) ||
        h.techStack.some((t) => t.toLowerCase().includes(q)) ||
        h.difficulty.toLowerCase().includes(q)
    );
  }, [data.history, search]);

  const topicsByCatalog = useMemo(() => {
    const map = new Map<string, DashboardTopicStat[]>();
    for (const topic of data.topics) {
      const list = map.get(topic.catalog) ?? [];
      list.push(topic);
      map.set(topic.catalog, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data.topics]);

  const changeRange = (next: DashboardRange) => {
    if (next === range) return;
    setRange(next);
    startTransition(async () => {
      const nextData = await fetchDashboardAnalytics(next);
      setData(nextData);
    });
  };

  const refresh = async () => {
    const nextData = await fetchDashboardAnalytics(range);
    setData(nextData);
    router.refresh();
  };

  const practiceTopic = async (topic: string) => {
    setActionId(`practice:${topic}`);
    try {
      const result = await createTopicPracticeInterview(topic);
      router.push(interviewSessionPath(result.id));
    } catch (e) {
      console.error(e);
      setActionId(null);
    }
  };

  const onRetry = async (id: string) => {
    setActionId(`retry:${id}`);
    try {
      const result = await retryInterview(id);
      router.push(interviewSessionPath(result.id));
    } catch (e) {
      console.error(e);
      setActionId(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this interview and its report? This cannot be undone.")) {
      return;
    }
    setActionId(`delete:${id}`);
    try {
      await deleteInterview(id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionId(null);
    }
  };

  if (isEmpty) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Interview Analytics"
          description="Track improvement, strengths, and readiness from real practice data"
        >
          <Button asChild>
            <Link href="/interviews/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Interview
            </Link>
          </Button>
        </PageHeader>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-semibold">No interviews yet</h2>
              <p className="text-sm text-muted-foreground">
                Complete your first mock interview to unlock score trends, topic
                insights, readiness scoring, and a personalized learning roadmap.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/interviews/new">Start your first interview</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, readiness } = data;
  const progressToNext =
    readiness.nextLevelAt != null
      ? Math.min(100, (readiness.score / readiness.nextLevelAt) * 100)
      : 100;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Interview Analytics"
        description="Live insights from your completed mock interviews"
      >
        <Button asChild>
          <Link href="/interviews/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Interview
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Interviews Completed"
          value={overview.totalInterviews}
          icon={Trophy}
          subtitle="In selected range"
        />
        <StatCard
          title="Total Questions Answered"
          value={overview.totalQuestionsAnswered}
          icon={Brain}
        />
        <StatCard
          title="Average Overall Score"
          value={overview.averageOverallScore}
          icon={Target}
        />
        <StatCard
          title="Current Interview Streak"
          value={overview.practiceStreak}
          icon={Flame}
          subtitle="days in a row"
        />
        <StatCard
          title="Total Practice Time"
          value={formatDuration(overview.totalPracticeMinutes || 0)}
          icon={Clock}
        />
        <StatCard
          title="Best Score"
          value={overview.bestScore}
          icon={Award}
        />
        <StatCard
          title="Average Confidence Score"
          value={overview.averageConfidenceScore}
          icon={Sparkles}
        />
        <StatCard
          title="Average Communication Score"
          value={overview.averageCommunicationScore}
          icon={MessageSquare}
        />
      </div>

      <PerformanceTrends
        data={data.trends}
        range={range}
        onRangeChange={changeRange}
        loading={pending}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Topic Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pending ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !topicsByCatalog.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Answer questions across topics to see performance breakdowns.
              </p>
            ) : (
              topicsByCatalog.map(([catalog, topics]) => (
                <div key={catalog} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{catalog}</h3>
                    <div className="flex gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Strong
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Average
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Weak
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {topics.map((t) => (
                      <div key={t.topic} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t.topic}</span>
                          <span className="font-medium tabular-nums">
                            {formatScore(t.score)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            className={cn("h-full rounded-full", LEVEL_COLORS[t.level])}
                            initial={{ width: 0 }}
                            animate={{ width: `${t.score}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            {data.weakTopics.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No weak topics detected — keep practicing to stay sharp.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.weakTopics.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 p-3"
                  >
                    <span className="text-sm font-medium">{topic}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionId === `practice:${topic}`}
                      onClick={() => practiceTopic(topic)}
                    >
                      {actionId === `practice:${topic}` ? "Starting…" : "Practice Again"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.insights.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Complete a few more interviews to generate personalized insights.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.insights.map((insight) => (
                  <li
                    key={insight.id}
                    className={cn(
                      "rounded-xl border p-4 text-sm",
                      insight.tone === "positive" &&
                        "border-emerald-500/20 bg-emerald-500/5",
                      insight.tone === "warning" &&
                        "border-amber-500/20 bg-amber-500/5",
                      insight.tone === "neutral" && "border-border/50"
                    )}
                  >
                    {insight.text}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Interview Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-bold tabular-nums">{readiness.score}</p>
                <p className="text-sm text-muted-foreground">Readiness score</p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {readiness.level}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                {readiness.nextLevel ? (
                  <span>
                    Next: {readiness.nextLevel} ({readiness.nextLevelAt}+)
                  </span>
                ) : (
                  <span>Top level reached</span>
                )}
              </div>
              <Progress value={progressToNext} className="h-2.5" />
            </div>
            <ul className="space-y-2">
              {readiness.tips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" />
              Learning Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.roadmap.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Roadmap appears after topic scores are available from practice.
              </p>
            ) : (
              <ol className="space-y-4">
                {data.roadmap.map((week) => (
                  <li
                    key={week.week}
                    className="rounded-xl border border-border/50 p-4"
                  >
                    <p className="mb-2 text-sm font-semibold">Week {week.week}</p>
                    <ul className="space-y-1.5">
                      {week.topics.map((topic) => (
                        <li
                          key={topic}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="text-muted-foreground">{topic}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            disabled={actionId === `practice:${topic}`}
                            onClick={() => practiceTopic(topic)}
                          >
                            Practice
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.achievements.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "rounded-xl border p-3 transition-opacity",
                    badge.unlocked
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/40 opacity-55"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {badge.unlocked ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">{badge.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Interview History</CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search interviews…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No interviews match your search.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-border/50 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {item.overallScore != null && (
                        <Badge variant="secondary">
                          {formatScore(item.overallScore)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.date} · {item.typeLabel} · {item.difficulty}
                      {item.techStack.length > 0
                        ? ` · ${item.techStack.slice(0, 3).join(", ")}`
                        : ""}{" "}
                      · {item.answersCount}/{item.questionCount} questions ·{" "}
                      {formatDuration(item.duration)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.reportId ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/reports/${item.reportId}`}>
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          View Report
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/interviews/${item.id}`}>
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionId === `retry:${item.id}`}
                      onClick={() => onRetry(item.id)}
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      {actionId === `retry:${item.id}` ? "Creating…" : "Retry"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actionId === `delete:${item.id}`}
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
