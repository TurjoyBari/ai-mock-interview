import { format, differenceInCalendarDays, startOfDay, subDays } from "date-fns";
import {
  INTERVIEW_TOPIC_LIBRARY,
  INTERVIEW_TOPIC_LIBRARY_LABELS,
} from "@/data/interview-topic-library";
import { computeTopicPerformance } from "@/lib/interview-topics";
import { INTERVIEW_TYPES } from "@/lib/constants";
import type {
  DashboardAchievement,
  DashboardAnalytics,
  DashboardHistoryItem,
  DashboardInsight,
  DashboardOverview,
  DashboardRange,
  DashboardReadiness,
  DashboardRoadmapWeek,
  DashboardTopicStat,
  DashboardTrendPoint,
} from "@/types/dashboard";
import type { InterviewType } from "@/types";

export type AnalyticsInterview = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  techStack: string[];
  duration: number;
  questionCount: number;
  status: string;
  overallScore: number | null;
  communicationScore: number | null;
  technicalScore: number | null;
  behavioralScore: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  feedback: {
    overallScore: number;
    communicationScore: number;
    confidenceScore: number;
    technicalScore: number;
    behaviorScore: number;
    weakTopics: string[];
    strongTopics: string[];
    weakAreas: string[];
    strongAreas: string[];
    suggestions: string[];
  } | null;
  report: { id: string } | null;
  answers: {
    score: number | null;
    analysis: { scoreOutOf10?: number | null; topicTag?: string | null } | null;
    question: { topic: string | null; content: string };
  }[];
  _count: { answers: number; questions: number };
};

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function typeLabel(type: string) {
  return INTERVIEW_TYPES.find((t) => t.value === type)?.label ?? type;
}

function catalogForTopic(topic: string): string {
  for (const [key, topics] of Object.entries(INTERVIEW_TOPIC_LIBRARY)) {
    if (key === "custom") continue;
    if (topics.includes(topic)) {
      return (
        INTERVIEW_TOPIC_LIBRARY_LABELS[key as InterviewType] ?? key
      );
    }
  }
  return "General";
}

export function rangeStart(range: DashboardRange, now = new Date()): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return startOfDay(subDays(now, days - 1));
}

export function filterInterviewsByRange(
  interviews: AnalyticsInterview[],
  range: DashboardRange
): AnalyticsInterview[] {
  const start = rangeStart(range);
  if (!start) return interviews;
  return interviews.filter((i) => {
    const d = i.completedAt ?? i.createdAt;
    return d >= start;
  });
}

export function computePracticeStreak(
  completedDates: Date[],
  now = new Date()
): number {
  if (!completedDates.length) return 0;
  const days = new Set(
    completedDates.map((d) => startOfDay(d).toISOString())
  );
  let streak = 0;
  let cursor = startOfDay(now);
  // Allow streak to continue if last practice was yesterday
  if (!days.has(cursor.toISOString())) {
    cursor = startOfDay(subDays(now, 1));
    if (!days.has(cursor.toISOString())) return 0;
  }
  while (days.has(cursor.toISOString())) {
    streak += 1;
    cursor = startOfDay(subDays(cursor, 1));
  }
  return streak;
}

export function buildOverview(
  interviews: AnalyticsInterview[],
  allCompleted: AnalyticsInterview[]
): DashboardOverview {
  const scores = interviews
    .map((i) => i.overallScore ?? i.feedback?.overallScore ?? null)
    .filter((v): v is number => v != null);
  const confidence = interviews
    .map((i) => i.feedback?.confidenceScore ?? null)
    .filter((v): v is number => v != null);
  const communication = interviews
    .map((i) => i.communicationScore ?? i.feedback?.communicationScore ?? null)
    .filter((v): v is number => v != null);
  const technical = interviews
    .map((i) => i.technicalScore ?? i.feedback?.technicalScore ?? null)
    .filter((v): v is number => v != null);
  const behavioral = interviews
    .map((i) => i.behavioralScore ?? i.feedback?.behaviorScore ?? null)
    .filter((v): v is number => v != null);

  const questionsAnswered = interviews.reduce(
    (sum, i) => sum + (i._count?.answers ?? i.answers.length),
    0
  );

  const practiceMinutes = interviews.reduce((sum, i) => {
    if (i.startedAt && i.completedAt) {
      const mins = Math.max(
        1,
        Math.round(
          (i.completedAt.getTime() - i.startedAt.getTime()) / 60_000
        )
      );
      return sum + mins;
    }
    return sum + (i.duration || 0);
  }, 0);

  return {
    totalInterviews: interviews.length,
    totalQuestionsAnswered: questionsAnswered,
    averageOverallScore: clamp(avg(scores)),
    practiceStreak: computePracticeStreak(
      allCompleted
        .map((i) => i.completedAt)
        .filter((d): d is Date => Boolean(d))
    ),
    totalPracticeMinutes: practiceMinutes,
    bestScore: scores.length ? clamp(Math.max(...scores)) : 0,
    averageConfidenceScore: clamp(avg(confidence)),
    averageCommunicationScore: clamp(avg(communication)),
    averageTechnicalScore: clamp(avg(technical)),
    averageBehavioralScore: clamp(avg(behavioral)),
  };
}

