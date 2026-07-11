import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import type { DashboardStats } from "@/types";
import { format } from "date-fns";

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await requireDbUser();

  const [
    recentInterviews,
    completedInterviews,
    scheduledInterviews,
    latestFeedback,
    progressSnapshots,
  ] = await Promise.all([
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
      where: { userId: user.id, status: "completed" },
      select: {
        overallScore: true,
        communicationScore: true,
        technicalScore: true,
        behavioralScore: true,
        completedAt: true,
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
      select: { suggestions: true, detailedExplanation: true },
    }),
    prisma.progressSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  const scores = completedInterviews.filter((i) => i.overallScore != null);
  const avg = (arr: (number | null)[]) => {
    const valid = arr.filter((v): v is number => v != null);
    return valid.length
      ? valid.reduce((a, b) => a + b, 0) / valid.length
      : 0;
  };

  const weakTopicCounts = new Map<string, number>();
  const strongTopicCounts = new Map<string, number>();

  const feedbacks = await prisma.feedback.findMany({
    where: { interview: { userId: user.id } },
    select: { weakAreas: true, strongAreas: true },
  });

  feedbacks.forEach((f) => {
    f.weakAreas.forEach((t) =>
      weakTopicCounts.set(t, (weakTopicCounts.get(t) ?? 0) + 1)
    );
    f.strongAreas.forEach((t) =>
      strongTopicCounts.set(t, (strongTopicCounts.get(t) ?? 0) + 1)
    );
  });

  const sortTopics = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

  const progressData =
    progressSnapshots.length > 0
      ? progressSnapshots
          .reverse()
          .map((p) => ({
            date: format(p.date, "MMM d"),
            score: p.avgTechnicalScore ?? 0,
          }))
      : completedInterviews
          .filter((i) => i.completedAt && i.overallScore)
          .slice(-10)
          .map((i) => ({
            date: format(i.completedAt!, "MMM d"),
            score: i.overallScore!,
          }));

  const latestSnapshot = progressSnapshots[0];

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
    averageScore: avg(scores.map((s) => s.overallScore)),
    communicationScore: avg(completedInterviews.map((i) => i.communicationScore)),
    technicalScore: avg(completedInterviews.map((i) => i.technicalScore)),
    behavioralScore: avg(completedInterviews.map((i) => i.behavioralScore)),
    weakTopics: sortTopics(weakTopicCounts),
    strongTopics: sortTopics(strongTopicCounts),
    recentFeedback: latestFeedback.flatMap((f) => f.suggestions).slice(0, 5),
    progressData,
    practiceStreak: latestSnapshot?.practiceStreak ?? 0,
    totalInterviews: completedInterviews.length,
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
