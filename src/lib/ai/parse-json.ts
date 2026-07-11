import { aiLogger } from "@/lib/ai/logger";

function repairTruncatedJson(input: string): string {
  let repaired = input.trim();

  const quoteCount = (repaired.match(/"/g) ?? []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }

  const openBraces = (repaired.match(/\{/g) ?? []).length;
  const closeBraces = (repaired.match(/\}/g) ?? []).length;
  const openBrackets = (repaired.match(/\[/g) ?? []).length;
  const closeBrackets = (repaired.match(/\]/g) ?? []).length;

  repaired += "]".repeat(Math.max(0, openBrackets - closeBrackets));
  repaired += "}".repeat(Math.max(0, openBraces - closeBraces));

  return repaired;
}

function stripMarkdownFences(content: string): string {
  return content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseGeminiJson<T>(content: string, context: string): T {
  if (!content?.trim()) {
    const error = new Error(`Gemini returned empty content for ${context}`);
    aiLogger.error("json-parse:empty", error, { context });
    throw error;
  }

  const candidates = [
    stripMarkdownFences(content),
    content.match(/\{[\s\S]*\}/)?.[0] ?? "",
  ].filter(Boolean);

  const errors: string[] = [];

  for (const candidate of candidates) {
    for (const attempt of [candidate, repairTruncatedJson(candidate)]) {
      try {
        const parsed = JSON.parse(attempt) as T;
        aiLogger.info("json-parse:success", {
          context,
          length: content.length,
        });
        return parsed;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  }

  aiLogger.error("json-parse:failed", new Error("JSON parse failed"), {
    context,
    rawPreview: content.slice(0, 1500),
    rawLength: content.length,
    errors,
  });

  throw new Error(
    `Failed to parse Gemini JSON for ${context}. The response may have been truncated or malformed.`
  );
}