export function buildTrends(
  interviews: AnalyticsInterview[]
): DashboardTrendPoint[] {
  return [...interviews]
    .filter((i) => i.completedAt)
    .sort(
      (a, b) =>
        (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0)
    )
    .map((i) => ({
      date: format(i.completedAt!, "MMM d"),
      dateKey: i.completedAt!.toISOString(),
      overall: clamp(i.overallScore ?? i.feedback?.overallScore ?? 0),
      confidence: clamp(i.feedback?.confidenceScore ?? 0),
      communication: clamp(
        i.communicationScore ?? i.feedback?.communicationScore ?? 0
      ),
      technical: clamp(i.technicalScore ?? i.feedback?.technicalScore ?? 0),
      behavioral: clamp(i.behavioralScore ?? i.feedback?.behaviorScore ?? 0),
    }));
}

export function buildTopicStats(
  interviews: AnalyticsInterview[]
): DashboardTopicStat[] {
  const answers = interviews.flatMap((i) => i.answers);
  return computeTopicPerformance(answers).map((row) => {
    const score = clamp(row.averageScore);
    return {
      topic: row.topic,
      score,
      level: score >= 75 ? "strong" : score >= 55 ? "average" : "weak",
      answeredCount: row.answeredCount,
      catalog: catalogForTopic(row.topic),
    };
  });
}

export function buildHistory(
  interviews: AnalyticsInterview[]
): DashboardHistoryItem[] {
  return [...interviews]
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? b.createdAt.getTime()) -
        (a.completedAt?.getTime() ?? a.createdAt.getTime())
    )
    .map((i) => ({
      id: i.id,
      date: format(i.completedAt ?? i.createdAt, "MMM d, yyyy"),
      completedAt: i.completedAt?.toISOString() ?? null,
      title: i.title,
      type: i.type,
      typeLabel: typeLabel(i.type),
      techStack: i.techStack,
      difficulty: i.difficulty,
      questionCount: i.questionCount,
      answersCount: i._count?.answers ?? i.answers.length,
      duration: i.duration,
      overallScore: i.overallScore ?? i.feedback?.overallScore ?? null,
      reportId: i.report?.id ?? null,
    }));
}

