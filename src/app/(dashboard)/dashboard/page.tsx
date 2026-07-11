import Link from "next/link";
import {
  Trophy,
  MessageSquare,
  Code,
  Users,
  Flame,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressChart } from "@/components/charts/progress-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/lib/queries";
import { formatRelativeTime, formatScore } from "@/lib/utils";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Track your interview preparation progress"
      >
        <Button asChild>
          <Link href="/interviews/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Interview
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Average Score"
          value={stats.averageScore}
          icon={Trophy}
          subtitle={`${stats.totalInterviews} interviews completed`}
        />
        <StatCard
          title="Communication"
          value={stats.communicationScore}
          icon={MessageSquare}
        />
        <StatCard
          title="Technical"
          value={stats.technicalScore}
          icon={Code}
        />
        <StatCard
          title="Behavioral"
          value={stats.behavioralScore}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressChart data={stats.progressData} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Practice Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold">{stats.practiceStreak}</p>
              <p className="text-sm text-muted-foreground">days in a row</p>
            </div>
            {stats.weakTopics.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Weak Topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.weakTopics.map((topic) => (
                    <Badge key={topic} variant="warning">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {stats.strongTopics.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Strong Topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.strongTopics.map((topic) => (
                    <Badge key={topic} variant="success">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Interviews</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/interviews/history">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentInterviews.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-muted-foreground">No interviews yet</p>
                <Button className="mt-4" asChild>
                  <Link href="/interviews/new">Start your first interview</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentInterviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/interviews/${interview.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-colors hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{interview.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(interview.date)}
                      </p>
                    </div>
                    {interview.score != null && (
                      <Badge variant="secondary">
                        {formatScore(interview.score)}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentFeedback.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Complete an interview to receive AI feedback
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.recentFeedback.map((feedback, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-xl border border-border/50 p-4 text-sm"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    {feedback}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
