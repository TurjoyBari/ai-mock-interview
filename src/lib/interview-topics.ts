import type { InterviewType, TopicDifficulty, TopicSelection } from "@/types";
import {
  INTERVIEW_TOPIC_LIBRARY,
  INTERVIEW_TOPIC_LIBRARY_LABELS,
  getLibraryTopicsForType,
} from "@/data/interview-topic-library";

/**
 * @deprecated Prefer INTERVIEW_TOPIC_LIBRARY — kept for custom/tech-stack resolution.
 * Mirrors type libraries plus tech aliases used by custom interviews.
 */
export const TOPIC_CATALOG: Record<string, string[]> = {
  ...Object.fromEntries(
    Object.entries(INTERVIEW_TOPIC_LIBRARY).filter(([key]) => key !== "custom")
  ),
};

/** Popular technologies shown as quick-select chips on the create form. */
export const QUICK_TECH_STACK = [
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "TypeScript",
  "Python",
  "SQL",
] as const;

/** Map interview type → primary topic catalog key (legacy). */
export const INTERVIEW_TYPE_TOPIC_KEY: Partial<Record<InterviewType, string>> = {
  javascript: "javascript",
  react: "react",
  nextjs: "nextjs",
  nodejs: "nodejs",
  typescript: "typescript",
  python: "python",
  database: "database",
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  system_design: "system_design",
  coding: "coding",
  devops: "devops",
  aiml: "aiml",
  dotnet: "dotnet",
  behavioral: "behavioral",
  hr: "hr",
  technical: "technical",
};

const TECH_STACK_TOPIC_ALIASES: Record<string, string> = {
  javascript: "javascript",
  js: "javascript",
  react: "react",
  "react.js": "react",
  reactjs: "react",
  next: "nextjs",
  nextjs: "nextjs",
  "next.js": "nextjs",
  node: "nodejs",
  nodejs: "nodejs",
  "node.js": "nodejs",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  sql: "database",
  postgres: "database",
  postgresql: "database",
  mongodb: "database",
  mysql: "database",
  express: "nodejs",
  docker: "devops",
  kubernetes: "devops",
  "c#": "dotnet",
  csharp: "dotnet",
  ".net": "dotnet",
  dotnet: "dotnet",
};

function resolveCustomCatalogKeys(techStack: string[] = []): string[] {
  const keys = new Set<string>();
  for (const tech of techStack) {
    const alias = TECH_STACK_TOPIC_ALIASES[tech.trim().toLowerCase()];
    if (alias && TOPIC_CATALOG[alias]) keys.add(alias);
  }
  if (keys.size === 0) keys.add("technical");
  return [...keys];
}

/**
 * Resolve which topic catalogs apply.
 * Non-custom interview types use ONLY that type's static library (tech stack ignored).
 * Custom interviews use tech-stack chips.
 */
export function resolveTopicCatalogKeys(
  interviewType: InterviewType,
  techStack: string[] = []
): string[] {
  if (interviewType === "custom") {
    return resolveCustomCatalogKeys(techStack);
  }
  if (getLibraryTopicsForType(interviewType).length > 0) {
    return [interviewType];
  }
  return ["technical"];
}

export function getAvailableTopics(
  interviewType: InterviewType,
  techStack: string[] = []
): { catalogKey: string; label: string; topics: string[] }[] {
  if (interviewType === "custom") {
    return resolveCustomCatalogKeys(techStack).map((key) => ({
      catalogKey: key,
      label: formatCatalogLabel(key),
      topics: TOPIC_CATALOG[key] ?? [],
    }));
  }

  const topics = getLibraryTopicsForType(interviewType);
  return [
    {
      catalogKey: interviewType,
      label: INTERVIEW_TOPIC_LIBRARY_LABELS[interviewType] ?? formatCatalogLabel(interviewType),
      topics,
    },
  ];
}