export function buildInsights(
  allCompleted: AnalyticsInterview[]
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  if (allCompleted.length === 0) return insights;

  const now = new Date();
  const last30 = filterInterviewsByRange(allCompleted, "30d");
  const prevStart = startOfDay(subDays(now, 59));
  const prevEnd = startOfDay(subDays(now, 30));
  const prev30 = allCompleted.filter((i) => {
    const d = i.completedAt ?? i.createdAt;
    return d >= prevStart && d < prevEnd;
  });

  const avgOverall = (list: AnalyticsInterview[]) =>
    avg(
      list
        .map((i) => i.overallScore ?? i.feedback?.overallScore ?? null)
        .filter((v): v is number => v != null)
    );

  if (last30.length >= 2 && prev30.length >= 1) {
    const delta = avgOverall(last30) - avgOverall(prev30);
    if (Math.abs(delta) >= 3) {
      insights.push({
        id: "overall-delta",
        text:
          delta > 0
            ? `Your overall score improved by ${Math.round(delta)} points over the last 30 days.`
            : `Your overall score dipped by ${Math.abs(Math.round(delta))} points vs the prior month — focus practice on weak topics.`,
        tone: delta > 0 ? "positive" : "warning",
      });
    }
  }

  const trends = buildTrends(allCompleted).slice(-5);
  if (trends.length >= 3) {
    const first = trends[0];
    const last = trends[trends.length - 1];
    if (last.communication - first.communication >= 5) {
      insights.push({
        id: "comm-up",
        text: "Communication is improving steadily across your recent interviews.",
        tone: "positive",
      });
    }
    if (last.confidence - first.confidence >= 5) {
      insights.push({
        id: "conf-up",
        text: "Your confidence score has increased across your last interviews.",
        tone: "positive",
      });
    }
  }

  const overview = buildOverview(allCompleted, allCompleted);
  if (
    overview.averageTechnicalScore >= 70 &&
    overview.averageBehavioralScore > 0 &&
    overview.averageBehavioralScore < overview.averageTechnicalScore - 10
  ) {
    insights.push({
      id: "tech-vs-behavior",
      text: "You answer technical questions well but need more structured behavioral responses.",
      tone: "warning",
    });
  }

  const topics = buildTopicStats(allCompleted);
  const jsTopics = topics.filter((t) => t.catalog === "JavaScript");
  if (jsTopics.length >= 2 && last30.length >= 2 && prev30.length >= 1) {
    const scoreNow = avg(jsTopics.map((t) => t.score));
    // Approximate improvement using overall delta as proxy when catalog history isn't stored separately
    const delta = avgOverall(last30) - avgOverall(prev30);
    if (scoreNow >= 60 && delta >= 5) {
      insights.push({
        id: "js-improve",
        text: `Your JavaScript fundamentals have improved by about ${Math.round(delta)}% in the last month.`,
        tone: "positive",
      });
    }
  }

  const weak = topics.filter((t) => t.level === "weak").slice(0, 3);
  if (weak.length) {
    insights.push({
      id: "weak-focus",
      text: `Prioritize practice on: ${weak.map((t) => t.topic).join(", ")}.`,
      tone: "warning",
    });
  }

  return insights.slice(0, 6);
}

export function buildReadiness(
  overview: DashboardOverview,
  interviews: AnalyticsInterview[]
): DashboardReadiness {
  const scores = interviews
    .map((i) => i.overallScore ?? i.feedback?.overallScore ?? null)
    .filter((v): v is number => v != null);

  let consistency = 50;
  if (scores.length >= 2) {
    const mean = avg(scores);
    const variance =
      scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    const std = Math.sqrt(variance);
    consistency = clamp(100 - std * 2);
  }

  const weeks = Math.max(
    1,
    differenceInCalendarDays(
      new Date(),
      interviews[0]?.completedAt ?? new Date()
    ) / 7
  );
  const frequency = clamp((interviews.length / weeks) * 40);

  const score = clamp(
    overview.averageOverallScore * 0.3 +
      overview.averageTechnicalScore * 0.2 +
      overview.averageCommunicationScore * 0.15 +
      overview.averageConfidenceScore * 0.15 +
      consistency * 0.1 +
      frequency * 0.1
  );

  let level: DashboardReadiness["level"] = "Beginner";
  let nextLevel: string | null = "Intermediate";
  let nextLevelAt: number | null = 40;
  if (score >= 85) {
    level = "Job Ready";
    nextLevel = null;
    nextLevelAt = null;
  } else if (score >= 65) {
    level = "Interview Ready";
    nextLevel = "Job Ready";
    nextLevelAt = 85;
  } else if (score >= 40) {
    level = "Intermediate";
    nextLevel = "Interview Ready";
    nextLevelAt = 65;
  }

  const tips: string[] = [];
  if (overview.averageTechnicalScore < 70)
    tips.push("Raise technical score with focused topic drills.");
  if (overview.averageCommunicationScore < 70)
    tips.push("Practice clearer structure: answer → example → takeaway.");
  if (overview.practiceStreak < 3)
    tips.push("Build consistency with short daily practice sessions.");
  if (overview.totalInterviews < 5)
    tips.push("Complete more full interviews to stabilize your readiness score.");
  if (!tips.length)
    tips.push("Keep practicing weak topics to push into the next readiness level.");

  return { score, level, nextLevel, nextLevelAt, tips: tips.slice(0, 3) };
}

