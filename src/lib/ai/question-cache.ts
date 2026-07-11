import type { InterviewConfig } from "@/types";

interface CacheEntry {
  data: { questions: Array<Record<string, unknown>> };
  expiresAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, CacheEntry>();

function buildCacheKey(config: InterviewConfig, count: number): string {
  const topicsKey = (config.topics ?? [])
    .map(
      (t) =>
        `${t.name}:${t.difficulty}:${t.questionCount}:${t.isWeak ? "w" : "n"}`
    )
    .sort()
    .join(",");
  return [
    config.type,
    config.difficulty,
    config.company ?? "",
    config.customCompany ?? "",
    config.jobRole ?? "",
    config.experienceLevel ?? "",
    count,
    config.techStack.slice().sort().join(","),
    config.questionDistribution ?? "ai_decide",
    topicsKey,
  ].join("|");
}

export function getCachedQuestions(
  config: InterviewConfig,
  count: number
): { questions: Array<Record<string, unknown>> } | null {
  const key = buildCacheKey(config, count);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedQuestions(
  config: InterviewConfig,
  count: number,
  data: { questions: Array<Record<string, unknown>> }
): void {
  const key = buildCacheKey(config, count);
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function clearQuestionCache(): void {
  cache.clear();
}
