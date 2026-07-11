import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBreakdownChart } from "@/components/charts/progress-chart";
import { PostInterviewCoachingCard } from "@/components/interview/post-interview-coaching-card";
import { TopicPerformanceCard } from "@/components/interview/topic-performance-card";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { computeTopicPerformance } from "@/lib/interview-topics";
import type { AnswerAnalysis, AnswerCoaching, InterviewConfig } from "@/types";
import { formatDate, formatScore } from "@/lib/utils";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireDbUser();
  const { id } = await params;

  const report = await prisma.report.findFirst({
    where: { id, interview: { userId: user.id } },
    include: {
      interview: {
        include: { feedback: true, answers: { include: { question: true } } },
      },
    },
  });

  if (!report) notFound();

  const content = report.content as {
    feedback?: {
      overallScore: number;
      communicationScore: number;
      technicalScore: number;
      behaviorScore: number;
      problemSolvingScore: number;
      confidenceScore: number;
      weakAreas: string[];
      strongAreas: string[];
      suggestions: string[];
      detailedExplanation: string;
      strongTopics?: string[];
      weakTopics?: string[];
      mistakesMade?: string[];
      recommendedStudyTopics?: string[];
      improvementRoadmap?: {
        topic: string;
        priority: string;
        actions: string[];
      }[];
      recurringPatterns?: string[];
      questionsAnsweredWell?: { question: string; score: number }[];
      questionsAnsweredPoorly?: { question: string; score: number; issue?: string }[];
    };
    weakTopics?: string[];
    mistakesMade?: string[];
    recommendedStudyTopics?: string[];
    improvementRoadmap?: {
      topic: string;
      priority: string;
      actions: string[];
    }[];
    recurringPatterns?: string[];
    transcript?: {
      question: string;
      answer: string;
      score?: number;
      coaching?: AnswerCoaching;
    }[];
    coachings?: AnswerCoaching[];
    topicPerformance?: {
      topic: string;
      averageScore: number;
      scoreOutOf10: number;
      questionCount: number;
      answeredCount: number;
    }[];
  };

  const feedback = (content.feedback ?? report.interview.feedback) as typeof content.feedback | null;
  const weakTopics = content.weakTopics ?? feedback?.weakTopics ?? feedback?.weakAreas ?? [];
  const studyTopics = content.recommendedStudyTopics ?? feedback?.recommendedStudyTopics ?? [];
  const roadmap = content.improvementRoadmap ?? feedback?.improvementRoadmap ?? [];
  const mistakes = content.mistakesMade ?? feedback?.mistakesMade ?? [];
  const patterns = content.recurringPatterns ?? feedback?.recurringPatterns ?? [];
  const topicPerformance =
    content.topicPerformance ??
    computeTopicPerformance(
      report.interview.answers.map((a) => ({
        score: a.score,
        analysis: (a.analysis as AnswerAnalysis | null) ?? null,
        question: { topic: a.question.topic, content: a.question.content },
      }))
    );
  const coachingsFromReport = content.coachings?.length
    ? content.coachings
    : content.transcript
        ?.map((t) => t.coaching)
        .filter((c): c is AnswerCoaching => c != null);
  const coachings =
    coachingsFromReport && coachingsFromReport.length > 0
      ? coachingsFromReport
      : report.interview.answers
          .map((a) => a.coaching as AnswerCoaching | null)
          .filter((c): c is AnswerCoaching => c != null);

  const interviewConfig: InterviewConfig = {
    type: report.interview.type as InterviewConfig["type"],
    difficulty: report.interview.difficulty as InterviewConfig["difficulty"],
    company: report.interview.company ?? undefined,
    customCompany: report.interview.customCompany ?? undefined,
    jobRole: report.interview.jobRole ?? undefined,
    experienceLevel: report.interview.experienceLevel ?? undefined,
    techStack: report.interview.techStack,
    duration: report.interview.duration,
    questionCount: report.interview.questionCount,
    language: report.interview.language,
    mode: report.interview.mode as InterviewConfig["mode"],
    cameraEnabled: report.interview.cameraEnabled,
    hintsEnabled: report.interview.hintsEnabled,
  };

  const scoreData = feedback
    ? [
        { name: "Communication", score: feedback.communicationScore },
        { name: "Technical", score: feedback.technicalScore },
        { name: "Behavior", score: feedback.behaviorScore },
        { name: "Problem Solving", score: feedback.problemSolvingScore },
        { name: "Confidence", score: feedback.confidenceScore },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader title={report.title}>
        <Button variant="outline" asChild>
          <Link href="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <Badge>{report.interview.type.replace(/_/g, " ")}</Badge>
        <Badge variant="secondary">{report.interview.difficulty}</Badge>
        {report.interview.company && (
          <Badge variant="outline">{report.interview.company}</Badge>
        )}
      </div>

      {feedback && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Overall Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-6xl font-bold text-primary">
                  {formatScore(feedback.overallScore)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDate(report.createdAt)}
                </p>
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <ScoreBreakdownChart data={scoreData} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {feedback.detailedExplanation}
              </p>
            </CardContent>
          </Card>

          {(weakTopics.length > 0 || studyTopics.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {weakTopics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-amber-600">Weak Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {weakTopics.map((t) => (
                        <li key={t} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {studyTopics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Recommended Study</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {studyTopics.map((t) => (
                        <li key={t} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {mistakes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mistakes Made</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {mistakes.map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {patterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recurring Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {patterns.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <TopicPerformanceCard rows={topicPerformance} />

          {roadmap.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Improvement Roadmap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {roadmap.map((item) => (
                  <div
                    key={item.topic}
                    className="rounded-lg border border-border/50 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <p className="font-medium">{item.topic}</p>
                      <Badge variant="outline">{item.priority}</Badge>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {item.actions.map((action, i) => (
                        <li key={i}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personalized Answer Coaching</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {coachings.length > 0 ? (
            coachings.map((coaching, i) => (
              <PostInterviewCoachingCard
                key={i}
                coaching={coaching}
                questionNumber={i + 1}
                interviewConfig={interviewConfig}
              />
            ))
          ) : (
            report.interview.answers.map((answer, i) => (
              <div
                key={answer.id}
                className="rounded-xl border border-border/50 p-4 space-y-2"
              >
                <div className="flex justify-between">
                  <p className="font-medium text-sm">
                    Q{i + 1}: {answer.question.content}
                  </p>
                  {answer.score != null && (
                    <Badge variant="secondary">{formatScore(answer.score)}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{answer.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