export function buildRoadmap(topics: DashboardTopicStat[]): DashboardRoadmapWeek[] {
  const weakFirst = [
    ...topics.filter((t) => t.level === "weak"),
    ...topics.filter((t) => t.level === "average"),
  ];
  const unique = [...new Map(weakFirst.map((t) => [t.topic, t])).values()];
  const picks = unique.slice(0, 6).map((t) => t.topic);
  if (!picks.length) return [];

  const weeks: DashboardRoadmapWeek[] = [];
  for (let i = 0; i < picks.length; i += 2) {
    weeks.push({
      week: weeks.length + 1,
      topics: picks.slice(i, i + 2),
    });
  }
  return weeks;
}

export function buildAchievements(
  overview: DashboardOverview,
  topics: DashboardTopicStat[],
  allCompletedCount: number,
  totalQuestionsAllTime: number
): DashboardAchievement[] {
  const defs: Omit<DashboardAchievement, "unlocked">[] = [
    {
      id: "first",
      title: "First Interview",
      description: "Complete your first mock interview",
      icon: "🎯",
    },
    {
      id: "ten",
      title: "10 Interviews Completed",
      description: "Finish 10 interviews",
      icon: "🔟",
    },
    {
      id: "hundred-q",
      title: "100 Questions Answered",
      description: "Answer 100 interview questions",
      icon: "💯",
    },
    {
      id: "streak-7",
      title: "7-Day Practice Streak",
      description: "Practice on 7 consecutive days",
      icon: "🔥",
    },
    {
      id: "communicator",
      title: "Excellent Communicator",
      description: "Average communication ≥ 80 across 3+ interviews",
      icon: "🗣️",
    },
    {
      id: "js-expert",
      title: "JavaScript Expert",
      description: "Score ≥ 90 on a JavaScript topic with 5+ answers",
      icon: "🟨",
    },
    {
      id: "react-explorer",
      title: "React Explorer",
      description: "Score ≥ 85 on a React topic with 5+ answers",
      icon: "⚛️",
    },
  ];

  return defs.map((d) => {
    let unlocked = false;
    if (d.id === "first") unlocked = allCompletedCount >= 1;
    if (d.id === "ten") unlocked = allCompletedCount >= 10;
    if (d.id === "hundred-q") unlocked = totalQuestionsAllTime >= 100;
    if (d.id === "streak-7") unlocked = overview.practiceStreak >= 7;
    if (d.id === "communicator")
      unlocked =
        overview.averageCommunicationScore >= 80 && allCompletedCount >= 3;
    if (d.id === "js-expert")
      unlocked = topics.some(
        (t) =>
          t.catalog === "JavaScript" && t.score >= 90 && t.answeredCount >= 5
      );
    if (d.id === "react-explorer")
      unlocked = topics.some(
        (t) => t.catalog === "React" && t.score >= 85 && t.answeredCount >= 5
      );
    return { ...d, unlocked };
  });
}

export function buildDashboardAnalytics(
  allCompleted: AnalyticsInterview[],
  range: DashboardRange = "all"
): DashboardAnalytics {
  const ranged = filterInterviewsByRange(allCompleted, range);
  const overview = buildOverview(ranged, allCompleted);
  const topics = buildTopicStats(ranged);
  const weakTopics = [
    ...new Set([
      ...topics.filter((t) => t.level === "weak").map((t) => t.topic),
      ...ranged.flatMap((i) => i.feedback?.weakTopics ?? []),
    ]),
  ].slice(0, 12);
  const strongTopics = topics
    .filter((t) => t.level === "strong")
    .map((t) => t.topic)
    .slice(0, 12);

  const totalQuestionsAllTime = allCompleted.reduce(
    (sum, i) => sum + (i._count?.answers ?? i.answers.length),
    0
  );

  // Achievements, insights, readiness, and roadmap reflect all-time progress.
  const allTopics = buildTopicStats(allCompleted);
  const allOverview = buildOverview(allCompleted, allCompleted);

  return {
    overview,
    trends: buildTrends(ranged),
    topics,
    weakTopics,
    strongTopics,
    history: buildHistory(ranged),
    insights: buildInsights(allCompleted),
    readiness: buildReadiness(allOverview, allCompleted),
    roadmap: buildRoadmap(allTopics.length ? allTopics : topics),
    achievements: buildAchievements(
      allOverview,
      allTopics,
      allCompleted.length,
      totalQuestionsAllTime
    ),
    allTimeInterviewCount: allCompleted.length,
  };
}
