import { GeminiError } from "@/lib/gemini";

export class ActionError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds?: number,
    public readonly status?: number
  ) {
    super(
      retryAfterSeconds != null
        ? `[retry:${retryAfterSeconds}] ${message}`
        : message
    );
    this.name = "ActionError";
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export function isActionError(error: unknown): error is ActionError {
  return error instanceof ActionError;
}

export function toActionError(error: unknown): ActionError {
  if (error instanceof ActionError) return error;

  if (error instanceof GeminiError) {
    const retryAfterSeconds = error.retryAfterMs
      ? Math.ceil(error.retryAfterMs / 1000)
      : undefined;

    const userMessage =
      error.userMessage ??
      "The AI service is temporarily busy. Please wait and try again.";

    return new ActionError(userMessage, retryAfterSeconds, error.status);
  }

  if (error instanceof Error) {
    const parsed = error.message.match(/^\[retry:(\d+)\]\s*/);
    if (parsed) {
      return new ActionError(
        error.message.replace(/^\[retry:\d+\]\s*/, ""),
        parseInt(parsed[1], 10)
      );
    }
    return new ActionError(error.message);
  }

  return new ActionError("Something went wrong. Please try again.");
}

export function formatActionErrorMessage(
  message: string,
  retryAfterSeconds?: number
): string {
  return retryAfterSeconds
    ? `[retry:${retryAfterSeconds}] ${message}`
    : message;
}

export function getRetryAfterSeconds(error: unknown): number | undefined {
  if (error instanceof ActionError) return error.retryAfterSeconds;
  if (error instanceof GeminiError && error.retryAfterMs) {
    return Math.ceil(error.retryAfterMs / 1000);
  }
  return undefined;
}
