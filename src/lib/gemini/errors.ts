const RETRY_INFO_TYPE = "google.rpc.RetryInfo";

export interface ParsedGeminiError {
  status?: number;
  rawMessage: string;
  userMessage: string;
  retryAfterMs?: number;
  isRateLimited: boolean;
}

function parseDurationToMs(value: string): number | undefined {
  const trimmed = value.trim();
  const secondsMatch = trimmed.match(/^([\d.]+)s$/i);
  if (secondsMatch) {
    return Math.ceil(parseFloat(secondsMatch[1]) * 1000);
  }
  const msMatch = trimmed.match(/^([\d.]+)ms$/i);
  if (msMatch) {
    return Math.ceil(parseFloat(msMatch[1]));
  }
  return undefined;
}

function extractRetryFromMessage(message: string): number | undefined {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000);
  }
  return undefined;
}

function extractRetryFromDetails(details: unknown): number | undefined {
  if (!Array.isArray(details)) return undefined;

  for (const detail of details) {
    if (
      detail &&
      typeof detail === "object" &&
      "@type" in detail &&
      String((detail as { "@type": string })["@type"]).includes(RETRY_INFO_TYPE)
    ) {
      const retryDelay = (detail as { retryDelay?: string }).retryDelay;
      if (retryDelay) {
        return parseDurationToMs(retryDelay);
      }
    }
  }

  return undefined;
}

function buildUserMessage(status: number | undefined, apiMessage: string): string {
  if (status === 429) {
    return "You've reached the Gemini API rate limit. Please wait a moment before trying again.";
  }
  if (status === 503) {
    return "The AI service is temporarily unavailable. Please try again shortly.";
  }
  if (apiMessage.length > 200 || apiMessage.startsWith("{")) {
    return "The AI service returned an error. Please try again.";
  }
  return apiMessage;
}

function parseApiErrorPayload(payload: unknown): ParsedGeminiError | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const apiError = (root.error ?? root) as Record<string, unknown>;

  const status =
    typeof apiError.code === "number"
      ? apiError.code
      : typeof apiError.status === "number"
        ? apiError.status
        : undefined;

  const rawMessage =
    typeof apiError.message === "string" ? apiError.message : "Gemini API error";

  const retryAfterMs =
    extractRetryFromDetails(apiError.details) ??
    extractRetryFromMessage(rawMessage) ??
    undefined;

  return {
    status,
    rawMessage,
    userMessage: buildUserMessage(status, rawMessage),
    retryAfterMs,
    isRateLimited: status === 429,
  };
}

export function parseGeminiApiError(error: unknown): ParsedGeminiError {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (status === 429) {
      const message =
        error instanceof Error ? error.message : "Rate limit exceeded";
      const retryAfterMs = extractRetryFromMessage(message);
      return {
        status: 429,
        rawMessage: message,
        userMessage: buildUserMessage(429, message),
        retryAfterMs,
        isRateLimited: true,
      };
    }
  }

  const candidates: string[] = [];

  if (error instanceof Error) {
    candidates.push(error.message);
  }

  if (
    error &&
    typeof error === "object" &&
    "cause" in error &&
    error.cause instanceof Error
  ) {
    candidates.push(error.cause.message);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      const result = parseApiErrorPayload(parsed);
      if (result) return result;
    } catch {
      const retryAfterMs = extractRetryFromMessage(candidate);
      if (candidate.includes("429") || candidate.includes("RESOURCE_EXHAUSTED")) {
        return {
          status: 429,
          rawMessage: candidate,
          userMessage: buildUserMessage(429, candidate),
          retryAfterMs,
          isRateLimited: true,
        };
      }
    }
  }

  const fallbackMessage =
    error instanceof Error ? error.message : "Gemini API request failed";

  return {
    status: undefined,
    rawMessage: fallbackMessage,
    userMessage: buildUserMessage(undefined, fallbackMessage),
    isRateLimited: false,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