export function getFlatAvailableTopicNames(
  interviewType: InterviewType,
  techStack: string[] = []
): string[] {
  if (interviewType !== "custom") {
    return [...getLibraryTopicsForType(interviewType)];
  }

  const seen = new Set<string>();
  const names: string[] = [];
  for (const catalog of getAvailableTopics(interviewType, techStack)) {
    for (const topic of catalog.topics) {
      if (!seen.has(topic)) {
        seen.add(topic);
        names.push(topic);
      }
    }
  }
  return names;
}

/** Keep only selections that exist in the current interview type library. */
export function filterTopicsForInterviewType(
  interviewType: InterviewType,
  topics: TopicSelection[],
  techStack: string[] = []
): TopicSelection[] {
  const allowed = new Set(getFlatAvailableTopicNames(interviewType, techStack));
  return topics.filter((t) => allowed.has(t.name));
}

function formatCatalogLabel(key: string): string {
  return (
    INTERVIEW_TOPIC_LIBRARY_LABELS[key as InterviewType] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function createDefaultTopicSelection(
  name: string,
  difficulty: TopicDifficulty = "medium"
): TopicSelection {
  return {
    name,
    difficulty,
    questionCount: 1,
    isWeak: false,
  };
}

/** Pick a balanced default topic set when the user selects none. */
export function pickBalancedDefaultTopics(
  interviewType: InterviewType,
  techStack: string[],
  questionCount: number,
  difficulty: TopicDifficulty = "medium"
): TopicSelection[] {
  const pool = getFlatAvailableTopicNames(interviewType, techStack);
  if (pool.length === 0) return [];

  const targetTopicCount = Math.min(
    pool.length,
    Math.max(3, Math.min(6, Math.ceil(questionCount / 2)))
  );

  const selected = pool
    .slice(0, targetTopicCount)
    .map((name) => createDefaultTopicSelection(name, difficulty));

  return distributeEvenly(selected, questionCount);
}

export function distributeEvenly(
  topics: TopicSelection[],
  totalQuestions: number
): TopicSelection[] {
  if (topics.length === 0) return [];
  const base = Math.floor(totalQuestions / topics.length);
  let remainder = totalQuestions % topics.length;

  return topics.map((topic) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return { ...topic, questionCount: Math.max(1, base + extra) };
  });
}

export function distributeForWeakFocus(
  topics: TopicSelection[],
  totalQuestions: number
): TopicSelection[] {
  if (topics.length === 0) return [];

  const weak = topics.filter((t) => t.isWeak || t.difficulty === "hard");
  const normal = topics.filter((t) => !(t.isWeak || t.difficulty === "hard"));

  if (weak.length === 0) return distributeEvenly(topics, totalQuestions);

  const weakShare = Math.max(weak.length, Math.ceil(totalQuestions * 0.6));
  const normalShare = Math.max(normal.length > 0 ? normal.length : 0, totalQuestions - weakShare);

  let combined = [
    ...distributeEvenly(weak, weakShare),
    ...(normal.length > 0 ? distributeEvenly(normal, normalShare) : []),
  ];

  let allocated = combined.reduce((sum, t) => sum + t.questionCount, 0);
  while (allocated > totalQuestions && combined.length > 0) {
    const idx = combined.findIndex((t) => t.questionCount > 1);
    if (idx < 0) break;
    combined = combined.map((t, i) =>
      i === idx ? { ...t, questionCount: t.questionCount - 1 } : t
    );
    allocated -= 1;
  }
  while (allocated < totalQuestions) {
    combined = combined.map((t, i) =>
      i === 0 ? { ...t, questionCount: t.questionCount + 1 } : t
    );
    allocated += 1;
  }

  return combined;
}

export function distributeRandomly(
  topics: TopicSelection[],
  totalQuestions: number
): TopicSelection[] {
  if (topics.length === 0) return [];
  const counts = topics.map(() => 0);
  for (let i = 0; i < totalQuestions; i++) {
    counts[Math.floor(Math.random() * topics.length)] += 1;
  }
  if (totalQuestions >= topics.length) {
    for (let i = 0; i < topics.length; i++) {
      if (counts[i] === 0) {
        const donor = counts.findIndex((c) => c > 1);
        if (donor >= 0) {
          counts[donor] -= 1;
          counts[i] = 1;
        }
      }
    }
  }
  return topics.map((topic, i) => ({
    ...topic,
    questionCount: Math.max(1, counts[i] || 1),
  }));
}

export function resolveTopicQuestionPlan(
  topics: TopicSelection[],
  totalQuestions: number,
  distribution: string
): TopicSelection[] {
  if (topics.length === 0) return [];

  switch (distribution) {
    case "even":
      return distributeEvenly(topics, totalQuestions);
    case "focus_weak":
      return distributeForWeakFocus(topics, totalQuestions);
    case "random":
      return distributeRandomly(topics, totalQuestions);
    case "custom":
      return topics.map((t) => ({
        ...t,
        questionCount: Math.max(1, t.questionCount || 1),
      }));
    case "ai_decide":
    default:
      return distributeEvenly(topics, totalQuestions);
  }
}

export function sumTopicQuestionCounts(topics: TopicSelection[]): number {
  return topics.reduce((sum, t) => sum + Math.max(0, t.questionCount || 0), 0);
}

/** Rough interview length from question volume (~1.75 min/question, min 10). */
export function estimateInterviewDurationMinutes(totalQuestions: number): number {
  if (totalQuestions <= 0) return 15;
  return Math.min(180, Math.max(10, Math.round(totalQuestions * 1.75)));
}

/** Expand topic plan into an ordered list of { name, difficulty } slots. */
export function expandTopicQuestionPlan(
  topics: TopicSelection[],
  overallDifficulty: string
): { name: string; difficulty: string }[] {
  const plan: { name: string; difficulty: string }[] = [];
  for (const topic of topics) {
    const count = Math.max(1, topic.questionCount || 1);
    const difficulty =
      topic.difficulty === "mixed" ? overallDifficulty : topic.difficulty;
    for (let i = 0; i < count; i++) {
      plan.push({ name: topic.name, difficulty });
    }
  }
  return plan;
}

export function buildInterviewTopicMetadata(topics: TopicSelection[], distributionMode: string) {
  return {
    selectedTopics: topics.map((t) => t.name),
    topicDifficulty: Object.fromEntries(topics.map((t) => [t.name, t.difficulty])),
    topicQuestionCount: Object.fromEntries(
      topics.map((t) => [t.name, t.questionCount])
    ),
    distributionMode,
    topics,
    totalQuestions: sumTopicQuestionCounts(topics),
  };
}

export interface TopicPerformanceRow {
  topic: string;
  averageScore: number;
  scoreOutOf10: number;
  questionCount: number;
  answeredCount: number;
}

/** Aggregate per-topic scores from answers + question.topic for reports. */
export function computeTopicPerformance(
  answers: {
    score: number | null;
    analysis?: { scoreOutOf10?: number | null; topicTag?: string | null } | null;
    question: { topic: string | null; content: string };
  }[]
): TopicPerformanceRow[] {
  const buckets = new Map<
    string,
    { scores: number[]; outOf10: number[]; answered: number }
  >();

  for (const answer of answers) {
    const topic =
      answer.question.topic?.trim() ||
      answer.analysis?.topicTag?.trim() ||
      "General";
    const bucket = buckets.get(topic) ?? { scores: [], outOf10: [], answered: 0 };
    if (answer.score != null) {
      bucket.scores.push(answer.score);
      bucket.outOf10.push(
        answer.analysis?.scoreOutOf10 ?? Math.round(answer.score / 10)
      );
      bucket.answered += 1;
    } else {
      bucket.answered += 0;
    }
    buckets.set(topic, bucket);
  }

  return [...buckets.entries()]
    .map(([topic, data]) => {
      const averageScore =
        data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;
      const scoreOutOf10 =
        data.outOf10.length > 0
          ? Math.round(
              (data.outOf10.reduce((a, b) => a + b, 0) / data.outOf10.length) * 10
            ) / 10
          : 0;
      return {
        topic,
        averageScore,
        scoreOutOf10,
        questionCount: data.scores.length || 1,
        answeredCount: data.answered,
      };
    })
    .sort((a, b) => a.topic.localeCompare(b.topic));
}
