import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import type { DashboardStats } from "@/types";
import type { DashboardAnalytics, DashboardRange } from "@/types/dashboard";
import {
  buildDashboardAnalytics,
  type AnalyticsInterview,
} from "@/lib/dashboard/analytics";

export async function getDashboardAnalytics(
  range: DashboardRange = "all"
): Promise<DashboardAnalytics> {
  const user = await requireDbUser();

  const completed = await prisma.interview.findMany({
    where: { userId: user.id, status: "completed" },
    orderBy: { completedAt: "asc" },
    include: {
      feedback: {
        select: {
          overallScore: true,
          communicationScore: true,
          confidenceScore: true,
          technicalScore: true,
          behaviorScore: true,
          weakTopics: true,
          strongTopics: true,
          weakAreas: true,
          strongAreas: true,
          suggestions: true,
        },
      },
      report: { select: { id: true } },
      answers: {
        select: {
          score: true,
          analysis: true,
          question: { select: { topic: true, content: true } },
        },
      },
      _count: { select: { answers: true, questions: true } },
    },
  });

  const mapped: AnalyticsInterview[] = completed.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    difficulty: i.difficulty,
    techStack: i.techStack,
    duration: i.duration,
    questionCount: i.questionCount,
    status: i.status,
    overallScore: i.overallScore,
    communicationScore: i.communicationScore,
    technicalScore: i.technicalScore,
    behavioralScore: i.behavioralScore,
    startedAt: i.startedAt,
    completedAt: i.completedAt,
    createdAt: i.createdAt,
    feedback: i.feedback,
    report: i.report,
    answers: i.answers.map((a) => ({
      score: a.score,
      analysis: a.analysis as AnalyticsInterview["answers"][number]["analysis"],
      question: a.question,
    })),
    _count: i._count,
  }));

  return buildDashboardAnalytics(mapped, range);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const analytics = await getDashboardAnalytics("all");
  const user = await requireDbUser();

  const [recentInterviews, scheduledInterviews, latestFeedback] =
    await Promise.all([
      prisma.interview.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          overallScore: true,
          createdAt: true,
          type: true,
        },
      }),
      prisma.interview.findMany({
        where: { userId: user.id, status: "scheduled" },
        orderBy: { createdAt: "asc" },
        take: 3,
        select: { id: true, title: true, createdAt: true },
      }),
      prisma.feedback.findMany({
        where: { interview: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { suggestions: true },
      }),
    ]);

  return {
    upcomingPractice: scheduledInterviews.map((i) => ({
      id: i.id,
      title: i.title,
      scheduledAt: i.createdAt,
    })),
    recentInterviews: recentInterviews.map((i) => ({
      id: i.id,
      title: i.title,
      score: i.overallScore,
      date: i.createdAt,
      type: i.type,
    })),
    averageScore: analytics.overview.averageOverallScore,
    communicationScore: analytics.overview.averageCommunicationScore,
    technicalScore: analytics.overview.averageTechnicalScore,
    behavioralScore: analytics.overview.averageBehavioralScore,
    weakTopics: analytics.weakTopics.slice(0, 5),
    strongTopics: analytics.strongTopics.slice(0, 5),
    recentFeedback: latestFeedback.flatMap((f) => f.suggestions).slice(0, 5),
    progressData: analytics.trends.map((t) => ({
      date: t.date,
      score: t.overall,
    })),
    practiceStreak: analytics.overview.practiceStreak,
    totalInterviews: analytics.overview.totalInterviews,
  };
}

export async function getInterviewHistory() {
  const user = await requireDbUser();

  return prisma.interview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      feedback: { select: { overallScore: true } },
      _count: { select: { questions: true, answers: true } },
    },
  });
}

export async function getInterview(id: string) {
  const user = await requireDbUser();

  return prisma.interview.findFirst({
    where: { id, userId: user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      answers: { include: { question: true } },
      messages: { orderBy: { createdAt: "asc" } },
      feedback: true,
      report: true,
      codingSessions: true,
    },
  });
}

export async function getReports() {
  const user = await requireDbUser();

  return prisma.report.findMany({
    where: { interview: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      interview: {
        select: {
          title: true,
          type: true,
          company: true,
          overallScore: true,
          completedAt: true,
        },
      },
    },
  });
}

export async function getResumes() {
  const user = await requireDbUser();

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Backfill legacy rows that were analyzed before status existed
  return resumes.map((resume) => {
    if (
      resume.status === "uploaded" &&
      (resume.atsScore != null || resume.analysis != null)
    ) {
      return { ...resume, status: "completed" };
    }
    return resume;
  });
}

export async function getJobMatches() {
  const user = await requireDbUser();

  return prisma.jobMatch.findMany({
    where: { resume: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      jobDescription: true,
      resume: { select: { fileName: true } },
    },
  });
}

export async function getCoachPlans() {
  const user = await requireDbUser();

  return prisma.coachPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function getNotes() {
  const user = await requireDbUser();

  return prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getUserProfile() {
  const user = await requireDbUser();

  return prisma.user.findUnique({
    where: { id: user.id },
    include: { settings: true },
  });
}

export async function globalSearch(query: string) {
  const user = await requireDbUser();

  const [interviews, notes, reports] = await Promise.all([
    prisma.interview.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          { type: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: { id: true, title: true, company: true, type: true },
    }),
    prisma.note.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: { id: true, title: true },
    }),
    prisma.report.findMany({
      where: {
        interview: { userId: user.id },
        title: { contains: query, mode: "insensitive" },
      },
      take: 10,
      select: { id: true, title: true },
    }),
  ]);

  return [
    ...interviews.map((i) => ({
      type: "interview" as const,
      id: i.id,
      title: i.title,
      subtitle: i.company ?? i.type,
      href: `/interviews/${i.id}`,
    })),
    ...notes.map((n) => ({
      type: "question" as const,
      id: n.id,
      title: n.title,
      href: `/notes`,
    })),
    ...reports.map((r) => ({
      type: "report" as const,
      id: r.id,
      title: r.title,
      href: `/reports/${r.id}`,
    })),
  ];
}
