import type { InterviewConfig, TopicSelection } from "@/types";
import { expandTopicQuestionPlan } from "@/lib/interview-topics";
import { buildFallbackQuestions } from "@/lib/ai/fallbacks";

export type GeneratedQuestion = {
  content: string;
  type: string;
  topic: string;
  difficulty: string;
  hints: string[];
  idealAnswerOutline: string[];
  codingProblem?: unknown;
};

export type TopicQuotaIssue = {
  topic: string;
  expected: number;
  actual: number;
  missing: number;
};

export type QuestionValidationResult = {
  ok: boolean;
  totalExpected: number;
  totalActual: number;
  issues: string[];
  missingByTopic: TopicQuotaIssue[];
  questions: GeneratedQuestion[];
};

function normalizeTopicName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Map AI topic strings onto the exact selected topic names. */
export function resolveCanonicalTopic(
  rawTopic: string | undefined | null,
  selectedTopics: string[]
): string | null {
  if (!rawTopic?.trim() || selectedTopics.length === 0) return null;
  const normalized = normalizeTopicName(rawTopic);
  const exact = selectedTopics.find((t) => normalizeTopicName(t) === normalized);
  if (exact) return exact;

  const contains = selectedTopics.find(
    (t) =>
      normalized.includes(normalizeTopicName(t)) ||
      normalizeTopicName(t).includes(normalized)
  );
  return contains ?? null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

export function normalizeGeneratedQuestion(
  raw: Record<string, unknown>,
  config: InterviewConfig,
  fallbackTopic: string,
  fallbackDifficulty: string
): GeneratedQuestion | null {
  const content = String(raw.content ?? raw.question ?? "").trim();
  if (!content || content.length < 12) return null;

  const selectedNames = (config.topics ?? []).map((t) => t.name);
  const topic =
    resolveCanonicalTopic(String(raw.topic ?? ""), selectedNames) ?? fallbackTopic;

  const outline = asStringArray(
    raw.idealAnswerOutline ?? raw.expectedAnswerPoints ?? raw.keyPoints
  );

  return {
    content,
    type: String(raw.type ?? config.type),
    topic,
    difficulty: String(raw.difficulty ?? fallbackDifficulty),
    hints: asStringArray(raw.hints),
    idealAnswerOutline:
      outline.length > 0
        ? outline
        : [
            `Define ${topic}`,
            "Explain with a practical example",
            "Mention trade-offs or best practices",
          ],
    codingProblem: raw.codingProblem ?? null,
  };
}

function isNearDuplicate(a: string, b: string): boolean {
  const na = normalizeTopicName(a);
  const nb = normalizeTopicName(b);
  if (na === nb) return true;
  if (na.length < 20 || nb.length < 20) return false;
  return na.includes(nb) || nb.includes(na);
}

export function dedupeQuestions(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  const kept: GeneratedQuestion[] = [];
  for (const q of questions) {
    if (kept.some((k) => isNearDuplicate(k.content, q.content))) continue;
    kept.push(q);
  }
  return kept;
}

export function countByTopic(questions: GeneratedQuestion[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of questions) {
    counts[q.topic] = (counts[q.topic] ?? 0) + 1;
  }
  return counts;
}

export function validateQuestionQuotas(
  questions: GeneratedQuestion[],
  topics: TopicSelection[],
  config: InterviewConfig
): QuestionValidationResult {
  const totalExpected = topics.reduce((sum, t) => sum + t.questionCount, 0);
  const issues: string[] = [];
  const selectedNames = topics.map((t) => t.name);
  const counts = countByTopic(questions);
  const missingByTopic: TopicQuotaIssue[] = [];

  if (questions.length !== totalExpected) {
    issues.push(
      `Total questions ${questions.length} !== requested ${totalExpected}`
    );
  }

  for (const topic of topics) {
    const actual = counts[topic.name] ?? 0;
    if (actual !== topic.questionCount) {
      issues.push(
        `Topic "${topic.name}": got ${actual}, expected ${topic.questionCount}`
      );
      if (actual < topic.questionCount) {
        missingByTopic.push({
          topic: topic.name,
          expected: topic.questionCount,
          actual,
          missing: topic.questionCount - actual,
        });
      }
    }
  }

  for (const q of questions) {
    if (!selectedNames.includes(q.topic)) {
      issues.push(`Unrelated topic "${q.topic}" in question: ${q.content.slice(0, 60)}`);
    }
    if (!q.content?.trim()) {
      issues.push("Empty question content found");
    }
    if (!q.idealAnswerOutline?.length) {
      issues.push(`Missing expected answer points for: ${q.content.slice(0, 60)}`);
    }
  }

  // Enforce difficulty from topic plan where possible
  const topicDifficulty = Object.fromEntries(
    topics.map((t) => [
      t.name,
      t.difficulty === "mixed" ? config.difficulty : t.difficulty,
    ])
  );
  const normalized = questions.map((q) => ({
    ...q,
    difficulty: topicDifficulty[q.topic] ?? q.difficulty,
    type: config.type,
  }));

  return {
    ok: issues.length === 0 && normalized.length === totalExpected,
    totalExpected,
    totalActual: normalized.length,
    issues,
    missingByTopic,
    questions: normalized,
  };
}

/**
 * Force questions into the exact topic quota plan using AI output first,
 * then fallback fillers for any missing slots. Trims extras.
 */
export function enforceTopicQuotas(
  rawQuestions: GeneratedQuestion[],
  config: InterviewConfig
): GeneratedQuestion[] {
  const topics = config.topics ?? [];
  if (topics.length === 0) {
    return rawQuestions.slice(0, config.questionCount);
  }

  const plan = expandTopicQuestionPlan(topics, config.difficulty);
  const selectedNames = topics.map((t) => t.name);
  const pools = new Map<string, GeneratedQuestion[]>();
  for (const name of selectedNames) pools.set(name, []);

  const deduped = dedupeQuestions(rawQuestions);
  for (const q of deduped) {
    const topic = resolveCanonicalTopic(q.topic, selectedNames);
    if (!topic) continue;
    const list = pools.get(topic);
    if (!list) continue;
    if (list.some((existing) => isNearDuplicate(existing.content, q.content))) continue;
    list.push({ ...q, topic });
  }

  const fallback = buildFallbackQuestions(config, plan.length).questions.map(
    (q, index) =>
      normalizeGeneratedQuestion(
        q,
        config,
        plan[index]?.name ?? selectedNames[0],
        plan[index]?.difficulty ?? config.difficulty
      )
  ).filter((q): q is GeneratedQuestion => q != null);

  // Seed fallback into pools for topics still short
  for (const q of fallback) {
    const list = pools.get(q.topic);
    if (!list) continue;
    if (list.some((existing) => isNearDuplicate(existing.content, q.content))) continue;
    list.push(q);
  }

  const result: GeneratedQuestion[] = [];
  const usedContent = new Set<string>();

  for (const slot of plan) {
    const pool = pools.get(slot.name) ?? [];
    let next = pool.find((q) => !usedContent.has(normalizeTopicName(q.content)));
    if (!next) {
      next = {
        content: `Explain ${slot.name} with a practical example relevant to a ${config.jobRole || "software engineer"} role${
          config.techStack.length ? ` using ${config.techStack.join(", ")}` : ""
        }.`,
        type: config.type,
        topic: slot.name,
        difficulty: slot.difficulty,
        hints: [`Focus on ${slot.name} fundamentals and a real-world example.`],
        idealAnswerOutline: [
          `Define ${slot.name}`,
          "Walk through how it works",
          "Give a concrete example",
          "Mention trade-offs",
        ],
        codingProblem: null,
      };
    }
    usedContent.add(normalizeTopicName(next.content));
    result.push({
      ...next,
      topic: slot.name,
      difficulty: slot.difficulty,
      type: config.type,
      idealAnswerOutline:
        next.idealAnswerOutline?.length > 0
          ? next.idealAnswerOutline
          : [
              `Define ${slot.name}`,
              "Explain with an example",
              "Mention best practices",
            ],
    });
  }

  return result;
}
