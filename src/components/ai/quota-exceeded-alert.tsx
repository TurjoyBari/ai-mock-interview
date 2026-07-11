"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActionError } from "@/lib/ai/action-errors";

interface QuotaExceededAlertProps {
  message: string;
  retryAfterSeconds?: number;
  onRetry: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
}

function QuotaCountdown({
  retryAfterSeconds,
  onRetry,
  isRetrying,
}: {
  retryAfterSeconds: number;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSeconds);
  const autoRetriedRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!autoRetriedRef.current && !isRetrying) {
        autoRetriedRef.current = true;
        onRetry();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isRetrying, onRetry]);

  return (
    <>
      {secondsLeft > 0 && (
        <p className="text-sm font-medium">
          Retrying automatically in{" "}
          <span className="tabular-nums text-foreground">{secondsLeft}s</span>…
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onRetry}
          disabled={isRetrying || secondsLeft > 0}
        >
          {isRetrying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Now
            </>
          )}
        </Button>
      </div>
    </>
  );
}

export function QuotaExceededAlert({
  message,
  retryAfterSeconds = 60,
  onRetry,
  onDismiss,
  isRetrying = false,
}: QuotaExceededAlertProps) {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              AI Rate Limit Reached
            </p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <QuotaCountdown
              key={`${message}:${retryAfterSeconds}`}
              retryAfterSeconds={retryAfterSeconds}
              onRetry={onRetry}
              isRetrying={isRetrying}
            />
          </div>
        </div>
        {onDismiss && (
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof ActionError && error.isRateLimited) return true;

  if (
    error &&
    typeof error === "object" &&
    "isRateLimited" in error &&
    (error as { isRateLimited: boolean }).isRateLimited
  ) {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.message.includes("rate limit") ||
      error.message.includes("Rate Limit") ||
      error.message.includes("429") ||
      error.message.includes("RESOURCE_EXHAUSTED") ||
      error.message.includes("quota")
    );
  }

  return false;
}

export function getDisplayErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^\[retry:\d+\]\s*/, "");
  }
  return "Something went wrong. Please try again.";
}

export function extractRetrySeconds(error: unknown): number {
  if (error instanceof ActionError && error.retryAfterSeconds) {
    return error.retryAfterSeconds;
  }

  if (error instanceof Error) {
    const encoded = error.message.match(/^\[retry:(\d+)\]/);
    if (encoded) return parseInt(encoded[1], 10);
    const match = error.message.match(/retry in ([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1]));
  }

  return 60;
}
