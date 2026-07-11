import { NextResponse } from "next/server";
import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.string(),
});

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function apiError(
  message: string,
  status = 500,
  meta?: { retryAfterSeconds?: number }
) {
  return NextResponse.json(
    {
      success: false as const,
      error: message,
      ...(meta?.retryAfterSeconds != null
        ? { retryAfterSeconds: meta.retryAfterSeconds }
        : {}),
    },
    { status }
  );
}

export function isApiError(
  value: unknown
): value is { success: false; error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: boolean }).success === false &&
    "error" in value
  );
}

export function unwrapApiData<T>(value: unknown): T {
  if (isApiError(value)) {
    throw new Error(value.error);
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    (value as { success: boolean }).success === true
  ) {
    return (value as { data: T }).data;
  }

  return value as T;
}

export function ensureArray<T>(value: unknown, label = "data"): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value === null || value === undefined) return [];
  throw new TypeError(`Expected ${label} to be an array, received ${typeof value}`);
}
