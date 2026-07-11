import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Play,
  Star,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdownChart } from "@/components/charts/progress-chart";
import { PostInterviewCoachingCard } from "@/components/interview/post-interview-coaching-card";
import { TopicPerformanceCard } from "@/components/interview/topic-performance-card";
import { getInterview } from "@/lib/queries";
import { computeTopicPerformance } from "@/lib/interview-topics";
import type { AnswerAnalysis, AnswerCoaching, InterviewConfig } from "@/types";
import { interviewDetailPath, interviewSessionPath } from "@/lib/routes";
import { formatDate, formatScore } from "@/lib/utils";

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await getInterview(id);

  if (!interview) notFound();

  const interviewConfig: InterviewConfig = {
    type: interview.type as InterviewConfig["type"],
    difficulty: interview.difficulty as InterviewConfig["difficulty"],
    company: interview.company ?? undefined,
    customCompany: interview.customCompany ?? undefined,
    jobRole: interview.jobRole ?? undefined,
    experienceLevel: interview.experienceLevel ?? undefined,
    techStack: interview.techStack,
    duration: interview.duration,
    questionCount: interview.questionCount,
    language: interview.language,
    mode: interview.mode as InterviewConfig["mode"],
    cameraEnabled: interview.cameraEnabled,
    hintsEnabled: interview.hintsEnabled,
  };

  const scoreData = interview.feedback
    ? [
        { name: "Communication", score: interview.feedback.communicationScore },
        { name: "Technical", score: interview.feedback.technicalScore },
        { name: "Behavior", score: interview.feedback.behaviorScore },
        { name: "Problem Solving", score: interview.feedback.problemSolvingScore },
        { name: "Confidence", score: interview.feedback.confidenceScore },
      ]
    : [];

  const topicPerformance = computeTopicPerformance(
    interview.answers.map((a) => ({
      score: a.score,
      analysis: (a.analysis as AnswerAnalysis | null) ?? null,
      question: { topic: a.question.topic, content: a.question.content },
    }))
  );

  return (
    <div className="space-y-8">
      <PageHeader title={interview.title}>
        <Button variant="outline" asChild>
          <Link href="/interviews/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        {interview.status !== "completed" && (
          <Button asChild>
            <Link href={interviewSessionPath(id)}>
              <Play className="mr-2 h-4 w-4" />
              {interview.status === "scheduled" ? "Start" : "Continue"}
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <Badge>{interview.type.replace(/_/g, " ")}</Badge>
        <Badge variant="secondary">{interview.difficulty}</Badge>
        {interview.company && <Badge variant="outline">{interview.company}</Badge>}
        <Badge
          variant={
            interview.status === "completed"
              ? "success"
              : interview.status === "in_progress"
                ? "warning"
                : "secondary"
          }
        >
          {interview.status.replace(/_/g, " ")}
        </Badge>
        {interview.isFavorite && (
          <Badge variant="outline">
            <Star className="mr-1 h-3 w-3 fill-current" />
            Favorite
          </Badge>
        )}
      </div>

      {interview.feedback && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-6xl font-bold text-primary">
                {formatScore(interview.feedback.overallScore)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Completed {interview.completedAt && formatDate(interview.completedAt)}
              </p>
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            <ScoreBreakdownChart data={scoreData} />
          </div>
        </div>
      )}

      {interview.feedback && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-600">Strong Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {interview.feedback.strongAreas.map((area) => (
                  <li key={area} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {area}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">Areas to Improve</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {interview.feedback.weakAreas.map((area) => (
                  <li key={area} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {area}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {interview.feedback && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {interview.feedback.detailedExplanation}
            </p>
            {interview.feedback.suggestions.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 font-medium">Suggestions</h4>
                <ul className="space-y-2">
                  {interview.feedback.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border/50 p-3 text-sm"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <TopicPerformanceCard rows={topicPerformance} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Answer Coaching
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {interview.answers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No answers recorded yet
            </p>
          ) : (
            interview.answers.map((answer, i) => {
              const coaching = answer.coaching as AnswerCoaching | null;
              if (coaching) {
                return (
                  <PostInterviewCoachingCard
                    key={answer.id}
                    coaching={coaching}
                    questionNumber={i + 1}
                    interviewConfig={interviewConfig}
                  />
                );
              }

              const analysis = answer.analysis as AnswerAnalysis | null;
              return (
                <div
                  key={answer.id}
                  className="space-y-3 rounded-xl border border-border/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-sm">
                      Q{i + 1}: {answer.question.content}
                    </p>
                    {answer.score != null && (
                      <Badge variant={answer.score >= 70 ? "success" : "warning"}>
                        {analysis?.scoreOutOf10 != null
                          ? `${analysis.scoreOutOf10}/10`
                          : formatScore(answer.score)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{answer.content}</p>
                  {analysis?.coachingTips && analysis.coachingTips.length > 0 && (
                    <div className="rounded-lg bg-primary/5 p-3 text-sm">
                      <p className="mb-1 font-medium text-primary">Coaching</p>
                      <ul className="space-y-1 text-muted-foreground">
                        {analysis.coachingTips.map((tip, j) => (
                          <li key={j}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {answer.betterVersion && (
                    <div className="rounded-lg bg-primary/5 p-3 text-sm">
                      <p className="mb-1 font-medium text-primary">Better Version</p>
                      {answer.betterVersion}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {interview.report && (
        <div className="flex justify-end">
          <Button asChild>
            <Link href={`/reports/${interview.report.id}`}>View Full Report</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
